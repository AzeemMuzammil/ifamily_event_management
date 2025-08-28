# iFamily Games - Setup Guide

This guide will walk you through setting up the iFamily Games application from scratch.

## Step 1: Firebase Project Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter project name: "ifamily-games" (or your preferred name)
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Enable Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Start in "Test mode" (we'll set proper rules later)
   - Choose your location (closest to your users)
   - Click "Done"

3. **Get Firebase Configuration**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click "Web app" icon (</>)
   - Register app with name "iFamily Games"
   - Copy the Firebase config object

## Step 2: Application Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase configuration in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_from_firebase_config
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Step 3: Initial Data Setup


### Admin Authentication Setup
The admin credentials are now stored in your `.env` file:
- **Username**: Set in `VITE_ADMIN_USERNAME` (default: "admin")
- **Password**: Set in `VITE_ADMIN_PASSWORD` (default: "admin_password_123")

**No Firestore setup required for admin authentication!**
The credentials are validated directly against environment variables.

### Create Sample Houses
Create collection `houses` with these documents:

**House 1:**
```json
{
  "name": "Red Dragons",
  "totalScore": 0,
  "categoryScores": {
    "kids": 0,
    "elders": 0,
    "adult_men": 0,
    "adult_women": 0
  }
}
```

**House 2:**
```json
{
  "name": "Blue Eagles",
  "totalScore": 0,
  "categoryScores": {
    "kids": 0,
    "elders": 0,
    "adult_men": 0,
    "adult_women": 0
  }
}
```

**House 3:**
```json
{
  "name": "Green Lions",
  "totalScore": 0,
  "categoryScores": {
    "kids": 0,
    "elders": 0,
    "adult_men": 0,
    "adult_women": 0
  }
}
```

### Create Sample Players
Create collection `players` with sample documents:

```json
{
  "name": "Alice Johnson",
  "houseId": "red_dragons_document_id",
  "category": "adult_women",
  "individualScore": 0,
  "categoryScore": 0
}
```

```json
{
  "name": "Bob Smith",
  "houseId": "blue_eagles_document_id", 
  "category": "adult_men",
  "individualScore": 0,
  "categoryScore": 0
}
```

## Step 4: Firestore Security Rules

Replace the default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to all collections
    match /{document=**} {
      allow read: if true;
    }
    
    // For production, you may want to restrict writes
    // This example allows all writes for simplicity
    match /{document=**} {
      allow write: if true;
    }
    
    // More secure alternative (comment out the above write rule):
    // Allow writes only from authenticated admin sessions
    // match /{document=**} {
    //   allow write: if request.auth != null;
    // }
  }
}
```

## Step 5: Testing the Application

1. **Access the Application**
   - Open `http://localhost:3000`
   - You should see the dashboard with your sample data

2. **Test Admin Login**
   - Click "Admin" in the top right
   - Username: `admin` (or your `VITE_ADMIN_USERNAME`)
   - Password: `admin_password_123` (or your `VITE_ADMIN_PASSWORD`)
   - You should be able to access admin features

3. **Test Core Features**
   - Dashboard displays houses and players
   - Events page shows empty state (no events yet)
   - Admin can add/edit players and houses

## Step 6: Creating Your First Event

1. **Login as Admin**
2. **Go to "Manage Events"**
3. **Create Base Event:**
   - Name: "Tug of War"
   - Type: Group
   - Categories: Select "Adult Men" and "Adult Women"
   - Scoring: 1st: 10 pts, 2nd: 6 pts, 3rd: 3 pts
   - Click "Save"

4. **Check Events Page**
   - You should see "Tug of War - Men" and "Tug of War - Women" instances
   - Status should be "Scheduled"

## Step 7: Production Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting** (Optional)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   # Select your Firebase project
   # Set public directory to 'dist'
   # Configure as single-page app: Yes
   firebase deploy
   ```

## Step 8: Additional Configuration

### Password Hash Generation
To create new admin users with custom passwords:

```javascript
// Run this in browser console or Node.js
const password = "your_new_password";
const encoder = new TextEncoder();
const data = encoder.encode(password);
crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Password hash:', hashHex);
});
```

### Backup Strategy
- Regular Firestore exports via Firebase Console
- Export/import functionality can be added to the admin interface
- Consider automated backups for production use

## Troubleshooting

### Common Setup Issues

1. **"Firebase not configured" error**
   - Check `.env` file exists and has correct values
   - Restart development server after changing `.env`

2. **"Permission denied" in Firestore**
   - Check Firestore rules allow the operation
   - Verify Firebase project is active

3. **Admin login fails**
   - Verify admin user document exists in Firestore
   - Check password hash is correct
   - Clear browser localStorage: `localStorage.clear()`

4. **Build fails**
   - Check TypeScript errors: `npx tsc --noEmit`
   - Verify all dependencies are installed

### Getting Help

1. Check browser console for errors
2. Check Firebase Console > Functions > Logs for server errors
3. Verify network requests in browser Developer Tools
4. Test Firestore connections directly in Firebase Console

## Next Steps

After setup, you can:
1. Add more houses and players
2. Create events and record results
3. Customize the UI colors and branding
4. Add more participant categories if needed
5. Implement additional features like photo uploads
6. Set up automated scoring systems

The application is now ready for your sports activity management needs!