#!/bin/bash

# Deploy Submeet to a temporary public URL using local tunnel
# This creates a public URL for your local development server

echo "🚀 Starting Submeet deployment..."

# Check if local server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Local server is not running. Please start it first with: npm run dev"
    exit 1
fi

echo "✅ Local server is running"

# Install localtunnel if not available
if ! command -v lt &> /dev/null; then
    echo "📦 Installing localtunnel..."
    npm install -g localtunnel
fi

echo "🌐 Creating public tunnel..."
echo "📍 Your local Submeet is available at: http://localhost:3000"
echo "🔗 Creating public URL..."

# Create tunnel
lt --port 3000 --subdomain submeet-$(date +%s)

echo "✅ Deployment complete!"
echo "📝 Note: This is a temporary tunnel for testing purposes"
echo "🎯 For production deployment, we'll set up Vercel or similar service"