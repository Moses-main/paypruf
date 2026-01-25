#!/bin/bash

echo "🔧 Fixing PayProof Dependencies"
echo "==============================="

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server

# Fix Express version first
echo "🔧 Fixing Express version compatibility..."
npm install express@^4.22.1 @types/express@^4.17.25

# Install all dependencies
npm install
cd ..

echo "✅ Dependencies fixed!"
echo "🚀 You can now start the server with:"
echo "   cd server && npm run dev"