#!/bin/bash

# Test Web Version Script
# This script builds and serves the web version locally for testing

echo "🌐 Testing Qred Web Version"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if required dependencies are installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not installed. Please install Node.js"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building web version..."
npm run build:web

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi

echo "✅ Build successful!"
echo "🚀 Starting local web server..."
echo ""
echo "Your app will be available at:"
echo "  🌐 http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npx serve dist -p 3000

echo "👋 Web server stopped"
