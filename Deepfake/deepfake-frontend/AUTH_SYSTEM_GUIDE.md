# Firebase Authentication System - Complete Guide

A production-ready authentication system built with React, Vite, Firebase, and TailwindCSS.

## Features

✅ **Email & Password Authentication**
- User signup with email and password
- Email verification requirement
- Secure login with verified email check
- Password reset functionality

✅ **Authentication Flow**
- Signup → Email Verification → Login → Profile
- Auto-redirects unverified users to verification page
- Protected routes with PrivateRoute component
- Persistent auth state across refreshes

✅ **User Management**
- View and edit user profile
- Display name and photo URL management
- Account information and metadata
- Logout functionality

✅ **Security Features**
- Email verification before access
- Password reset via email link
- Protected routes (PrivateRoute component)
- Error handling and validation
- Auth state listener for persistence

✅ **UI/UX**
- Dark mode friendly Tailwind CSS styling
- Fully responsive design
- Loading states and error messages
- Success notifications
- Form validation

## Project Structure

```
src/
├── firebase.js                 # Firebase configuration
├── App.jsx                     # Main router component
├── main.jsx                    # Application entry point
├── index.css                   # Global styles with Tailwind
├── contexts/
│   └── AuthContext.jsx         # Authentication context provider
├── components/
│   └── PrivateRoute.jsx        # Route protection component
└── pages/
    ├── signup.jsx              # User registration page
    ├── login.jsx               # User login page
    ├── forgotpassword.jsx      # Password reset request
    ├── resetpassword.jsx       # Password reset page
    ├── emailverification.jsx   # Email verification page
    ├── profile.jsx             # User profile page (protected)
    └── notfound.jsx            # 404 page
```

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Firebase project (with Email/Password auth enabled)

### Steps

1. **Install dependencies**
```bash
npm install
```

2. **Configure Firebase**
Update `src/firebase.js` with your Firebase credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

## Authentication Context API

### `useAuth()` Hook

Returns an object with the following properties and methods:

```javascript
{
  currentUser,              // Current authenticated user object
  signup(email, password),  // Register new user
  login(email, password),   // Login with verified email
  logout(),                 // Sign out user
  sendPasswordReset(email), // Send password reset email
  sendVerificationEmail(),  // Resend verification email
  updateUserProfile(updates), // Update profile (displayName, photoURL)
  error                     // Last error message
}
```

### Usage Example

```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { currentUser, signup, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {currentUser?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Routing Configuration

| Route | Component | Protection | Description |
|-------|-----------|-----------|-------------|
| `/signup` | Signup | Public | Create new account |
| `/login` | Login | Public | Log in to account |
| `/forgot-password` | ForgotPassword | Public | Request password reset |
| `/reset-password` | ResetPassword | Public | Reset password (from email link) |
| `/verify-email` | EmailVerification | Public | Verify email address |
| `/profile` | Profile | Private | User profile (email verified) |
| `/` | Profile | Private | Redirect to profile |
| `*` | NotFound | Public | 404 page |

## Authentication Flow

### Signup Flow
```
1. User enters email & password on /signup
2. Account created in Firebase
3. Verification email sent automatically
4. User logged out and redirected to /verify-email
5. User clicks email link to verify
6. Can now login from /login
```

### Login Flow
```
1. User enters credentials on /login
2. System checks if email is verified
3. If not verified → redirect to /verify-email
4. If verified → login successful → redirect to /profile
```

### Password Reset Flow
```
1. User clicks "Forgot password" on /login
2. Enters email on /forgot-password
3. Reset email sent with link
4. User clicks link in email
5. Redirected to /reset-password with reset code
6. Enter new password and confirm
7. Redirect to /login after success
```

## Key Features Explained

### PrivateRoute Component
Protects routes that require authentication:
- Checks if user is logged in
- Checks if email is verified
- Redirects to login/verification if not authenticated

```javascript
<Route
  path="/profile"
  element={
    <PrivateRoute>
      <Profile />
    </PrivateRoute>
  }
/>
```

### AuthContext Provider
Manages global authentication state:
- Listens to Firebase auth state changes
- Provides auth methods to entire app
- Prevents rendering until auth state is loaded
- Handles errors and loading states

```javascript
<AuthProvider>
  <Routes>
    {/* All routes here have access to auth context */}
  </Routes>
</AuthProvider>
```

### Email Verification
- Automatically sent on signup
- Can be resent with cooldown (60 seconds)
- Blocks access to protected routes until verified
- Unverified users redirected to verification page

## Error Handling

The system handles various Firebase errors:
- **auth/email-already-in-use** - Account exists
- **auth/weak-password** - Password too short
- **auth/invalid-email** - Invalid email format
- **auth/user-not-found** - Account doesn't exist
- **auth/wrong-password** - Incorrect password
- **auth/expired-action-code** - Reset link expired
- **auth/invalid-action-code** - Invalid reset link

Custom validation:
- Password confirmation matching
- Minimum password length (6 chars)
- Email format validation

## Styling

Uses TailwindCSS v4 with:
- Dark mode design (bg-gray-900 background)
- Blue accent colors (focus states, buttons)
- Responsive form layouts
- Error/success/info alert styling
- Smooth transitions and hover effects

### Color Scheme
- **Primary**: Blue (Focus, buttons)
- **Background**: Gray-900 (Dark)
- **Error**: Red
- **Success**: Green
- **Info**: Blue
- **Text**: White/Gray-300

## Security Considerations

1. **Email Verification Required** - Prevents fake email signups
2. **Password Reset** - Secure link-based reset with expiration
3. **Protected Routes** - Client-side protection via PrivateRoute
4. **Firebase Security** - Use Firebase Rules for server-side protection
5. **No Password Storage** - Firebase handles password hashing
6. **Auth State Persistence** - Firebase auto-restores login state

## Firebase Configuration Required

### Enable Authentication Methods
1. Go to Firebase Console
2. Authentication → Sign-in method
3. Enable "Email/Password"

### Configure Email Templates
1. Authentication → Templates
2. Customize verification email
3. Customize password reset email

### Security Rules (Optional)
Add to Firestore/Realtime Database to protect user data:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

## Deployment Checklist

- [ ] Firebase project set up
- [ ] Email/Password auth enabled
- [ ] Environment variables configured
- [ ] Email templates customized
- [ ] Security rules configured
- [ ] Build tested: `npm run build`
- [ ] All auth flows tested
- [ ] Error messages reviewed
- [ ] Mobile responsiveness checked

## Troubleshooting

### "Could not determine executable to run"
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -r node_modules`
- Reinstall: `npm install`

### Email not sending
- Check Firebase email templates configuration
- Verify email address in test
- Check spam folder
- Wait 5-10 minutes (can be delayed)

### Redirect loops
- Ensure Firebase is initialized before rendering
- Check PrivateRoute component logic
- Verify email verification status

### 404 on custom domains
- Ensure all routes redirect to index.html
- Configure hosting provider for SPA

## Dependencies

- **react**: UI framework
- **react-dom**: React DOM rendering
- **react-router-dom**: Routing library
- **firebase**: Firebase SDK
- **tailwindcss**: Styling framework
- **vite**: Build tool and dev server

## License

MIT - Feel free to use this authentication system in your projects!

## Support

For issues or questions:
1. Check Firebase documentation
2. Review auth flow diagrams
3. Check browser console for errors
4. Verify Firebase configuration
