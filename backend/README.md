# 🛒 GroceryStore - Premium E-Commerce Experience

[![Rails 7](https://img.shields.io/badge/Rails-7.2-red?style=for-the-badge&logo=ruby-on-rails)](https://rubyonrails.org/)
[![React 18](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

A state-of-the-art Grocery Management and Shopping application built with a **Ruby on Rails** backend and a high-performance **React + Vite** frontend. Powered by **Supabase PostgreSQL**, the system features a stunning **Emerald Dark Theme**, real-time product data synchronization, and an advanced administrative dashboard with visual analytics.

---

## ✨ Core Features

### 🍏 Real-time Product Intelligence
- **Open Food Facts Integration**: Synchronizes thousands of real-world products with detailed nutritional information.
- **Nutrition Charts**: Every product displays a comprehensive breakdown of Energy, Proteins, Carbs, Sugars, and Fats.
- **Barcode Support**: Full support for product barcodes and categorization.

### 💰 Invoices & Smart Billing
- **Auto-Billing**: Every order automatically generates a unique, trackable **Invoice** (e.g., `INV-ABCD-2026`).
- **Billing History**: Customers and Admins can track payment status and download invoice summaries directly.
- **Guest Checkout**: Supports seamless shopping for non-registered users with automatic guest profile creation.

### 📊 Advanced Administration & Analytics
- **Visual KPIs**: Real-time sales graphs (Weekly/Monthly) using **Chartkick**.
- **Order Pulse**: An interactive "Today's Orders" section with live status filtering (Pending, Delivered).
- **Emerald Dark Theme**: A custom-designed, premium night-mode CMS overhauled for a superior management experience.

### 🎨 Stunning Visual Design
- **Emerald Mode**: A custom-designed, premium night-mode interface using `#10b981` accents.
- **Responsive Animations**: Glassmorphism effects, smooth transitions, and micro-interactions.
- **Rich Media**: High-quality category visuals and verified brand logos (via Wikimedia & UI-Avatars).

---

## 🚀 Getting Started

### Prerequisites
- **Ruby 3.1+**
- **Node.js 18+**
- **Supabase Account** (or local PostgreSQL)

### Installation

1. **Clone & Setup Backend**
   ```bash
   bundle install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_supabase_postgresql_url
   PORT=5001
   ```

3. **Database Migration & Sync**
   ```bash
   rails db:create db:migrate
   rails db:sync_products
   rails db:seed
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

5. **Run Application**
   - **Backend**: `rails s -p 5001`
   - **Frontend**: `npm run dev` (Accessible at `http://localhost:3000`)

---

## 🛠️ Tech Stack

- **Backend**: Ruby on Rails 7.2.3 (API Mode)
- **Frontend**: React 18, Vite, React Router 6, Axios
- **Database**: Supabase / PostgreSQL (JSONB for nutrition facts)
- **Analytics**: Chartkick, Groupdate
- **Authentication**: JWT (JSON Web Tokens)
- **Admin CMS**: ActiveAdmin 3.4
- **Styling**: Vanilla CSS (Custom Variable System), Emerald Theme SCSS

---

Developed with **Future Frontier**️ for the ultimate grocery shopping experience.
