<div align="center">
  <a href="." target="_blank">
    <img src="https://res.cloudinary.com/dhl04adhz/image/upload/v1763275245/logo_demicy.png" alt="SceneAds Logo" height="84" />
  </a>
  <h1>sceneAds – Ad Management Platform (Backend)</h1>

  <p><em>A robust, modular backend powering an ad management e‑commerce platform. Built for teams, designed to scale.</em></p>

  <p>
    <img alt="Node" src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Express" src="https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express&logoColor=white" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
    <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
    <img alt="WS" src="https://img.shields.io/badge/WebSocket-WS-2C3E50?style=for-the-badge" />
  </p>
</div>

---

## Features

- **User Authentication & Management** – Secure registration, login, profile management with role‑based access control (RBAC).
- **Ad Campaign Management** – Create, manage, and monitor advertising campaigns.
- **Banner Management** – Upload and manage ad banners.
- **Bundle & Screen Management** – Group ads into bundles and manage screen placements.
- **Payment Processing** – Stripe integration for secure transactions.
- **Real‑time Chat System** (WebSocket)  
  - JWT‑based auth for WS connections  
  - Live messaging (one‑to‑one)  
  - Message persistence & history fetching  
  - Instant notifications on new messages
- **Scheduled Tasks** – Cron jobs for automated tasks (e.g., campaign status updates).
- **File Storage** – Supabase for cloud file storage (images/videos/docs).

---

## Technologies

- **Backend:** Node.js, Express.js, TypeScript  
- **Database:** PostgreSQL + Prisma ORM  
- **Auth:** JWT (JSON Web Tokens)  
- **Storage:** Supabase  
- **Payments:** Stripe  
- **Realtime:** `ws` (WebSocket)  
- **Scheduling:** `node-cron`

---

## Getting Started

Follow these steps to run the project locally for development/testing.

### Prerequisites
- [Node.js](https://nodejs.org/) **v22+**
- [npm](https://www.npmjs.com/) (or pnpm/yarn)
- [PostgreSQL](https://www.postgresql.org/)

### 1) Clone & Install

```bash
git clone <repository-url>
cd danaj242-backend
npm install
```

### 2) Environment Variables

Create a `.env` file in the repo root and fill in your credentials:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1d"

# Supabase
SUPABASE_URL="your-supabase-project-url"
SUPABASE_KEY="your-supabase-api-key"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"

# Email (Nodemailer)
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-password"
```

### 3) Database Setup

```bash
# Apply migrations (production-safe)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### 4) Run

**Development**
```bash
npm run dev
# Restarts on file changes
```

**Production**
```bash
npm run build
npm run start:prod
```

---

## API Endpoints (High Level)

- `POST /api/v1/auth/*` – Authentication & user login
- `GET/POST/PUT/DELETE /api/v1/users/*` – User management
- `GET/POST/PUT/DELETE /api/v1/banners/*` – Banner management
- `GET/POST/PUT/DELETE /api/v1/bundles/*` – Bundle management
- `GET/POST/PUT/DELETE /api/v1/campaigns/*` – Campaign management
- `GET/POST /api/v1/payments/*` – Payment processing (Stripe)
- `GET/POST/PUT/DELETE /api/v1/screens/*` – Screen management
- `POST /api/v1/get-in-touch` – Contact/lead forms

> **Realtime Chat (WebSocket):** JWT‑authenticated socket with events for `new_message`, `message_sent`, `fetch_history`, and user notifications.

---

## Project Structure

```bash
src/
├─ app/
│  ├─ constants/        # Application-wide constants
│  ├─ middlewares/      # Custom Express middlewares
│  ├─ modules/          # Core feature modules (Auth, User, Campaign, etc.)
│  └─ routes/           # Main API router
├─ config/              # Configuration (dotenv, prisma, etc.)
├─ cron/                # Scheduled cron jobs
├─ helpers/             # Helper functions
├─ shared/              # Shared utils (catchAsync, sendResponse, etc.)
├─ utils/               # Misc utilities
├─ app.ts               # Express app setup
└─ server.ts            # Server entry point
```

> Note: ensure directory names match your actual repo (e.g., `cron` vs `corn`).

---

## Development Tips

- Use **strict TypeScript** and **ESLint** for reliability.
- Keep long‑running/expensive reads over **HTTP** with pagination; use **WebSocket** for push events (new messages, notifications).
- Add **indexes** on frequently queried columns (e.g., message timestamps, foreign keys).
- Prefer **cursor (keyset) pagination** for chat/message history.

---

## License

This repository is part of a team project. If you plan to reuse code, ensure you inform me  first and follow contribution guidelines.
