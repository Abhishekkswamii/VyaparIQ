import os
import httpx
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="VyaparIQ AI Service")


# ── Models ───────────────────────────────────────────────────

class CartItemIn(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    category: str
    cheaperAlternativeId: Optional[str] = None


class AlternativeProduct(BaseModel):
    id: str
    name: str
    price: float


class Suggestion(BaseModel):
    original_item: CartItemIn
    alternative: AlternativeProduct
    savings: float


class SuggestRequest(BaseModel):
    cart_items: List[CartItemIn]
    budget_remaining: float
    products_catalog: Optional[List[dict]] = None


class SuggestResponse(BaseModel):
    suggestions: List[Suggestion]


# ── Endpoints ────────────────────────────────────────────────

@app.get("/ai/health")
async def health():
    return {"status": "ok", "service": "vyapariq-ai"}


@app.post("/ai/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest):
    """
    For each cart item that has a cheaper_alternative_id, check if
    the price difference > ₹10. If so, include it as a suggestion.
    Expects products_catalog to contain all products so we can look up
    alternatives by id. If catalog is missing, returns empty.
    """
    suggestions: List[Suggestion] = []
    catalog = {str(p["id"]): p for p in (req.products_catalog or [])}

    for item in req.cart_items:
        alt_id = item.cheaperAlternativeId
        if not alt_id or alt_id not in catalog:
            continue
        alt = catalog[alt_id]
        savings = item.price - float(alt["price"])
        if savings > 10:
            suggestions.append(
                Suggestion(
                    original_item=item,
                    alternative=AlternativeProduct(
                        id=str(alt["id"]),
                        name=alt["name"],
                        price=float(alt["price"]),
                    ),
                    savings=savings,
                )
            )

    return SuggestResponse(suggestions=suggestions)


# ── Predictive Budget Warning ────────────────────────────────

class PredictRequest(BaseModel):
    current_spent: float
    budget: float
    item_count: int
    average_item_price: float
    next_item_price: Optional[float] = None


class PredictResponse(BaseModel):
    will_exceed: bool
    projected_total: float
    remaining_items: int
    confidence: float
    message: str


@app.post("/ai/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """
    Predicts if the user will exceed their budget based on
    current spending rate and average item price.
    """
    if req.budget <= 0:
        return PredictResponse(
            will_exceed=False,
            projected_total=req.current_spent,
            remaining_items=0,
            confidence=0,
            message="No budget set.",
        )

    avg = req.average_item_price if req.average_item_price > 0 else 100
    remaining_budget = req.budget - req.current_spent

    # If adding next item will exceed
    next_price = req.next_item_price or avg
    after_next = req.current_spent + next_price

    # Estimate how many more items can fit
    remaining_items = max(0, int(remaining_budget / avg)) if avg > 0 else 0

    # Project total if user keeps adding at same rate
    if req.item_count > 0:
        rate = req.current_spent / req.item_count
        # Assume user adds ~3 more items at average rate
        projected_total = req.current_spent + (rate * 3)
    else:
        projected_total = req.current_spent

    will_exceed = after_next > req.budget or projected_total > req.budget
    pct_used = req.current_spent / req.budget

    # Confidence based on how close to budget
    if pct_used > 0.9:
        confidence = 0.95
    elif pct_used > 0.7:
        confidence = 0.75
    elif pct_used > 0.5:
        confidence = 0.5
    else:
        confidence = 0.3

    if after_next > req.budget:
        message = f"Adding this item will exceed your budget by ₹{after_next - req.budget:.0f}."
    elif projected_total > req.budget:
        message = f"At current pace, you'll exceed budget. ~{remaining_items} items left."
    elif pct_used > 0.7:
        message = f"Budget is {pct_used*100:.0f}% used. ~{remaining_items} items left at avg price."
    else:
        message = f"You're on track. ~{remaining_items} more items fit in budget."

    return PredictResponse(
        will_exceed=will_exceed,
        projected_total=round(projected_total, 2),
        remaining_items=remaining_items,
        confidence=round(confidence, 2),
        message=message,
    )


# ── Vyra Chatbot ────────────────────────────────────────────

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

VYRA_SYSTEM_PROMPT = """You are Vyra, VyaparIQ's smart AI shopping assistant.
Answer shopping questions concisely (1-3 sentences).
You understand English, Hindi, and Hinglish naturally.
Context will include cart total, budget, and item count.
Use emojis naturally. Never use markdown formatting.
If asked about specific products, explain you handle that via the main chat."""

VYRA_FALLBACK_RULES = [
    (["hello", "hi", "hey", "namaste"], "Hey there! 👋 I'm Vyra, your smart shopping assistant. Ask me about your cart, budget, or deals!"),
    (["budget", "paisa", "bacha"], "Budget status: ₹{cart_total:.0f} spent of ₹{budget:.0f}. {remaining_msg}"),
    (["cart", "items", "kya hai"], "You have {item_count} items in your cart totalling ₹{cart_total:.0f}."),
    (["deal", "offer", "coupon", "discount"], "Try: FRESH10 (10% off fruits), DAIRY15 (15% off dairy), SAVE50 (₹50 off ₹500+), MEGA20 (20% off ₹1000+)!"),
    (["help", "madad"], "I can help with budget tracking, coupon codes, cheaper alternatives, and cart summaries. Just ask!"),
    (["thank", "thanks", "shukriya"], "You're welcome! Happy shopping! 🛒"),
]


async def call_gemini_chat(message: str, cart_total: float, budget: float, item_count: int, history: list) -> Optional[str]:
    """Call Gemini API for conversational response."""
    if not GEMINI_API_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    contents = []
    for h in (history or [])[-8:]:
        contents.append({"role": h.role if h.role in ("user", "model") else "user", "parts": [{"text": h.content}]})
    context = f"Cart: {item_count} items, ₹{cart_total:.0f} total. Budget: ₹{budget:.0f} (remaining: ₹{max(0, budget - cart_total):.0f})."
    contents.append({"role": "user", "parts": [{"text": f"{context}\nUser: {message}"}]})

    payload = {
        "systemInstruction": {"parts": [{"text": VYRA_SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 200},
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                return None
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    cart_total: float = 0
    budget: float = 0
    item_count: int = 0
    history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    reply: str


@app.post("/ai/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Try Gemini first
    gemini_reply = await call_gemini_chat(
        req.message, req.cart_total, req.budget, req.item_count, req.history or []
    )
    if gemini_reply:
        return ChatResponse(reply=gemini_reply)

    # Rule-based fallback (no API key or Gemini unavailable)
    msg = req.message.lower().strip()
    for keywords, template in VYRA_FALLBACK_RULES:
        if any(kw in msg for kw in keywords):
            remaining = req.budget - req.cart_total
            remaining_msg = (
                f"You have ₹{remaining:.0f} remaining."
                if remaining > 0
                else f"You're ₹{abs(remaining):.0f} over budget!"
            )
            reply = template.format(
                cart_total=req.cart_total,
                budget=req.budget,
                item_count=req.item_count,
                remaining_msg=remaining_msg,
            )
            return ChatResponse(reply=reply)

    return ChatResponse(reply="I can help with budget tracking, deals, and cart questions. What would you like to know?")
