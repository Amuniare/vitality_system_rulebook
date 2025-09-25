# Firebase Setup and Deployment Guide

## Overview

This document provides step-by-step instructions for setting up and deploying the Vitality System Character Builder with Firebase hosting and Firestore database.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account for Firebase

## Initial Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `vitality-system-builder` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Required Services

In your Firebase project console:

1. **Authentication** (optional for future use):
   - Go to Authentication > Sign-in method
   - Enable Anonymous and/or Email/Password

2. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in test mode (rules will be configured automatically)
   - Choose location closest to your users

3. **Hosting**:
   - Go to Hosting
   - Click "Get started"
   - Follow the setup instructions

### 3. Configure Firebase in Your Project

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) 
4. Register app with nickname: "Vitality Character Builder"
5. Copy the Firebase configuration object
6. Update `modernApp/config/firebase.js` with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "your-app-id"
};
```

### 4. Install Dependencies

```bash
# In the root directory
cd modernApp
npm install

# Install Firebase CLI globally if not already installed
npm install -g firebase-tools
```

### 5. Login to Firebase

```bash
firebase login
```

### 6. Initialize Firebase in Your Project

```bash
# In the root directory (not modernApp)
firebase init

# Select:
# - Firestore: Configure security rules and indexes files
# - Hosting: Configure and deploy Firebase Hosting sites

# Firestore setup:
# - Use existing firestore.rules
# - Use existing firestore.indexes.json

# Hosting setup:
# - Public directory: modernApp
# - Single-page app: Yes
# - Set up automatic builds and deploys with GitHub: No (for now)
# - File modernApp/index.html already exists. Overwrite: No
```

## Development Workflow

### Local Development

```bash
# Serve locally with Firebase hosting
firebase serve --only hosting

# Or use npm script from modernApp directory
cd modernApp
npm start
```

### Deploy to Production

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

## Security Configuration

### Firestore Security Rules

The current security rules allow:
- Public read access for the character gallery
- Controlled write access with validation
- Size limits to prevent abuse

For production, consider:
- Adding user authentication
- Restricting writes to authenticated users
- Adding user ownership validation

### Environment Variables

For different environments, you can:
1. Create multiple Firebase projects (dev, staging, prod)
2. Use Firebase project aliases
3. Configure different environments in `.firebaserc`

```json
{
  "projects": {
    "default": "vitality-system-dev",
    "prod": "vitality-system-prod"
  }
}
```

## Database Structure

### Characters Collection (`/characters/{characterId}`)
```javascript
{
  id: "string",
  name: "string",
  tier: number,
  characterType: "string",
  archetypes: object,
  combatAttributes: object,
  utilityAttributes: object,
  traits: array,
  flaws: array,
  boons: array,
  features: array,
  // ... other character data
  createdAt: timestamp,
  updatedAt: timestamp,
  syncedAt: timestamp
}
```

### Character Metadata Collection (`/character_metadata/{characterId}`)
```javascript
{
  id: "string",
  name: "string", 
  tier: number,
  characterType: "string",
  mainArchetype: "string",
  totalPoints: number,
  level: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Monitoring and Analytics

### Firestore Usage
- Monitor document reads/writes in Firebase Console
- Set up billing alerts for cost control
- Review security rules in the Rules playground

### Hosting Analytics
- Monitor traffic and performance in Firebase Console
- Set up custom domains if needed
- Configure CDN caching headers

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   - Check Firestore security rules
   - Verify Firebase configuration
   - Ensure proper initialization

2. **Build/Deploy Failures**:
   - Check that `modernApp` directory contains all required files
   - Verify Firebase CLI is logged in
   - Check project permissions

3. **Gallery Not Loading**:
   - Verify Firestore has data
   - Check browser console for errors
   - Test Firebase connection in dev tools

### Debug Mode

Enable debug logging in the browser console:
```javascript
localStorage.setItem('vitality_log_level', 'debug');
```

## Future Enhancements

### User Authentication
1. Enable Firebase Authentication
2. Update security rules for user ownership
3. Add user profiles and character ownership

### Advanced Features
1. Real-time character collaboration
2. Character versioning/history
3. Advanced search and filtering
4. Character templates and presets
5. Export to various formats (PDF, JSON, etc.)

### Performance Optimization
1. Implement pagination for large character lists
2. Add client-side caching
3. Optimize Firestore queries
4. Implement incremental loading

## Support

For issues with this setup:
1. Check Firebase Console for errors
2. Review browser console logs
3. Consult Firebase documentation
4. Check GitHub issues for known problems

## URLs

After deployment, your application will be available at:
- **Hosting URL**: `https://your-project-id.web.app`
- **Custom Domain**: Configure in Firebase Hosting settings
- **Gallery**: `https://your-project-id.web.app/gallery.html`
- **Main App**: `https://your-project-id.web.app/index.html`