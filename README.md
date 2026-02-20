# GroceryGo 🛒

A smart grocery shopping companion built with **React Native (Expo)** for the mobile frontend and **Ruby on Rails** for the backend API.

## Project Structure

```
├── app/                  ← Expo Router screens (auth, tabs)
├── components/           ← Reusable React Native components
├── constants/            ← Theme & color constants
├── hooks/                ← Custom React hooks
├── services/             ← API service layer (api.ts)
├── assets/               ← Images and icons
├── backend/              ← Ruby on Rails API server
│   ├── app/              ← Rails controllers, models, views
│   ├── config/           ← Rails configuration
│   ├── db/               ← Database migrations & seeds
│   ├── spec/             ← RSpec tests
│   └── frontend/         ← Web admin dashboard (React + Vite)
├── package.json          ← Expo/React Native dependencies
├── app.json              ← Expo configuration
└── tsconfig.json         ← TypeScript configuration
```

## Prerequisites

- **Node.js** 18+
- **Ruby** 3.1+
- **PostgreSQL** (or a Supabase account)
- **Expo CLI**: `npm install -g expo-cli`

## Getting Started

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Setup Backend

```bash
cd backend
bundle install
```

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=your_supabase_postgresql_url
PORT=5001
```

Run database migrations and seed data:

```bash
rails db:create db:migrate
rails db:sync_products
rails db:seed
```

### 3. Run Both Servers

**Terminal 1 — Backend (Rails API on port 5001):**

```bash
cd backend
rails s -p 5001
```

**Terminal 2 — Frontend (Expo dev server):**

```bash
npx expo start
```

Then scan the QR code with Expo Go or press `i` for iOS simulator / `a` for Android emulator.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native, Expo, Expo Router |
| Backend API | Ruby on Rails 7.2.3 (API mode) |
| Database | Supabase / PostgreSQL |
| Authentication | JWT (JSON Web Tokens) |
| Admin CMS | ActiveAdmin |
| Barcode Scanner | expo-camera + Open Food Facts API |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login (returns JWT) |
| POST | `/api/v1/auth/signup` | User registration |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/products` | List all products |
| GET | `/api/v1/products/:id` | Get product details |
| GET | `/api/v1/categories` | List categories |
| GET | `/api/v1/orders` | List user orders |
| POST | `/api/v1/orders` | Create an order |
| GET | `/api/v1/invoices` | List invoices |
