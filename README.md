# iFamily Games - Sports Activity Management

A responsive web application for managing sports and fun activities with house-based competitions, built with React, TypeScript, and Firebase.

## Features

### Public Features (No Authentication Required)
- **Real-time Dashboard**: Live standings, leaderboards, and event status updates
- **Live Event Agenda**: All scheduled events with real-time completion status 
- **Live Results Display**: Real-time event results (individual and group)
- **Awards Display**: Special category awards for group activities
- **Instant Updates**: All changes reflect immediately across all connected devices

### Admin Features (Authentication Required)
- **User Management**: Add/edit/delete players with name and house assignment
- **House Management**: Create/edit/delete houses/groups
- **Event Management**: Create/edit/delete events with detailed configuration
- **Event Control**: Start and end events, record results and rankings
- **Awards Management**: Add special category awards for group activities

### Multi-Category System
- **Categories**: Kids, Elders, Adult Men, Adult Women
- **Multi-Category Events**: Events can be assigned to multiple categories
- **Category-Based Scoring**: Players earn points within specific categories
- **Separate Leaderboards**: Overall and category-specific rankings

### Real-time Features
- **Live Dashboard Updates**: Leaderboards update instantly when scores change
- **Real-time Event Status**: Event progress reflects immediately across all devices
- **Live Results**: Results appear in real-time as they're recorded
- **Instant Data Sync**: All changes propagate immediately to all connected users
- **No Refresh Required**: Data updates automatically without page reloads

## Technology Stack

- **Frontend**: React 19, TypeScript, Bootstrap 5
- **Build Tool**: Vite
- **Database**: Firebase Firestore with **Real-time listeners**
- **Authentication**: Simple environment-based admin login
- **Responsive Design**: Mobile-first approach with Bootstrap's responsive grid
- **Real-time Updates**: Live data synchronization across all users

## Prerequisites

- Node.js 16+ and npm
- Firebase project with Firestore enabled

## Installation

1. **Clone and install dependencies:**
   ```bash
   cd ifamily_event_management
   npm install
   ```

2. **Set up Firebase:**
   - Create a new Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database
   - Get your Firebase config from Project Settings > General > Your apps
   - Copy `.env.example` to `.env` and fill in your Firebase configuration:
     ```
     VITE_FIREBASE_API_KEY=your_api_key_here
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
     VITE_FIREBASE_PROJECT_ID=your_project_id_here
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
     VITE_FIREBASE_APP_ID=your_app_id_here
     ```

3. **Configure Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if false; // Configure based on your security needs
       }
     }
   }
   ```

4. **Set up admin credentials:**
   Configure your admin login credentials in your `.env` file:
   ```env
   VITE_ADMIN_USERNAME=admin
   VITE_ADMIN_PASSWORD=admin_password_123
   ```
   
   These credentials will be used to login to the admin interface.

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── dashboard/       # Dashboard-specific components
│   ├── Header.tsx       # Main header with auth
│   ├── Navigation.tsx   # Navigation menu
│   └── LoginModal.tsx   # Admin login modal
├── pages/              # Page components
│   ├── admin/          # Admin-only pages
│   ├── Dashboard.tsx   # Main dashboard
│   └── Agenda.tsx      # Events agenda
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── services/           # External services
│   ├── firebase.ts     # Firebase configuration
│   └── firestore.ts    # Firestore operations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── auth.ts         # Authentication utilities
├── App.tsx            # Main app component
└── main.tsx           # App entry point
```

## Data Models

### Collections Structure
- **houses**: House/team information and scores
- **players**: Player information and individual scores
- **baseEvents**: Event templates
- **eventInstances**: Individual event instances by category
- **awards**: Special awards for group activities
- **admins**: Admin user credentials

### Category System
The system supports four categories:
- `kids`: Younger participants
- `elders`: Senior participants  
- `adult_men`: Adult male participants
- `adult_women`: Adult female participants

## Usage Guide

### For Public Users
1. Visit the application URL
2. View dashboard for current standings
3. Check Events tab for schedule and results
4. No login required for viewing

### For Administrators
1. Click "Admin" button in header
2. Login with admin credentials
3. Use navigation to access:
   - **Players**: Add/edit participants
   - **Houses**: Manage teams/groups
   - **Manage Events**: Create and control events

### Event Management Workflow
1. **Create Base Event**: Define event name, type, categories, and scoring
2. **Event Instances Generated**: System creates separate instances for each category
3. **Start Event**: Change status to "in-progress"
4. **Record Results**: Add winners and rankings
5. **Add Special Awards**: (Optional) For group events
6. **Complete Event**: Results are displayed on dashboard

### Admin Authentication

**Single Admin User:**
- Username: Set in `VITE_ADMIN_USERNAME` (default: "admin")
- Password: Set in `VITE_ADMIN_PASSWORD` (default: "admin_password_123")
- No database storage required - credentials are validated against environment variables

**Creating Sample Data:**
Open browser console and run:
```javascript
// Create sample houses, players, and events
createSampleData()
```

## Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

## Security Considerations

- Admin credentials stored securely in environment variables
- Session management via localStorage
- Firestore security rules should be configured appropriately
- Input validation on all forms
- Simple but effective authentication for small-scale deployments

## Contributing

1. Follow TypeScript best practices
2. Use existing component patterns
3. Ensure responsive design compatibility
4. Test on multiple devices/screen sizes

## Troubleshooting

### Common Issues

1. **Firebase connection errors**
   - Check `.env` file configuration
   - Verify Firestore is enabled in Firebase console
   - Check network connectivity

2. **Admin login not working**
   - Verify credentials in `.env` file match what you're entering
   - Check environment variables are loaded correctly
   - Clear browser localStorage if needed: `localStorage.clear()`

3. **Build warnings about chunk size**
   - This is normal for Firebase applications
   - Can be optimized with code splitting if needed

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Firebase console for errors
3. Check browser console for client-side errors

## License

This project is created for iFamily Games sports activity management.