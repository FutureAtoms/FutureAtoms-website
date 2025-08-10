#!/bin/bash

# FutureAtoms Website Setup Script
# Created by Abhilash Chadhar

echo "🚀 FutureAtoms Website Setup"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI detected: $(firebase --version)"
fi

# Install dependencies
echo ""
echo "📦 Installing project dependencies..."
npm install

# Firebase login
echo ""
echo "🔐 Logging into Firebase..."
firebase login

# Initialize Firebase project
echo ""
echo "🔥 Initializing Firebase project..."
echo "Please follow these steps:"
echo "1. Choose 'Use an existing project' or create a new one"
echo "2. Set public directory to: public"
echo "3. Configure as single-page app: No"
echo "4. Don't overwrite any existing files"
echo ""
read -p "Press Enter to continue with Firebase init..."
firebase init hosting

# Update project configuration
echo ""
echo "📝 Please update the following:"
echo "1. Edit .firebaserc with your project ID"
echo "2. Add your Firebase config to the HTML files"
echo ""

# Test locally
echo "🧪 Would you like to test the site locally? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Starting local server..."
    firebase serve
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Firebase: firebase deploy"
echo "2. Visit your site at: https://[your-project-id].web.app"
echo ""
echo "For more information, check the README.md file"