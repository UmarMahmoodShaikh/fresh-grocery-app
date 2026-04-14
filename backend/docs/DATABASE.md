# 🗄️ Database & Integrity (Updated)

## 1. Schema Overview
Our database is optimized for a **Multi-Store Grocery Marketplace** lifecycle.

### Core Tables:
- **`products`**: Global catalog (Name, Barcode, Weight, Unit, DiscardedAt).
- **`stores`**: Independent tenants (Name, Location, Active, DiscardedAt).
- **`store_products`**: The link table (Price, Stock, Local Visibility).
- **`orders`**: Immutable financial records.
  - New: `idempotency_key` (Unique index to prevent double-charging).
- **`admin_users`**: Role-based access (Store-scoped or Global).
- ~~**`carts` / `cart_items`**~~: **DELETED**. Successfully migrated to Redis.

## 2. Inventory & Concurrency
- **The Milk Race Lock**: We use `Pessimistic Locking` on `store_products` during checkout.
- **Idempotency**: Clients must send an `X-Idempotency-Key`. The DB enforces uniqueness at the schema level.
- **Soft Deletes**: Use the `Discard` gem logic. All records use `discarded_at` instead of permanent deletion.

## 3. Localization
- **Currency**: Standardized on Euro (€) across the core marketplace.
- **Weight**: Supported units include `g`, `kg`, `ml`, `L`, `pcs`, and `pack`.
