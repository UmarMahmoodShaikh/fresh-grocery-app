# 🛡️ Security & Operations

## 1. Rate Limiting (Rack::Attack)
We protect the API from bots and scrapers using the following rules:
- **General Throttling**: 300 requests / 5 minutes per IP.
- **Brute Force**: Login attempts limited to 5 per minute.
- **Bot Blocklist**: Direct `curl`, `wget`, and `python-requests` agents are blocked.
- **Fail Gracefully**: Returns a `429 Too Many Requests` status.

## 2. Idempotency (Exactly-Once Processing)
Crucial for payments and order creation:
- **Header**: `X-Idempotency-Key` (UUID recommended).
- **Behavior**: If the same key is sent within 24 hours, the server returns the *cached* successful response instead of creating a new order.

## 3. Error Tracking (Sentry)
- Monitored in `production` and `staging`.
- Personal Identifiable Information (PII) is filtered out in `config/initializers/sentry.rb`.
- Captures active support logs and breadcrumbs for fast debugging.

## 4. Admin Security
- **Store Separation**: Store Admins can only see orders, products, and staff belonging to their specific `store_id`.
- **RBAC**: Role-based access control via `Ability.rb` (CanCanCan).
