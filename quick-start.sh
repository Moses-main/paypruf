#!/bin/bash

echo "🚀 PayProof Quick Start"
echo "======================="

# Check if environment files exist
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file..."
    cp .env.template .env
    echo "✅ Frontend .env created from template"
    echo "⚠️  Please edit .env and add your WalletConnect Project ID"
fi

if [ ! -f "server/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp server/.env.template server/.env
    echo "✅ Backend .env created from template"
    echo "⚠️  Please edit server/.env and add your database URL and private key"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env files with your configuration"
echo "2. Set up PostgreSQL database"
echo "3. Run: cd server && npm run setup"
echo "4. Start services: ./start-dev.sh"
echo ""
echo "📚 See SETUP.md for detailed instructions"