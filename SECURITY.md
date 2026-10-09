# HacXLerate 2026 — Security Architecture & Hardening Guide

## 1. Executive Security Architecture

HacXLerate 2026 is engineered with an enterprise **Defense-in-Depth** model protecting creators, brands, and creative agencies from automated attacks, account takeovers, unauthorized privilege escalations, and data leaks.

```
                         INTERNET
                            │
                            ▼
                    CLOUDFLARE EDGE
              ┌─────────────┴─────────────┐
              │                           │
          WAF & DDoS                  TURNSTILE
         (Managed Rules)          (Human Verification)
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                    FRONTEND (VITE/REACT)
               (Pure Client — Zero Secrets)
                            │
                            ▼
                    BACKEND API (FASTAPI)
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
Rate Limiting        Input Sanitization     Audit Logging
(Sliding Window)     (Pydantic & Defense)   (Redacted Trail)
      │                     │                     │
      └─────────────────────┼─────────────────────┘
                            │
                            ▼
                    SUPABASE PLATFORM
      ┌─────────────────────┴─────────────────────┐
      │                                           │
Supabase Auth                              PostgreSQL (RLS)
(Identity, Sessions,                       (Row-Level Security,
Password Hashing)                          Role Escalation Trigger)
                                                  │
                                                  ▼
                                           Supabase Storage
                                          (Buckets with RLS)
```

---

## 2. Responsibilities by Layer

| Layer | Component | Security Responsibility |
|---|---|---|
| **Edge** | Cloudflare WAF | DDoS mitigation, IP reputation, rate limiting at edge, SSL/TLS termination, geolocation filtering. |
| **Edge** | Cloudflare Turnstile | Non-intrusive CAPTCHA alternative preventing automated bot registration, credential stuffing, and brief spam. |
| **Frontend** | React 19 Client | Zero secrets stored; consumes only `VITE_` public variables. Renders Turnstile challenge and captures tokens. |
| **Backend** | FastAPI Service | Verifies Turnstile tokens with Cloudflare siteverify API using strictly server-side secret key; enforces in-memory sliding window rate limits; validates inputs via Pydantic; sets security headers; maintains audit logs. |
| **Auth** | Supabase Auth | Manages user passwords (bcrypt/argon2), session JWT issuance, email verification, and recovery tokens. |
| **Data** | Supabase PostgreSQL | Authoritative role storage; Row Level Security (RLS) enforcement; database trigger preventing unauthorized client-side role modification. |
| **Storage** | Supabase Storage | Isolated storage buckets (`portfolios`, `deliverables`, `brief-attachments`) protected by storage RLS policies. |

---

## 3. Threat Model & Mitigations

| Threat | Risk Level | Mitigation Strategy |
|---|---|---|
| **Automated Credential Stuffing & Bot Registrations** | Critical | Cloudflare Turnstile human challenge on `/auth/register` and `/auth/login`. In-memory sliding-window rate limiting (10 req/min). |
| **Client-Side Role Escalation** | High | Authoritative roles stored in `public.profiles`. PostgreSQL `BEFORE UPDATE` trigger (`protect_profile_security_fields`) rejects any client attempt to modify `role`, `reputation_score`, or `level`. |
| **Account Enumeration via Password Reset** | Medium | Uniform anti-enumeration response: `/auth/forgot-password` returns identical success message whether an email exists or not. |
| **SQL Injection (SQLi)** | Critical | 100% parameterization: Zero string concatenation in database queries. Pydantic v2 sanitizes search queries and strips null bytes and control characters. |
| **Data Leakage via Search History** | High | `search_history` table partitioned with PostgreSQL RLS: `auth.uid() = user_id`. History is never returned on public search routes. |
| **Cross-Site Scripting (XSS) & Clickjacking** | High | Security headers injected on all HTTP responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. |
| **Secret Exposure** | Critical | Strict variable isolation: `CLOUDFLARE_TURNSTILE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` reside exclusively in backend environment. |

---

## 4. Cloudflare Configuration

