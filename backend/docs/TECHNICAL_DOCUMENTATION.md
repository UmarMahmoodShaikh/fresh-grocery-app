# Technical Documentation - Trinity Part Two

## 1. Architecture
The application follows a **Monolithic Rails Backend** with a **Decoupled React Frontend**, serving as a RESTful API provider and an Administrative management system.

### Layers
1.  **Frontend (Presentation)**:
    *   **React (Vite)**: SPA architecture for high-performance interactivity.
    *   **Context API**: Global state management for Authentication, Shopping Cart, and Theming.
    *   **Emerald Design System**: Custom Vanilla CSS variable system for a premium dark mode experience.

2.  **API Layer (Backend)**:
    *   **Ruby on Rails 7.2**: Serves as the RESTful engine.
    *   **JWT Authentication**: Stateless session management using `jwt` gem.
    *   **ActiveAdmin**: Overhauled CMS for Managers to track stock and sales.

3.  **Service Layer**:
    *   **External Sync**: `sync_products.rake` task for Open Food Facts API integration.
    *   **KPI Generator**: `ReportsController` calculates 5 crucial metrics dynamically.

4.  **Data Layer**:
    *   **PostgreSQL**: Relational database for transactions and inventory.
    *   **JSONB Storage**: Used for flexible nutritional data within the `products` table.

## 2. Key Features

### Invoices & Payment History
- Every order automatically generates a unique **Invoice** (e.g., `INV-ABCD-12345`).
- Users and Admins can track payment status through the API or Dashboard.

### Product Stock Management
- **Open Food Facts Integration**: Automates data entry by fetching images, names, and nutritional facts.
- **Stock Tracking**: Inventory levels decrement automatically upon successful order placement.

### Key Performance Indicators (KPIs)
The Admin Dashboard provides 5 real-time metrics:
1. **Total Revenue**: Sum of all delivered sales.
2. **Total Invoices**: Count of all generated billing records.
3. **Customer Count**: Total registered user base.
4. **Average Order Value (AOV)**: Measures customer spending behavior.
5. **Top Selling Products**: Visualization of product performance.

## 3. Security
- **JWT Protection**: All secure routes (`orders`, `invoices`, `reports`) require a valid Bearer token.
- **Role-Based Access**: Distinguishes between `customers` and `admins`.
- **CORS Policies**: Restricted to the frontend origin for API safety.

## 4. Testing
- **Backend Unit Tests**: Critical paths (Auth, Orders, Invoices) covered.
- **Frontend Validation**: Robust state checking for cart and checkout flows.
