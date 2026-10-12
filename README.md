# GharPay

Rental and recurring bill management platform for Nepal. Landlords manage properties, units, tenancies, and bills. Renters receive invitations, pay bills, and track payment history.

---

## Monorepo Structure

```
gharpay/
├── apps/
│   ├── api/          # Express + TypeScript backend
│   └── web/          # React + Vite frontend (coming soon)
├── packages/
│   └── shared/       # Shared types/utilities (planned)
├── docker-compose.yml
└── .env.example
```

---

## Tech Stack

### Backend (`apps/api`)
- **Runtime**: Node.js with ESM
- **Framework**: Express 5
- **Language**: TypeScript
- **ORM**: Prisma (PostgreSQL)
- **Validation**: Zod
- **Auth**: JWT (access + refresh tokens via `jose`), Argon2 password hashing
- **Security**: Helmet, CORS, HttpOnly refresh token cookies

### Frontend (`apps/web`) — _not yet scaffolded_
- React + Vite + TypeScript
- Tailwind CSS, React Router, TanStack Query, Axios

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd gharpay
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/rental_platform` | PostgreSQL connection string |
| `API_PORT` | `4000` | Port the API listens on |
| `JWT_ACCESS_SECRET` | — | Secret for signing access tokens (change in production) |
| `JWT_REFRESH_SECRET` | — | Secret for signing refresh tokens (change in production) |
| `COOKIE_SECURE` | `false` | Set to `true` in production (HTTPS only) |
| `COOKIE_SAME_SITE` | `lax` | Cookie SameSite policy (`strict`, `lax`, `none`) |
| `WEB_URL` | `http://localhost:5173` | Frontend URL for CORS |

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
npm run db:migrate --workspace apps/api
```

### 5. Start the API dev server

```bash
npm run dev --workspace apps/api
```

API is available at `http://localhost:4000`.

---

## Backend — API Reference

Base URL: `http://localhost:4000/api`

All protected routes require:
```
Authorization: Bearer <access_token>
```

All responses follow this envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

---

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | DB connectivity check |

---

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register a new user (`LANDLORD` or `RENTER`) |
| `POST` | `/api/auth/login` | None | Login — returns access token + sets refresh cookie |
| `POST` | `/api/auth/refresh` | Cookie | Rotate refresh token, get new access token |
| `POST` | `/api/auth/logout` | Cookie | Revoke refresh token, clear cookie |

- Access tokens expire in **15 minutes**
- Refresh tokens expire in **7 days** and rotate on every use
- Refresh token stored as `sha256` hash in DB, sent as `HttpOnly` cookie

---

### Properties _(LANDLORD only)_

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/properties` | Create a property |
| `GET` | `/api/properties` | List all own properties (includes unit count) |
| `GET` | `/api/properties/:propertyId` | Get property with units |
| `PATCH` | `/api/properties/:propertyId` | Update name / address / city |

---

### Units _(LANDLORD only)_

Nested under properties.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/properties/:propertyId/units` | Create a unit |
| `GET` | `/api/properties/:propertyId/units` | List units in a property |
| `GET` | `/api/properties/:propertyId/units/:unitId` | Get a single unit |
| `PATCH` | `/api/properties/:propertyId/units/:unitId` | Update name / type / monthlyRent |

Unit types: `ROOM`, `APARTMENT`, `FLAT`, `SHOP`, `OTHER`  
Unit status: `VACANT` (default), `OCCUPIED` (set automatically by tenancy)

---

### Tenancies _(LANDLORD only)_

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/tenancies` | Create tenancy — validates unit is VACANT, marks it OCCUPIED |
| `GET` | `/api/tenancies` | List tenancies (`?unitId=` filter) |
| `GET` | `/api/tenancies/:tenancyId` | Get tenancy with renter + unit details |
| `PATCH` | `/api/tenancies/:tenancyId/end` | End tenancy — marks unit VACANT |

---

### Bills _(LANDLORD only)_

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/bills` | Create bill with line items — `totalAmount` auto-computed |
| `GET` | `/api/bills` | List bills (`?tenancyId=` filter) |
| `GET` | `/api/bills/:billId` | Get bill with items + renter info |
| `PATCH` | `/api/bills/:billId` | Update `dueDate` or `status` |

