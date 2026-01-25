#!/bin/bash

echo "🔧 Fixing Express version compatibility..."

# Remove node_modules and package-lock.json to ensure clean install
rm -rf node_modules package-lock.json

# Install the correct Express version
npm install express@^4.19.2 @types/express@^4.17.21

echo "✅ Express downgraded to v4 for compatibility"
echo "🚀 You can now start the server with: npm run dev"