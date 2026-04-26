# VyaparIQ — Smart Shopping Assistant

VyaparIQ is a budget-aware shopping assistant that helps users track their spending in real-time, find cheaper alternatives, and manage their monthly budgets.

## 🚀 Quick Start (Any System)

1. **Clone the repository**
2. **Setup Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your secrets (JWT, Google OAuth, etc.).
3. **Launch with Docker**:
   ```bash
   docker compose up --build -d
   ```
4. **Access the app**:
   - Frontend: [http://localhost:5174](http://localhost:5174)
   - Admin Login: `admin@vyapariq.com` / `Admin@1234`

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend**: Node.js, Express, Passport.js (JWT & Google OAuth)
- **Database**: PostgreSQL
- **Cache**: Redis
- **AI Service**: Python, FastAPI
- **Proxy**: Nginx

---

## 🛡️ Authentication System
The system supports both Email/Password and Google OAuth.
- **Email/Password**: Uses Bcrypt for hashing and JWT for session management.
- **Google OAuth**: Integrated via Passport.js. Decodes JWT on the frontend via a specialized success handler.
- **Security**: Tokens are blacklisted in Redis on logout to ensure sessions are truly terminated.

---

## 🏗️ System Architecture & Ports

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| Frontend | 5173 | 5174 |
| Backend | 5000 | 5001 |
| Postgres | 5432 | 5433 |
| Redis | 6379 | 6380 |
| AI Service | 8000 | 8003 |
| Nginx | 80 | 80 |

---

## 🧪 Troubleshooting

**Google OAuth failing?**
- Make sure you added `http://localhost:5001/api/auth/google/callback` to your Google Cloud Console "Authorized redirect URIs".
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set in `.env`.

**"Invalid Credentials" on Admin login?**
- Ensure you have the latest `seed.sql` applied. If you already ran Docker, you may need to wipe the volume: `docker compose down -v`.

**Backend not starting?**
- Check logs: `docker compose logs backend`. It will tell you if any required environment variables are missing.