#!/bin/bash

# Setup script for AI-Powered Code Review Assistant
# This script automates the initial setup process

set -e

echo "🚀 Setting up AI-Powered Code Review Assistant..."

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18 or higher is required"
    exit 1
fi
echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your credentials"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Build the project
echo "🔨 Building the project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your GitHub and IBM Watson credentials"
echo "2. Configure analysis rules in config/analysis-rules.json"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Set up GitHub webhook pointing to your server"
echo ""
echo "For more information, see docs/SETUP.md"

# Made with Bob
