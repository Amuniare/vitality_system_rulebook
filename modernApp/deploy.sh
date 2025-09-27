#!/bin/bash

# Vitality System Firebase Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Vitality System deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Check if modernApp directory exists
if [ ! -d "modernApp" ]; then
    echo "❌ modernApp directory not found."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies if package.json exists
if [ -f "modernApp/package.json" ]; then
    echo "📦 Installing dependencies..."
    cd modernApp
    npm install
    cd ..
    echo "✅ Dependencies installed"
fi

# Validate configuration files
echo "🔍 Validating configuration..."

if [ ! -f "firestore.rules" ]; then
    echo "❌ firestore.rules not found"
    exit 1
fi

if [ ! -f "firestore.indexes.json" ]; then
    echo "❌ firestore.indexes.json not found"
    exit 1
fi

if [ ! -f "modernApp/config/firebase.js" ]; then
    echo "❌ Firebase configuration not found at modernApp/config/firebase.js"
    echo "   Please update your Firebase configuration."
    exit 1
fi

echo "✅ Configuration files validated"

# Run deployment
echo "🔥 Deploying to Firebase..."

# Deploy Firestore rules first
echo "📋 Deploying Firestore rules..."
firebase deploy --only firestore:rules,firestore:indexes

# Deploy hosting
echo "🌐 Deploying hosting..."
firebase deploy --only hosting

echo "✅ Deployment completed successfully!"

# Get the hosting URL
PROJECT_ID=$(firebase use --current)
echo ""
echo "🎉 Your application is now live at:"
echo "   https://${PROJECT_ID}.web.app"
echo "   https://${PROJECT_ID}.firebaseapp.com"
echo ""
echo "📖 Character Gallery: https://${PROJECT_ID}.web.app/gallery.html"
echo "🛠️ Character Builder: https://${PROJECT_ID}.web.app/index.html"
echo ""
echo "🔧 Manage your project at: https://console.firebase.google.com/project/${PROJECT_ID}"