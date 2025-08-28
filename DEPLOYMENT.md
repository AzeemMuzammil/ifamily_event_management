# Deployment Guide

This guide covers how to deploy the iFamily Games application to production.

## Production Build

1. **Clean build** (recommended for production):
   ```bash
   npm run build:clean
   ```

2. **Regular build**:
   ```bash
   npm run build
   ```

3. **Preview locally**:
   ```bash
   npm run preview
   ```

4. **Preview on network** (accessible from other devices):
   ```bash
   npm run serve
   ```

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize hosting**:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to: `dist`
   - Configure as single-page app: Yes
   - Set up automatic builds: No

4. **Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Option 2: Static File Hosting

The `dist` folder contains all necessary files for deployment:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to any static hosting service:
   - Vercel
   - Netlify  
   - GitHub Pages
   - Any web server with static file support

### Option 3: Local Network Server

For local network deployment (family use):

1. **Build and serve**:
   ```bash
   npm run build
   npm run serve
   ```

2. **Access from other devices** using your computer's IP address

## Environment Configuration

Make sure your production `.env` file contains:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Admin Credentials
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=your_secure_password
```

## Production Checklist

- [x] ✅ TypeScript compilation passes
- [x] ✅ Production build completes without errors
- [x] ✅ All console.log debug statements removed
- [x] ✅ Error boundaries implemented
- [x] ✅ Environment variables configured
- [x] ✅ Firebase Firestore security rules configured
- [x] ✅ Performance optimizations applied

## Firestore Security Rules

Make sure your Firestore has the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access
    match /{document=**} {
      allow read: if true;
    }
    
    // Allow writes for demo purposes (adjust for production security)
    match /{document=**} {
      allow write: if true;
    }
  }
}
```

## Performance Notes

- Initial bundle size: ~595KB (gzipped: ~159KB)
- This is normal for Firebase applications
- Real-time updates minimize data fetching after initial load
- Application caches in browser for fast subsequent loads

## Troubleshooting

### Build Issues
- Run `npm run clean` then `npm run build`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all environment variables are set

### Runtime Issues  
- Check browser console for errors
- Verify Firebase configuration and rules
- Test network connectivity to Firebase
- Clear browser cache and localStorage

## Monitoring

The application includes:
- Error boundaries for React error handling
- Console error logging for debugging
- User-friendly error messages
- Automatic retry mechanisms

For a family application, basic monitoring through browser dev tools and Firebase console is sufficient.