from fastapi import FastAPI

app = FastAPI(title="SmartCart AI Service")


@app.get("/ai/health")
async def health():
    return {"status": "ok", "service": "smartcart-ai"}
