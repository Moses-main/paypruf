#!/bin/bash

echo "🚀 Starting PayProof Development Environment"
echo "============================================"

# Check if .env files exist
if [ ! -f ".env" ]; then
    echo "❌ Frontend .env file not found"
    echo "📝 Please create .env file in root directory"
    echo "💡 See SETUP.md for configuration"
    exit 1
fi

if [ ! -f "server/.env" ]; then
    echo "❌ Backend .env file not found"
    echo "📝 Please create server/.env file"
    echo "💡 See SETUP.md for configuration"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

# Check if database is set up
cd server
if ! npx prisma db pull --schema=./prisma/schema.prisma 2>/dev/null; then
    echo "🔧 Setting up database..."
    npm run setup
fi
cd ..

echo ""
echo "🌐 Starting services..."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start both services
trap 'kill $(jobs -p)' EXIT

cd server && npm run dev &
npm run dev &

wait