# AFIN: A Friend In Need — Student Academic Portal

AFIN is a full-stack, student-powered academic platform built to centralize learning resources, campus updates, placements, student-to-student peer aid, and AI-driven academic assistance. It utilizes a monorepo structure with a Next.js App Router frontend and an Express.js backend, fully integrated with Supabase for authentication, real-time database tracking, and secure asset storage.

---

## Technical Architecture Overview

AFIN is engineered as a secure, high-performance monorepo deployed on Vercel as multi-service applications:

*   **Frontend**: Built on Next.js (React 19, TailwindCSS, and shadcn/ui). It manages authentication via Supabase SSR, utilizes a centralized PWA structure, integrates socket listeners for real-time notifications, and renders highly responsive layouts optimized with Geist typography.
*   **Backend**: A Node.js and Express.js server running with Socket.io for authenticated real-time private socket connections, Helmet for secure HTTP headers, and specialized rate-limiting configurations tailored per business logic route.
*   **Database & Storage**: A PostgreSQL instance managed via Supabase. It uses Row-Level Security (RLS) policies to isolate user records, custom SQL triggers, and strict folder-based policies within Supabase Storage (`afin-storage`).
*   **AI Engine**: Integrates Gemini AI models with dynamic function calling to interact directly with the database, optimized with a server-side round-robin API key rotation to secure against tier quotas.

---

## Core Systems & Deep Dive

### 1. Supabase SSR Auth & PKCE Callback Flow
Authentication is built with PKCE (Proof Key for Code Exchange) to secure the flow between the client, the provider (Google OAuth), and the server:
*   **Initiation**: The user clicks "Sign in with Google" on the client side, which calls `supabase.auth.signInWithOAuth()` using a browser client (`createBrowserClient`), saving the PKCE `code_verifier` securely inside client-side cookies.
*   **Callback**: Google redirects to Supabase, which then calls the Next.js API Route Handler at `/auth/callback?code=...`.
*   **Cookie Sync & Exchange**: The server handler creates an isolated `createServerClient` and executes `supabase.auth.exchangeCodeForSession(code)`. 
*   **Response Integration**: Because Next.js `cookies()` are read-only during standard redirects, our implementation instantiates `NextResponse.redirect` first, explicitly writes the resulting Supabase session cookies to the redirect headers, and returns it to the client, preventing authentication token drops on production servers.

### 2. Gemini Key Rotation & Function Calling
To maximize stability under usage spikes and high-frequency queries, the AI assistant utilizes:
*   **API Key Rotation**: The backend implements a round-robin selector that cycles through multiple Gemini API keys stored in `GEMINI_API_KEY`, dividing quota loads seamlessly across active keys.
*   **Function Calling (Database Tools)**: The Gemini AI engine acts as an autonomous agent. When a student asks about academic notes, placements, or assignments, Gemini triggers a structural function call (database search tool) to fetch real-time, context-aware information from Supabase tables instead of replying with stale or hallucinated data.

### 3. Authenticated Real-Time Sockets
Real-time messaging, requests, and notifications are powered by Socket.io, backed by strict server authentication:
*   **Auth Handshake Middleware**: Before accepting a socket connection, the Express server intercepts the client's handshake payload, reads the Supabase access token, and validates it against Supabase Auth (`supabase.auth.getUser()`).
*   **Room Isolation**: Once authenticated, sockets are confined to dedicated private rooms (`socket.join(userId)`) preventing unauthorized users from subscribing to other students' notifications or database activities.

### 4. Rate Limiting & API Security
Routes are tightly protected from abuse using `express-rate-limit` with specialized intervals:
*   `generalLimiter`: Handles profile, search, and general queries (max 100 requests / 15 mins).
*   `uploadLimiter`: Restricts document/ID-card uploads to prevent storage depletion (max 10 uploads / hour).
*   `aiLimiter`: Restricts AI chatbot requests (max 15 requests / hour).
*   `submissionLimiter`: Restricts posting content like notices and peer requests (max 20 requests / 15 mins).

---

## Database Schema & Storage Map

The database operates on Postgres with strict table schemas and storage bucket configurations outlined in `database_setup.sql`:

### Primary Tables
*   `public.users`: Contains UUID reference to `auth.users`, email, full name, PRN (Permanent Registration Number), role (`user`, `verified_student`, `admin`), and verification status (`pending`, `verified`, `rejected`).
*   `public.audit_logs`: Keeps track of administrative activities, logging `action`, `user_id`, `target_id`, and a `timestamp`.

### Supabase Storage Folders (`afin-storage`)
*   `/avatars`: Publicly accessible avatars, updateable only by the authenticated owner.
*   `/id_cards`: Protected student ID card uploads for admin verification.
*   `/lost_found`: Storage for images associated with lost items.
*   `/content`: Student-uploaded lecture notes, pyqs (previous year questions), and study material.

---

## Directory Structure

```text
AFIN/
├── backend/                  # Express.js REST API & Socket.io Server
│   ├── middleware/           # Rate limiters & custom security filters
│   ├── routes/               # Express routing (AI, admin, profile, market, etc.)
│   ├── utils/                # Helper files (Gemini handler, DB configurations)
│   ├── index.js              # Server entrypoint and Socket.io setups
│   └── package.json
│
├── frontend/                 # Next.js App Router (React 19)
│   ├── src/
│   │   ├── app/              # Routing pages & layouts (dashboard, profile, login)
│   │   ├── components/       # Custom UI components, notifications, and context providers
│   │   ├── hooks/            # Client-side react hooks (Socket connections, etc.)
│   │   └── lib/              # Client utilities & browser Supabase setup
│   ├── public/               # Static assets & PWA manifest
│   ├── package.json
│   └── tsconfig.json
│
├── vercel.json               # Multi-service monorepo routing for Vercel deployments
└── database_setup.sql        # Database initialization & storage RLS policies
```

---

## Local Setup & Environment Variables

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AFIN
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=key1,key2,key3
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 3. Database Migration
Execute the query inside `database_setup.sql` in your **Supabase SQL Editor** to establish the primary schema, RLS policies, and asset storage buckets.

---

## Running Locally

### Start Backend Server
```bash
cd backend
npm install
npm start
```
The server will run on `http://localhost:5000`.

### Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The App Router will launch on `http://localhost:3000`.

---

## Deployment Configuration

Vercel orchestrates the multi-service monorepo using `vercel.json` to map routing prefixes to their respective entry points:

```json
{
  "experimentalServices": {
    "frontend": {
      "entrypoint": "frontend",
      "routePrefix": "/",
      "framework": "nextjs"
    },
    "backend": {
      "entrypoint": "backend",
      "routePrefix": "/_/backend"
    }
  }
}
```

*   **Production URL Routing**: Direct web pages and interface assets are served at `/` through Next.js, while backend service API requests are securely forwarded to the Express instance via `/_/backend/api/...`.