Bill item types: `RENT`, `ELECTRICITY`, `WATER`, `INTERNET`, `OTHER`  
Bill statuses: `PENDING`, `PAID` (set automatically on payment verify), `OVERDUE`, `CANCELLED`

---

### Payments

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/api/payments` | RENTER | Submit a payment (transactionReference + optional proofUrl) |
| `GET` | `/api/payments` | BOTH | List payments — renters see own, landlords see all (`?billId`, `?status`) |
| `GET` | `/api/payments/:paymentId` | BOTH | Get payment (role-aware ownership) |
| `PATCH` | `/api/payments/:paymentId/verify` | LANDLORD | Verify — marks bill PAID, auto-generates Receipt |
| `PATCH` | `/api/payments/:paymentId/reject` | LANDLORD | Reject payment |

Payment methods: `ESEWA`, `FONEPAY`, `BANK_TRANSFER`, `CASH`, `OTHER`  
Payment statuses: `PENDING`, `VERIFIED`, `REJECTED`

> **Note:** No external payment gateway is integrated. `transactionReference` is a plain text field (e.g. eSewa transaction ID). The landlord manually verifies. eSewa/FonePay sandbox integration is planned for a future milestone.

---

### Payment Methods _(landlord CRUD / renter read-only)_

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/payment-methods/landlord/:landlordId` | RENTER | View active payment methods (where to send money) |
| `POST` | `/api/payment-methods` | LANDLORD | Add a payment method |
| `GET` | `/api/payment-methods` | LANDLORD | List all own payment methods |
| `GET` | `/api/payment-methods/:paymentMethodId` | LANDLORD | Get one |
| `PATCH` | `/api/payment-methods/:paymentMethodId` | LANDLORD | Update details or toggle `active` |
| `DELETE` | `/api/payment-methods/:paymentMethodId` | LANDLORD | Delete |

---

### Invitations

Token-based system for landlords to onboard renters to a unit.

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/api/invitations` | LANDLORD | Send invitation to an email — returns `devToken` in dev |
| `GET` | `/api/invitations` | LANDLORD | List sent invitations (`?unitId`, `?status`) |
| `PATCH` | `/api/invitations/:id/cancel` | LANDLORD | Cancel a pending invitation |
| `GET` | `/api/invitations/mine` | RENTER | List invitations sent to own email |
| `POST` | `/api/invitations/accept` | RENTER | Accept via token — validates expiry, email match, unit availability |

Invitation statuses: `PENDING`, `ACCEPTED`, `EXPIRED`, `CANCELLED`  
Tokens expire after **7 days**. Token stored as `sha256` hash — raw token travels via email only.

> **Note:** Email delivery is a stub (`TODO` in `invitation.service.ts`). During development, the raw token is returned in the API response as `devToken`. Plug in Resend, Nodemailer, or any SMTP provider when ready.

---

## Database Schema

11 models — all using UUID primary keys, `createdAt`/`updatedAt` timestamps.

```
User
 ├── Property (landlord)
 │    └── Unit
 │         ├── Tenancy (renter)
 │         │    └── Bill
 │         │         ├── BillItem
 │         │         └── Payment ──→ Receipt
 │         └── Invitation
 └── PaymentMethod
```

Run Prisma Studio to explore data:
```bash
npx prisma studio --schema apps/api/prisma/schema.prisma
```

---

## Project Status

| Module | Backend | Frontend |
|---|---|---|
| Auth (register/login/refresh/logout) | ✅ Done | ⏳ Pending |
| Properties | ✅ Done | ⏳ Pending |
| Units | ✅ Done | ⏳ Pending |
| Tenancies | ✅ Done | ⏳ Pending |
| Bills | ✅ Done | ⏳ Pending |
| Payments (manual verification) | ✅ Done | ⏳ Pending |
| Payment Methods | ✅ Done | ⏳ Pending |
| Invitations | ✅ Done | ⏳ Pending |
| eSewa / FonePay gateway | 🔜 Planned | 🔜 Planned |
| Frontend scaffolding | — | 🔜 Next |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev --workspace apps/api` | Start API in watch mode |
| `npm run typecheck --workspace apps/api` | TypeScript check (no emit) |
| `npm run build --workspace apps/api` | Compile to `dist/` |
| `docker compose up -d` | Start PostgreSQL |
| `docker compose down` | Stop PostgreSQL |