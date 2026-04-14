# 🧪 Testing & Quality

## 1. Automated Testing
We use **RSpec** for testing the core logic and **Rswag** for API documentation.

### Running Tests:
```bash
# Run all specs
bundle exec rspec

# Run specific API specs
bundle exec rspec spec/requests/api/v2
```

## 2. API Documentation (Swagger)
The API is self-documenting. You can view the live documentation (including the new Idempotency headers) at:
`/api-docs/index.html`

## 3. Code Quality (Rubocop)
To maintain the "Silkiness" of the code, always run:
```bash
bundle exec rubocop
```
Focus areas:
- Maintain logic in **Services** (not Controllers or Models).
- Ensure all new API V2 controllers follow the **FetchService** pattern.
- Verify eager-loading via `Bullet` gem logs in development.
