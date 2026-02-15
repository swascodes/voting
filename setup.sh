#!/bin/bash
# Voting Frontend Setup Script
# Run this from within WSL (not from Windows PowerShell)

set -e

echo "🔧 Setting up Voting Frontend..."

# Clean previous installations
if [ -d "node_modules" ]; then
  echo "Cleaning old node_modules..."
  rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
  echo "Removing package-lock.json..."
  rm -f package-lock.json
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Show next steps
echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"
