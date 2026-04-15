# 🛒 Smart Cart — Phase 1

AI-powered smart shopping cart application.

## Quick Start (Docker)

```bash
docker-compose up --build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

- **React 19** + **Vite 6** — TypeScript SPA
- **React Router 7** — Client-side routing
- **Tailwind CSS 3** — Styling
- **Zustand 5** — State management
- **Docker** — Containerization

## Project Structure

```
src/
├── pages/
│   ├── shop/ShopPage.tsx          # Product grid + cart bar
│   └── dashboard/DashboardPage.tsx # Placeholder (Phase 2)
├── components/
│   ├── cart/CartBar.tsx            # Fixed bottom cart bar
│   └── ui/ProductCard.tsx          # Product card component
├── data/
│   └── products.ts                # Dummy product catalog
├── store/
│   └── cart-store.ts              # Zustand cart state
├── lib/                           # Utilities (Phase 2+)
├── App.tsx                        # Router setup
├── main.tsx                       # Entry point
└── index.css                      # Tailwind imports
```

## Routes

- `/` → Redirects to `/shop`
- `/shop` → Product grid with cart
- `/dashboard` → Placeholder

## Development

Code changes in `src/` reflect instantly via Docker volume mounts + Vite HMR.
