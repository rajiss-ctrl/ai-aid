# AI-AID — Multi-Tenant AI SaaS Dashboard

A production-ready, multi-tenant SaaS platform that gives organizations a branded AI chat assistant with full usage tracking, billing, role-based access control, and an admin control panel — all under a single deployment.

---

## The Problem

Most teams that want to integrate an AI assistant into their workflow face the same friction: off-the-shelf AI tools are either consumer-grade (no access control, no usage visibility, no cost accountability) or enterprise-priced (locked behind vendor contracts). There is no middle ground for a small-to-medium organization that wants to:

- Deploy a private AI assistant for their team
- Control exactly how much the AI can be used (token quotas)
- Understand per-user and organization-wide usage and cost
- Manage members, roles, and billing from a single dashboard
- Tailor the AI's behavior to their specific industry (legal, medical, business)

**AI-AID solves this.** It is a self-hostable, multi-tenant SaaS dashboard that any organization can deploy, configure, and manage — without giving up control to a third-party AI vendor.

---

## Features

### AI Chat
- Real-time streaming chat powered by **Cloudflare Workers AI** (Llama 3.1 8B)
- Server-Sent Events (SSE) for token-by-token streaming
- Per-user **niche system** — the AI's system prompt adapts based on the user's assigned niche (Legal, Medical, Business, General)
- Full conversation history persisted per user per organization

### Multi-Tenancy & Auth
- Organizations are isolated by `orgId` — data never crosses tenant boundaries
- **NextAuth v5** with credentials (email + bcrypt password) and session management via Prisma adapter
- Role hierarchy: `OWNER` → `ADMIN` → `MEMBER`
- Token-based invite system — admins generate invite links with an expiry

### Token Quota & Billing
- Per-organization monthly token limits (configurable by admins)
- Automatic quota enforcement — requests are blocked at the API layer when the limit is exceeded
- **Stripe** integration for plan upgrades (FREE → PRO → ENTERPRISE)
- Stripe Customer Portal for self-serve subscription management
- Webhook handler for `checkout.session.completed` and `customer.subscription.*` events

### Admin Dashboard
- Organization settings: name, monthly token quota, default niche
- User management: view all members, assign niches, reset quotas, remove users
- Usage analytics: daily token trend (line chart), niche breakdown (donut chart), per-user usage table with cost estimates
- CSV export of usage and user data

### User Dashboard
- Personal usage stats: tokens used, estimated cost, quota remaining
- Upgrade / manage subscription directly from the dashboard
- Daily token history (bar chart) and per-session activity log

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Database | PostgreSQL via **Neon** (serverless) |
| ORM | Prisma 7 with Neon driver adapter |
| Auth | NextAuth v5 (beta) + Prisma adapter |
| AI | Cloudflare Workers AI — Llama 3.1 8B Instruct |
| Billing | Stripe (Checkout, Customer Portal, Webhooks) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Data Model (overview)

```
Organization ──< User ──< ChatMessage
     │               └──< UsageLog
     └──< Invite
     └──< UsageLog
```

- **Organization** — the top-level tenant. Holds plan, token quota, Stripe IDs, and default niche.
- **User** — belongs to one organization. Has a role (`OWNER`, `ADMIN`, `MEMBER`) and a personal niche.
- **ChatMessage** — stores every user and assistant turn, scoped to user + org.
- **UsageLog** — records prompt tokens, completion tokens, cost, and model per request.
- **Invite** — time-limited, single-use invite tokens for onboarding new members.

---

## Project Structure

```
app/
├── (auth)/               # Login and register pages
├── api/
│   ├── auth/             # NextAuth route handler + registration
│   ├── chat/             # SSE streaming chat endpoint
│   ├── admin/            # Invite, member management, niche update
│   ├── usage/            # Admin summary, trends, per-user stats, personal usage
│   ├── settings/         # Org settings GET/PUT
│   ├── stripe/           # Checkout, portal, webhook
│   └── user/             # Role and profile endpoints
└── dashboard/
    ├── page.tsx           # Dashboard home with stat cards
    ├── chat/              # AI chat interface
    ├── usage/             # Usage analytics (admin + user views)
    ├── users/             # User management (admin only)
    └── settings/          # Org settings + danger zone (admin only)

components/
└── dashboard/
    └── Sidebar.tsx        # Collapsible navigation sidebar

lib/
├── ai.ts                  # Cloudflare AI streaming wrapper
├── auth.ts                # NextAuth config
├── prisma.ts              # Prisma client singleton
├── quota.ts               # Token quota check and usage recording
├── stripe.ts              # Stripe client + plan/price mappings
└── tenant.ts              # Session → org + user resolution helper
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Cloudflare](https://dash.cloudflare.com) account with Workers AI enabled
- A [Stripe](https://stripe.com) account with a product and price created

### 1. Clone and install

```bash
git clone https://github.com/rajiss-ctrl/ai-aid.git
cd ai-aid
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
AUTH_SECRET="generate with: openssl rand -base64 32"

# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npm run seed
```

The seed creates a default organization and an owner account you can use to log in immediately.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Set up Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret printed by the CLI and add it as `STRIPE_WEBHOOK_SECRET` in `.env`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `DIRECT_URL` | ✅ | Neon direct (non-pooled) connection for migrations |
| `AUTH_SECRET` | ✅ | Random secret for NextAuth session encryption |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Cloudflare account ID for Workers AI |
| `CLOUDFLARE_API_TOKEN` | ✅ | Cloudflare API token with AI read permission |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (use test key in development) |
| `STRIPE_PRO_PRICE_ID` | ✅ | Stripe Price ID for the Pro plan |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Webhook signing secret from Stripe dashboard or CLI |

---

## Roles and Permissions

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| Chat with AI | ✅ | ✅ | ✅ |
| View own usage | ✅ | ✅ | ✅ |
| Upgrade plan | ✅ | ✅ | ✅ |
| View all users | ✅ | ✅ | ❌ |
| Manage members | ✅ | ✅ | ❌ |
| Invite users | ✅ | ✅ | ❌ |
| Edit org settings | ✅ | ✅ | ❌ |
| View admin analytics | ✅ | ✅ | ❌ |
| Delete organization data | ✅ | ❌ | ❌ |

---

## Deployment

The app is designed to deploy on **Vercel** with zero additional configuration beyond environment variables.

```bash
vercel deploy
```

Set all environment variables in the Vercel project settings. For the Stripe webhook, create a production endpoint in the Stripe dashboard pointing to `https://your-domain.com/api/stripe/webhook`.

---

## Security Notes

- Secrets must never be committed to version control. Use `.env` locally and environment variable settings in your deployment platform.
- The `.env` file is included in `.gitignore`.
- All admin API routes resolve the caller's role server-side via `getTenant()` — client-supplied roles are never trusted.
- Passwords are hashed with `bcryptjs` (12 rounds) before storage.
- Stripe webhook payloads are verified with `stripe.webhooks.constructEvent` before processing.

---

## License

MIT
