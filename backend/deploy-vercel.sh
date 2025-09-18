#!/bin/bash

# Vercel Deployment Script for Shardeum Quest Backend
echo "🚀 Deploying Shardeum Quest Backend to Vercel"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Ensure we're in the backend directory
if [ ! -f "api/index.js" ]; then
    echo "❌ Error: api/index.js not found. Make sure you're in the backend directory."
    exit 1
fi

# Check if compression is installed
if ! npm list compression &> /dev/null; then
    echo "📦 Installing compression dependency..."
    npm install compression
fi

# Create .vercelignore if it doesn't exist
if [ ! -f ".vercelignore" ]; then
    echo "📝 Creating .vercelignore file..."
    cat > .vercelignore << EOL
node_modules
*.log
.env.local
.env.development
src/server.js
start-production.sh
ecosystem.config.js
monitor.js
PRODUCTION_README.md
*.pid
logs/
EOL
fi

echo "✅ Pre-deployment checks complete"

# Show current configuration
echo "📋 Deployment Configuration:"
echo "   - Entry point: api/index.js"
echo "   - Platform: Vercel Serverless"
echo "   - Node.js: $(node --version)"
echo "   - Environment: Production"

# Deploy to Vercel
echo "🚀 Starting deployment..."

if [ "$1" = "--production" ]; then
    echo "🔴 Deploying to PRODUCTION"
    vercel --prod
else
    echo "🟡 Deploying to PREVIEW (use --production for production deploy)"
    vercel
fi

echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Set environment variables in Vercel Dashboard:"
echo "   - NODE_ENV=production"
echo "   - MONGODB_URI=your_mongodb_connection_string"
echo "   - JWT_SECRET=your_secure_jwt_secret"
echo ""
echo "2. Test your deployment:"
echo "   curl https://your-deployment-url.vercel.app/api/health"
echo ""
echo "3. Update frontend API_BASE_URL to point to your Vercel deployment"
echo ""
echo "🎯 Happy deploying!"