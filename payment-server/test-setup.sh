#!/bin/bash

echo "🧪 Testing PayPal Payment Server Setup"
echo "======================================"
echo ""

# Check if .env file exists
echo "1. Checking .env file..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    
    # Check if credentials are filled
    if grep -q "your_sandbox_client_id_here" .env; then
        echo "   ⚠️  WARNING: Please add your PayPal credentials to .env"
        echo "   📖 See PAYPAL_CREDENTIALS_GUIDE.md for instructions"
        exit 1
    else
        echo "   ✅ Credentials appear to be configured"
    fi
else
    echo "   ❌ .env file not found"
    echo "   Run: cp .env.example .env"
    exit 1
fi

echo ""
echo "2. Checking Node.js and npm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js installed: $NODE_VERSION"
else
    echo "   ❌ Node.js not found. Please install Node.js"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   ✅ npm installed: $NPM_VERSION"
else
    echo "   ❌ npm not found. Please install npm"
    exit 1
fi

echo ""
echo "3. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ⚠️  Dependencies not found. Installing..."
    npm install
fi

echo ""
echo "4. Testing server startup..."
timeout 5 node server.js &> /dev/null &
SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null; then
    echo "   ✅ Server can start successfully"
    kill $SERVER_PID 2>/dev/null
else
    echo "   ❌ Server failed to start. Check your .env configuration"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ All checks passed!"
echo ""
echo "🚀 To start the payment server, run:"
echo "   npm run dev"
echo ""
echo "📖 For complete setup instructions, see:"
echo "   - QUICK_START.md (Quick overview)"
echo "   - PAYPAL_CREDENTIALS_GUIDE.md (Get API keys)"
echo "   - README.md (Full documentation)"
echo ""
