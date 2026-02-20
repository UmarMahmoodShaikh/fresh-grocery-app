# 🚀 FRESH GROCERY STORE - START HERE

## ⚡ Quick Start (2 Minutes)

### Step 1: Start Backend
```bash
cd backend
npm install
npm run dev
```
✅ Backend runs on: http://localhost:5001

### Step 2: Start Frontend
```bash
cd frontend-vite
npm install
npm run dev
```
✅ Frontend runs on: http://localhost:3000

### Step 3: Open in Browser
👉 **http://localhost:3000**

---

## 🛍️ What Can You Do?

### As a Customer
1. **Browse Products** - See all items with prices
2. **Add to Cart** - "Add to Cart" button with counter
3. **View Cart** - Sidebar/Modal cart view
4. **Checkout** - Guest, Login, or Signup
5. **See Confirmation** - Order details

### As Admin
1. **Login** - Admin specific login
2. **See Dashboard** - Stats and overview
3. **Manage Store**:
   - Products
   - Orders
   - Users

---

## 🔧 Admin Test Account

Create admin user (in backend folder):
```bash
# Ensure backend is running!
# The backend automatically creates an admin user on first run if configured.
```

Or login with:
- **Email**: `admin@trinity.com`
- **Password**: `Admin@123`

---

## 🎨 Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS Modules / Standard CSS
- **State**: React Context / Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase / SQL

---

## 📊 File Structure

```
.
├── backend/            ← Express API
│   ├── src/
│   │   ├── server.js   ← Entry point
│   │   └── ...
│   └── package.json
│
└── frontend-vite/      ← React App
    ├── src/
    │   ├── App.jsx     ← Main Component
    │   └── ...
    ├── vite.config.js
    └── package.json
```

---

## 🚨 Troubleshooting

### Nothing loads?
- ✅ Backend running on 5001? `npm run dev` in `backend`
- ✅ Frontend running on 3000? `npm run dev` in `frontend-vite`
- ✅ Browser? Open http://localhost:3000 (NOT 5001)

### API Connection Failed?
- Check if backend is running
- Check browser console (F12) for Network errors

---

## 🚀 Go!

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend-vite
npm install
npm run dev

# Browser
http://localhost:3000
```
