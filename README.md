# GroceryGo: Comprehensive Developer Documentation 🛒

Welcome to the **GroceryGo** technical documentation. This guide provides an in-depth look at the internal workings, design patterns, and architectural decisions behind the application. Whether you are a new developer joining the team or performing a systems audit, this document covers everything from folder structure to state management logic.

---

## 🏗️ 1. Architecture Overview

GroceryGo follows a **Symmetric Monorepo** pattern, co-locating the mobile frontend and the backend API within a single repository to ensure synchronized development cycles, shared versioning history, and simplified environment orchestration.

### 🗺️ System Map
- **Mobile Frontend**: React Native with Expo SDK 54.
- **Backend API**: Ruby on Rails 7.2 (API Mode).
- **Database**: PostgreSQL (Relational) + JSONB (Flexible Schemas for Nutrition).
- **Communication**: RESTful JSON API using standard HTTP verbs.

---

## 🛠️ 2. Frontend Deep Dive (React Native)

The frontend is engineered to feel like a native high-end application using a mix of declarative UI and high-performance native modules.

### � Design Patterns

#### A. Provider Pattern (Global State)
We avoid complex state management libraries like Redux in favor of the **React Context API**. This provides a cleaner API for feature-specific state.
- **`CartProvider`**: Manages line-item logic, pricing totals, and local persistence.
- **`FavoritesProvider`**: Handles global bookmarks and AsyncStorage syncing for offline-first behavior.

#### B. Service/Repository Pattern
All network logic is abstracted into `services/api.ts`.
- **Decoupling**: React components never call `fetch` or `axios` directly; they use service methods (e.g., `productsApi.getAll()`).
- **Normalization**: The service layer handles environment-specific networking (switching between `localhost` for iOS and `10.0.2.2` for Android Emulators).

#### C. Higher-Order Components & Composed Styles
Styles are managed via a dynamic `getStyles` factory pattern.
- **Theme Injection**: Styles are computed at runtime based on the `isDark` color scheme hook.
- **Flexbox-First**: All layouts use relative flex units to ensure responsiveness across different device sizes.

### 🚀 Navigation: Expo Router
GroceryGo utilizes **Expo Router**, bringing **File-Based Routing** to native mobile.
- **Typed Routes**: Ensures compile-time safety when navigating between screens.
- **Nested Groups**:
    - `(tabs)`: Bottom-bar layout for the main user flow.
    - `(auth)`: Login/Signup stack with specialized navigation guards.
    - `(admin)`: Privileged views for store management.

### 🎭 Animations & UX
- **Reanimated 3**: Drives the high-performance '+1' and 'Heart' animations using the native UI thread.
- **Expo Image**: Utilized for the **Flaticon integration**, providing superior caching and BlurHash support for placeholders.

---

## 💎 3. Backend Deep Dive (Ruby on Rails)

The backend is built for speed and developer productivity using Rails' "Convention over Configuration".

### 🧱 Structural Highlights
- **ActiveAdmin Integration**: A customized Emerald-themed dashboard for administrators to manage the entire catalog.
- **Open Food Facts Connector**: A specialized Rake task (`db:sync_products`) that pulls real-world data from the OFF API and maps it into local models.
- **Invoice Engine**: An automated trigger system that generates unique, SEO-friendly invoice identifiers upon order completion.

### 📊 Database Schema Design
- **Normalized Tables**: `User`, `Order`, `OrderItem`, `Product`, `Category`, `Brand`.
- **Hybrid Data**: The `Product` model utilizes a `nutrition_facts` column (JSONB) to store variable-length nutritional data without rigid migrations.

---

## 🔄 4. The Barcode Workflow

One of the app's core technologies is the **Hybrid Product Lookup**:
1. **Scanning**: `expo-camera` captures a barcode (EAN-13).
2. **Local Lookup**: The app first queries the Rails API for a matching barcode in the local database.
3. **External Fallback**: If not found locally, the app queries **Open Food Facts**.
4. **Data Normalization**: External data is transformed into the standard `Product` interface on-the-fly, allowing users to "Favorite" or "Add to Cart" products that aren't even in our database yet.

---

## �️ 5. Developer Setup & Workflow

### 📋 Prerequisites
- **Node.js 18+** & **Ruby 3.1+**
- **Watchman** (for file tracking)
- **PostgreSQL** (running locally or via Supabase)

### 🚀 Launching the Environment
1. **Backend**:
   ```bash
   cd backend
   bundle install
   rails db:setup
   rails s -p 5001
   ```
2. **Frontend**:
   ```bash
   npm install
   npx expo start -c
   ```

### 🌍 Networking Logic (Crucial for Dev)
In `services/api.ts`, we use a dynamic base URL extractor:
- **iOS Simulator**: Uses `http://localhost:5001`.
- **Android Emulator**: Uses `http://10.0.2.2:5001`.
- **Physical Device**: Extracts your LAN IP automatically from the `hostUri`.

---

## ⚖️ 6. Design Principles
- **Wow Factor**: Every interaction should have a micro-animation.
- **Glassmorphism**: Use translucent backgrounds (`rgba`) for headers and floating buttons.
- **Dark Mode First**: Colors are curated to look premium in dark mode, with hunter green (`#2D6A4F`) as the primary accent.
- **Accessibility**: All interactive elements have a minimum 44x44 touch target.

---

## 📈 7. Road Map
- [ ] Push Notifications for Order Status.
- [ ] Stripe/Apple Pay Integration.
- [ ] Multi-store geolocation.
