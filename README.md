<p align="center">
  <img src="https://img.shields.io/badge/VyaparIQ-Shop%20Smarter.%20Spend%20Wiser.-F97316?style=for-the-badge&logoColor=white" alt="VyaparIQ" />
</p>

<h1 align="center">🛒 VyaparIQ</h1>

<p align="center">
  <strong>AI-Powered Smart Shopping Assistant — Budget tracking, intelligent recommendations, and real-time spending analytics.</strong>
</p>

<p align="center">
  <a href="https://vyapariq.web.app/">🌐 Live Demo</a> &nbsp;•&nbsp;
  <a href="#-features">✨ Features</a> &nbsp;•&nbsp;
  <a href="#%EF%B8%8F-tech-stack">🛠️ Tech Stack</a> &nbsp;•&nbsp;
  <a href="#-architecture">🏗️ Architecture</a> &nbsp;•&nbsp;
  <a href="#-quick-start">🚀 Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker" />
  <img src="https://img.shields.io/badge/Gemini-AI-886FBF?style=flat-square&logo=google" />
  <img src="https://img.shields.io/badge/Deployed-Firebase%20+%20Cloud%20Run-FFCA28?style=flat-square&logo=firebase" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Authentication](#-authentication)
- [AI Capabilities](#-ai-capabilities)
- [Admin Panel](#-admin-panel)
- [Deployment](#-deployment)
- [Makefile Commands](#-makefile-commands)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🎯 Overview

**VyaparIQ** is a full-stack, AI-powered e-commerce platform that transforms the way people shop online. It combines real-time budget tracking, predictive spending analytics, and an AI shopping assistant (**Vyra**) powered by Google Gemini to help users **shop smarter and spend wiser**.

Whether it's scanning a product with your camera, getting intelligent cheaper alternatives, or tracking monthly expenses with rich analytics — VyaparIQ is the shopping companion that keeps your wallet happy.

---

## 🌐 Live Demo

> **🔗 [vyapariq.web.app](https://vyapariq.web.app/)**
>
> Frontend hosted on **Firebase Hosting** · Backend running on **Google Cloud Run**

| Role | Credentials |
|------|-------------|
| **Customer** | Sign up for free or use Google OAuth |
| **Admin** | Email: `admin@vyapariq.com` · Password: `Admin@1234` |

---

## ✨ Features

### 🛍️ Customer Experience
| Feature | Description |
|---------|-------------|
| **Smart Dashboard** | Personalized overview with spending insights, budget status, and quick actions |
| **Product Catalog** | Browse 500+ products with ratings, reviews, badges, and category filters |
| **AI Shopping Assistant (Vyra)** | Gemini-powered chatbot for budget queries, deal recommendations, and cart help — supports English, Hindi & Hinglish |
| **Camera Product Scanner** | Point your camera → AI identifies the product → auto-adds to cart |
| **Barcode Scanner** | Scan product barcodes using html5-qrcode for instant lookup & add-to-cart |
| **Real-Time Budget Tracking** | Set monthly limits with customizable alert thresholds (default 80%) |
| **Predictive Budget Warnings** | AI predicts if you'll exceed your budget based on spending rate |
| **Cheaper Alternatives** | Automatically suggests cheaper alternatives for cart items (savings > ₹10) |
| **Spending Analytics** | Rich charts with Recharts — category breakdown, monthly trends, session history |
| **Order Management** | Full order lifecycle — place, track, view history, and confirmation pages |
| **Invoice Generation** | Auto-generated PDF invoices (jsPDF) downloadable for every order |
| **Dark Mode** | Beautiful dark/light theme toggle persisted across sessions |
| **Google OAuth** | One-click sign-in via Google with Passport.js integration |
| **Family Panel** | Shared shopping management for family members |

### 🔧 Admin Panel
| Feature | Description |
|---------|-------------|
| **Admin Dashboard** | Real-time metrics — revenue, orders, users, inventory health |
| **Product Management** | Full CRUD — add, edit, delete products with image uploads |
| **Order Management** | View, update status, and manage all customer orders |
| **Inventory Control** | Track stock levels, low-stock alerts, and reorder management |
| **Invoice Manager** | Generate and manage invoices with Google Cloud Storage integration |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI library with latest concurrent features |
| **TypeScript** | Type safety across the entire frontend |
| **Vite 6** | Lightning-fast HMR and build tooling |
| **Tailwind CSS** | Utility-first styling framework |
| **Zustand** | Lightweight, hooks-based state management (13 stores) |
| **Framer Motion** | Smooth animations and page transitions |
| **Recharts** | Data visualization for analytics dashboards |
| **Lucide React** | Modern icon system |
| **html5-qrcode** | Browser-native barcode/QR scanning |
| **jsPDF** | Client-side PDF invoice generation |
| **React Router v7** | Client-side routing with protected routes |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | RESTful API server |
| **PostgreSQL 15** | Primary relational database with `pg_trgm` for fuzzy search |
| **Redis 7** | Session cache, token blacklisting, and cart caching |
| **Passport.js** | JWT + Google OAuth 2.0 authentication |
| **Bcrypt.js** | Secure password hashing |
| **Helmet** | HTTP security headers |
| **Express Rate Limiter** | API rate limiting (auth: 20/15min, API: 200/min, AI: 30/min) |
| **Multer** | File upload handling for product images |
| **PDFKit** | Server-side invoice PDF generation |
| **Google Cloud Storage** | Cloud storage for product images and invoices |

### AI Service
| Technology | Purpose |
|-----------|---------|
| **Python + FastAPI** | High-performance async AI microservice |
| **Google Gemini API** | Powers Vyra chatbot, vision detection, and predictions |
| **Gemini Vision** | Camera-based product identification |
| **Levenshtein Distance** | Fuzzy product name matching for vision results |
| **httpx** | Async HTTP client for Gemini API calls |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Docker Compose** | Multi-container orchestration (6 services) |
| **Nginx** | Reverse proxy and load balancer |
| **Firebase Hosting** | Frontend CDN deployment |
| **Google Cloud Run** | Backend containerized deployment |
| **Firebase Rewrites** | API routing from frontend domain to Cloud Run backend |

---

## 🏗️ Architecture

```
                      ┌──────────────────────────────────┐
                      │        Firebase Hosting           │
                      │    vyapariq.web.app (CDN)         │
                      └──────────┬───────────────────────┘
                                 │
                      ┌──────────▼───────────────────────┐
                      │       Firebase Rewrites           │
                      │  /api/** → Cloud Run Backend      │
                      │  /**    → index.html (SPA)        │
                      └──────────┬───────────────────────┘
                                 │
           ┌─────────────────────▼──────────────────────┐
           │              Nginx Reverse Proxy            │
           │                  (port 80)                  │
           └────┬──────────────┬──────────────────┬─────┘
                │              │                  │
     ┌──────────▼──┐  ┌───────▼───────┐  ┌───────▼───────┐
     │  Frontend   │  │   Backend     │  │  AI Service   │
     │  React+Vite │  │  Express.js   │  │   FastAPI     │
     │  :5173      │  │  :5000        │  │   :8000       │
     └─────────────┘  └───┬───────┬───┘  └───────────────┘
                          │       │
               ┌──────────▼──┐ ┌──▼──────────┐
               │ PostgreSQL  │ │    Redis     │
               │  :5432      │ │   :6379     │
               └─────────────┘ └─────────────┘
```

### Service Port Mapping

| Service | Internal Port | External Port |
|---------|:---:|:---:|
| Frontend (React + Vite) | 5173 | 5174 |
| Backend (Express) | 5000 | 5001 |
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6380 |
| AI Service (FastAPI) | 8000 | 8003 |
| Nginx (Proxy) | 80 | 80 |

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** installed
- **Git** installed
- (Optional) **Google Cloud** credentials for OAuth & Gemini AI

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/VyaparIQ.git
cd VyaparIQ
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your secrets — at minimum:
```env
JWT_SECRET=your-long-random-secret
SESSION_SECRET=another-long-random-secret
GEMINI_API_KEY=your-gemini-api-key       # Get from https://aistudio.google.com
GOOGLE_CLIENT_ID=your-oauth-client-id    # Optional — for Google sign-in
GOOGLE_CLIENT_SECRET=your-oauth-secret   # Optional — for Google sign-in
```

### 3. Launch with Docker

```bash
docker compose up --build -d
```

### 4. Access the App

| URL | Description |
|-----|-------------|
| [http://localhost:5174](http://localhost:5174) | Frontend |
| [http://localhost:5001/api/health](http://localhost:5001/api/health) | Backend Health Check |
| [http://localhost:8003/ai/health](http://localhost:8003/ai/health) | AI Service Health |
| [http://localhost:80](http://localhost:80) | Nginx (unified proxy) |

> 💡 The database is auto-seeded with 500+ products and sample data on first launch.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|:---:|-------------|
| `POSTGRES_USER` | ✅ | PostgreSQL username (default: `vyapariq`) |
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `POSTGRES_DB` | ✅ | Database name (default: `vyapariq`) |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens |
| `SESSION_SECRET` | ✅ | Secret for OAuth session cookies |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS (default: `http://localhost:5174`) |
| `GEMINI_API_KEY` | ⭐ | Google Gemini API key — powers AI features |
| `GEMINI_MODEL` | ❌ | Gemini model (default: `gemini-2.0-flash`) |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | ❌ | OAuth callback URL |

> ⭐ = Highly recommended for full experience. AI features fall back to rule-based responses without it.

---

## 🔒 Authentication

VyaparIQ implements a **dual-auth system** with role-based access control:

```
┌─────────────────────────────────────────────┐
│              Authentication Flow             │
├─────────────────────────────────────────────┤
│                                             │
│  Email/Password ──→ Bcrypt Hash ──→ JWT     │
│                                     │       │
│  Google OAuth ──→ Passport.js ──→ JWT       │
│                                     │       │
│                              ┌──────▼─────┐ │
│                              │   Redis    │ │
│                              │ Blacklist  │ │
│                              └────────────┘ │
└─────────────────────────────────────────────┘
```

- **JWT Tokens** — Signed with `JWT_SECRET`, used for all API authentication
- **Google OAuth 2.0** — Seamless one-click sign-in via Passport.js
- **Token Blacklisting** — Logout invalidates tokens in Redis for true session termination
- **Rate Limiting** — Auth endpoints limited to 20 requests per 15 minutes
- **Role-Based Access** — `user` and `admin` roles with separate protected routes

---

## 🤖 AI Capabilities

VyaparIQ is powered by **three AI modules**, all driven by Google Gemini:

### 1. 💬 Vyra — AI Shopping Assistant
- Natural language chatbot integrated into the shopping experience
- **Multilingual** — understands English, Hindi, and Hinglish naturally
- Context-aware responses using cart total, budget, and item count
- Falls back to rule-based responses when Gemini API is unavailable
- Knows about active coupon codes and can provide deal recommendations

### 2. 📷 Vision Product Detection
- Upload a product photo → Gemini Vision identifies the item
- **Multi-strategy matching** — exact match → fuzzy (Levenshtein) → category fallback
- Automatically adds recognized products to cart
- Handles ambiguous matches by presenting user with options
- Confidence scoring for detection accuracy

### 3. 📊 Predictive Budget Warnings
- Analyzes spending rate and projects future cart totals
- **Proactive alerts** before users exceed their budget
- Confidence-based messaging (30%–95%) depending on budget utilization
- Real-time "items remaining" estimate at current spending pace

---

## 🔑 Admin Panel

Access the admin panel at [`/admin/login`](https://vyapariq.web.app/admin/login)

| Field | Value |
|-------|-------|
| **URL** | [vyapariq.web.app/admin/login](https://vyapariq.web.app/admin/login) |
| **Email** | `admin@vyapariq.com` |
| **Password** | `Admin@1234` |

**Capabilities:**
- 📊 **Dashboard** — Real-time revenue, order count, user metrics, and inventory health
- 📦 **Products** — Full CRUD with image uploads, stock management, and pricing
- 🛒 **Orders** — View all orders, update statuses, and manage fulfillment
- 📋 **Inventory** — Low-stock alerts, stock level tracking, and bulk management
- 🧾 **Invoices** — Generate, view, and manage customer invoices

---

## ☁️ Deployment

### Production Architecture

| Component | Platform | Details |
|-----------|----------|---------|
| **Frontend** | Firebase Hosting | Static SPA with CDN distribution |
| **Backend** | Google Cloud Run | Containerized Node.js + Express |
| **AI Service** | Google Cloud Run | Containerized Python + FastAPI |
| **Database** | Cloud SQL (PostgreSQL) | Managed PostgreSQL instance |
| **Cache** | Memorystore (Redis) | Managed Redis instance |
| **Storage** | Google Cloud Storage | Product images & invoice PDFs |

### Deploy Frontend to Firebase

```bash
# Build the production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Deploy Backend to Cloud Run

```bash
# Build and push the Docker image
docker build -t gcr.io/YOUR_PROJECT/vyapariq-backend -f backend/Dockerfile.prod ./backend
docker push gcr.io/YOUR_PROJECT/vyapariq-backend

# Deploy to Cloud Run
gcloud run deploy vyapariq-backend \
  --image gcr.io/YOUR_PROJECT/vyapariq-backend \
  --region us-central1 \
  --allow-unauthenticated
```

---

## ⚡ Makefile Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all containers in detached mode |
| `make down` | Stop all containers |
| `make build` | Build all images |
| `make rebuild` | Build + start in one command |
| `make restart` | Restart all services |
| `make logs` | Tail logs for all services |
| `make logs-backend` | Tail backend logs only |
| `make logs-ai` | Tail AI service logs only |
| `make shell-backend` | Open shell in backend container |
| `make shell-postgres` | Open psql in Postgres container |
| `make shell-redis` | Open redis-cli in Redis container |
| `make status` | Show container status + health checks |
| `make clean` | Nuclear clean — remove containers, volumes, and images |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login with email/password |
| `GET` | `/api/auth/google` | Initiate Google OAuth |
| `GET` | `/api/auth/google/callback` | OAuth callback |

### Products & Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/cart` | Get user's cart |
| `POST` | `/api/cart` | Add item to cart |
| `DELETE` | `/api/cart/:id` | Remove item from cart |

### AI Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat-agent` | Chat with Vyra AI |
| `POST` | `/api/vision-product` | Camera product detection |
| `GET` | `/ai/health` | AI service health check |
| `POST` | `/ai/suggest` | Get cheaper alternatives |
| `POST` | `/ai/predict` | Predictive budget warning |

### Orders & Budget
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Get user's orders |
| `POST` | `/api/orders` | Place an order |
| `GET` | `/api/budget` | Get budget settings |
| `PUT` | `/api/budget` | Update budget settings |
| `GET` | `/api/invoices/:orderId` | Download invoice PDF |

---

## 🧪 Troubleshooting

<details>
<summary><strong>🔴 Google OAuth not working?</strong></summary>

1. Add `http://localhost:5001/api/auth/google/callback` to **Authorized redirect URIs** in [Google Cloud Console](https://console.cloud.google.com/)
2. Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
3. For production, update the callback URL to your deployed domain
</details>

<details>
<summary><strong>🔴 "Invalid Credentials" on Admin login?</strong></summary>

The admin account is seeded on first launch. If credentials aren't working:
```bash
docker compose down -v        # Wipe volumes to reset DB
docker compose up --build -d  # Rebuild with fresh seed data
```
Default admin: `admin@vyapariq.com` / `Admin@1234`
</details>

<details>
<summary><strong>🔴 Backend not starting?</strong></summary>

Check logs for missing environment variables:
```bash
docker compose logs backend
```
The startup validator will tell you exactly which variables are missing.
</details>

<details>
<summary><strong>🔴 AI features returning generic responses?</strong></summary>

1. Ensure `GEMINI_API_KEY` is set in `.env`
2. Verify the key at [aistudio.google.com](https://aistudio.google.com/app/apikey)
3. Check AI service logs: `docker compose logs ai-service`
4. Without a valid API key, Vyra uses rule-based fallback responses
</details>

<details>
<summary><strong>🔴 Camera scanner not working?</strong></summary>

- Camera access requires HTTPS in production (works on localhost)
- Ensure browser permissions are granted for camera access
- The Vision API requires a valid `GEMINI_API_KEY`
</details>

---

## 📂 Project Structure

```
VyaparIQ/
├── src/                    # React Frontend
│   ├── components/         # Reusable UI components
│   │   ├── admin/          #   Admin panel components
│   │   ├── auth/           #   Auth guards (ProtectedRoute, AdminRoute)
│   │   ├── cart/           #   Cart drawer & items
│   │   ├── chat/           #   Vyra AI chatbot widget
│   │   ├── checkout/       #   Checkout flow
│   │   ├── family/         #   Family sharing panel
│   │   ├── layout/         #   App shell, navbar, sidebar
│   │   ├── scanner/        #   Barcode & camera scanner
│   │   └── ui/             #   Base UI primitives
│   ├── pages/              # Route-level page components
│   │   ├── admin/          #   Admin dashboard, products, orders, inventory
│   │   ├── analytics/      #   Spending analytics & charts
│   │   ├── auth/           #   Login, signup, OAuth success
│   │   ├── cart/           #   Cart page
│   │   ├── checkout/       #   Checkout page
│   │   ├── dashboard/      #   Customer dashboard
│   │   ├── orders/         #   Order history & tracking
│   │   ├── product/        #   Product detail page
│   │   ├── profile/        #   User profile & settings
│   │   └── shop/           #   Product catalog
│   ├── store/              # Zustand state management (13 stores)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── constants/          # App constants
├── backend/                # Node.js API Server
│   ├── routes/             # Express route handlers (11 modules)
│   ├── controllers/        # Business logic
│   ├── middleware/          # Auth, validation middleware
│   ├── config/             # Passport, branding config
│   ├── db/                 # SQL schemas, seeds & migrations
│   ├── ai/                 # Server-side AI integration
│   └── utils/              # Helper utilities
├── ai-service/             # Python AI Microservice
│   └── main.py             # FastAPI app — suggest, predict, chat
├── nginx/                  # Reverse proxy configuration
├── docker-compose.yml      # Multi-service orchestration
├── firebase.json           # Firebase Hosting + Cloud Run rewrites
├── Dockerfile              # Frontend container
├── Makefile                # Developer workflow commands
└── .env.example            # Environment variable template
```

---

## 🐛 Report a Bug

Found a bug or have suggestions? We'd love to hear from you!

<p align="center">
  <a href="https://forms.gle/yisY7H52gsypULRT6">
    <img src="https://img.shields.io/badge/📋_Report_a_Bug-Google_Form-4285F4?style=for-the-badge&logo=googleforms&logoColor=white" alt="Report Bug" />
  </a>
</p>

| Channel | Link |
|---------|------|
| **Bug Report Form** | [forms.gle/yisY7H52gsypULRT6](https://forms.gle/yisY7H52gsypULRT6) |
| **Email** | [abhishekswami.dev@gmail.com](mailto:abhishekswami.dev@gmail.com) |

---

## 📄 License

```
© 2025-2026 Abhishek Swami. All Rights Reserved.

This project and its source code are proprietary and confidential.
Unauthorized copying, distribution, modification, or use of this
software, in whole or in part, is strictly prohibited without
prior written permission from the author.

For inquiries, contact: abhishekswami.dev@gmail.com
```

---

<p align="center">
  <strong>Built with ❤️ by Abhishek Swami</strong><br/>
  React · Node.js · FastAPI · Google Gemini AI
</p>

<p align="center">
  <a href="https://vyapariq.web.app/">🌐 Visit VyaparIQ</a> &nbsp;•&nbsp;
  <a href="https://forms.gle/yisY7H52gsypULRT6">🐛 Report Bug</a> &nbsp;•&nbsp;
  <a href="mailto:abhishekswami.dev@gmail.com">✉️ Contact</a>
</p>