# 🏗️ System Architecture

## 1. High-Traffic Cart Management (The Redis Shift)
Unlike traditional Rails apps, we do **not** use Postgres for shopping carts. 

- **The Flow**: When a user adds an item to their cart, it is stored as a JSON hash in **Redis**. 
- **The Benefit**: This offloads millions of transient write operations from our primary database, preventing "Database Rupturing" during peak sale hours.
- **Deduction Policy**: Inventory is **not** blocked when adding to cart. We use "Late-Binding" inventory checks during the checkout transaction.

## 2. Background Processing (Sidekiq)
All intensive tasks are offloaded to Sidekiq:
- **Cloudinary Sync**: External product images are downloaded and attached to Cloudinary asynchronously.
- **Algolia Indexing**: (Planned) Search updates happen in the background to ensure a "snappy" admin experience.

## 3. Marketplace Model
The system is built as a **Multi-Store Tenant** architecture:
- Stores own their inventory, categories, and promotions.
- Products belong to a global catalog but are mapped to stores via `StoreProducts`.
- **Eager Loading**: We use a `Hybrid Eager Loading` strategy (`includes` for list views, `eager_load` for detail views) to maintain sub-100ms response times.
