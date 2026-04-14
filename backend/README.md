# 🍎 Fresh Grocery Marketplace (Enterprise API)

Welcome to the **Fresh Grocery App** backend. This is a high-performance, multi-store marketplace API built with Ruby on Rails 7.2, designed for scale and reliability.

## 🚀 Quick Navigation
- 🏗️ **[Architecture](docs/ARCHITECTURE.md)**: How the system handles high traffic.
- 🗄️ **[Database & Schema](docs/DATABASE.md)**: Multi-store relationships and data integrity.
- 🛡️ **[Security & Operations](docs/SECURITY.md)**: Rate limiting, error tracking, and idempotency.
- 🧪 **[Testing & Quality](docs/TESTING.md)**: How to run specs and maintain code quality.

---

## 🛠️ Stack Overview
- **Core**: Ruby 3.1.6 | Rails 7.2.3
- **Database**: PostgreSQL (Supabase) + Redis (Session Carts)
- **Asset Management**: Cloudinary (Automatic resizing & CDN)
- **Search Engine**: Algolia (Geo-aware search)
- **Monitoring**: Sentry (Real-time error tracking)
- **Protection**: Rack::Attack (Anti-Spam/Bot defense)

## 📦 Getting Started
1. **Clone & Install**: `bundle install`
2. **Environment**: Setup `.env` (see `.env.example`)
3. **Database**: `rails db:migrate`
4. **Run**: `bundle exec rails s -p 5000`

---

## 🐋 Docker Deployment
This project is fully containerized. To spin up the complete ecosystem (API + Redis + Sidekiq + Frontend):
```bash
docker-compose up --build
```
