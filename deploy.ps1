# Vitality System Firebase Deployment Script (PowerShell)
# This script handles the complete deployment process for Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Vitality System deployment..." -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ Firebase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in to Firebase
try {
    firebase projects:list | Out-Null
} catch {
    Write-Host "❌ Not logged in to Firebase. Please run:" -ForegroundColor Red
    Write-Host "   firebase login" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "firebase.json")) {
    Write-Host "❌ firebase.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if modernApp directory exists
if (-not (Test-Path "modernApp")) {
    Write-Host "❌ modernApp directory not found." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Install dependencies if package.json exists
if (Test-Path "modernApp/package.json") {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    Set-Location "modernApp"
    npm install
    Set-Location ".."
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Validate configuration files
Write-Host "🔍 Validating configuration..." -ForegroundColor Blue

if (-not (Test-Path "firestore.rules")) {
    Write-Host "❌ firestore.rules not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "firestore.indexes.json")) {
    Write-Host "❌ firestore.indexes.json not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "modernApp/config/firebase.js")) {
    Write-Host "❌ Firebase configuration not found at modernApp/config/firebase.js" -ForegroundColor Red
    Write-Host "   Please update your Firebase configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Configuration files validated" -ForegroundColor Green

# Run deployment
Write-Host "🔥 Deploying to Firebase..." -ForegroundColor Blue

# Deploy Firestore rules first
Write-Host "📋 Deploying Firestore rules..." -ForegroundColor Blue
firebase deploy --only firestore:rules,firestore:indexes

# Deploy hosting
Write-Host "🌐 Deploying hosting..." -ForegroundColor Blue
firebase deploy --only hosting

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

# Get the hosting URL
$PROJECT_ID = firebase use --current

Write-Host ""
Write-Host "🎉 Your application is now live at:" -ForegroundColor Green
Write-Host "   https://$PROJECT_ID.web.app" -ForegroundColor Cyan
Write-Host "   https://$PROJECT_ID.firebaseapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Character Gallery: https://$PROJECT_ID.web.app/gallery.html" -ForegroundColor Blue
Write-Host "🛠️ Character Builder: https://$PROJECT_ID.web.app/index.html" -ForegroundColor Blue
Write-Host ""
Write-Host "🔧 Manage your project at: https://console.firebase.google.com/project/$PROJECT_ID" -ForegroundColor Yellow