### 4.1. Turnstile Setup
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Turnstile**.
2. Create a new widget:
   - **Domain**: Add your production domain (e.g., `hacxlerate.com`) and `localhost` for testing.
   - **Mode**: *Managed* (recommended) or *Non-interactive*.
3. Copy the **Site Key** into frontend `.env`:
   ```bash
   VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
   ```
4. Copy the **Secret Key** into backend `.env`:
   ```bash
   CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...
   ```

### 4.2. Local Development & Testing Keys
Cloudflare provides official test keys that always pass without generating real CAPTCHA challenges:
- **Always Pass Site Key**: `1x00000000000000000000AA`
- **Always Pass Secret Key**: `1x0000000000000000000000000000000AA`
- **Always Fail Secret Key**: `2x0000000000000000000000000000000AB`

In development mode (`APP_DEBUG=true`), the backend also accepts token `"test-turnstile-token"` to facilitate automated integration tests and offline development.

### 4.3. WAF & Managed Rules (Production)
For production deployment behind Cloudflare:
- Enable **Cloudflare Managed Ruleset (OWASP)** with sensitivity set to *Medium* or *High*.
- Configure **Rate Limiting Rule**:
  - Path: `/api/v1/auth/*`
  - Limit: 15 requests per 10 seconds per IP
  - Action: *Block (1 minute)* or *Managed Challenge*.
- Enable **Bot Fight Mode**.
- Ensure **True-Client-IP** or `CF-Connecting-IP` is passed to the upstream backend to ensure the backend rate limiter functions accurately.

---

## 5. Database Row Level Security (RLS)

All database security policies are defined in `backend/migrations/002_security_and_rls.sql`.

### 5.1. Role Protection Trigger
To guarantee that a malicious user cannot send an `UPDATE profiles SET role = 'ADMIN'` request, the following trigger is active:
```sql
CREATE OR REPLACE FUNCTION protect_profile_security_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
        NEW.role := OLD.role;
        NEW.reputation_score := OLD.reputation_score;
        NEW.level := OLD.level;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2. Search History Privacy
```sql
CREATE POLICY "Users can only view their own search history"
    ON search_history FOR SELECT
    USING (auth.uid() = user_id);
```

### 5.3. Audit Logs Immutability
`audit_logs` are insert-only by the service role. No client (creator, brand, or admin) may update or delete audit events.

---

## 6. Environment Variables Reference

### Root & Backend (`backend/.env`)
| Variable | Description | Production Requirement |
|---|---|---|
| `APP_ENV` | `development`, `staging`, or `production` | Set to `production` |
| `APP_DEBUG` | Enable verbose error traces and mock fallbacks | Must be `false` in production |
| `SUPABASE_URL` | Supabase project REST URL | Required (e.g. `https://xyz.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase public anonymous client key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase administrative secret key | **Strictly confidential** (never expose to frontend) |
| `SUPABASE_JWT_SECRET` | Supabase JWT signing secret | Required for token verification |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server secret key | **Strictly confidential** |
| `CORS_ORIGINS` | Allowed origins (JSON array) | Set to `["https://hacxlerate.com"]` |

### Frontend (`frontend/.env`)
| Variable | Description | Production Requirement |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | e.g. `https://api.hacxlerate.com` |
| `VITE_SUPABASE_URL` | Supabase project REST URL | Required |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous client key | Required |
| `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY` | Public Turnstile site key | Required |

---

## 7. Verification & Automated Testing

The automated test suite in `backend/app/tests/test_security.py` validates all security boundaries:
- Security headers verification (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- Cloudflare Turnstile token verification with test tokens and rejection of invalid/expired tokens.
- Sliding-window rate limiter enforcement (triggering 429 and `Retry-After`).
- Anti-enumeration behavior in password resets.
- Admin self-registration rejection (privilege escalation prevention).
- SQL injection defense and control character sanitization in search queries.
- Audit log credential redaction (`[REDACTED]` passwords, tokens, and secrets).

Run the security test suite:
```bash
cd backend
python -m pytest app/tests/test_security.py -v
```
