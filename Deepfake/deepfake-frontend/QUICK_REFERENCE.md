# Quick Reference - Firebase Auth System

## File Map

```
src/
├── firebase.js                    # Firebase init & config
├── App.jsx                        # Router with all routes
├── main.jsx                       # Entry point (already configured)
├── index.css                      # Tailwind styles
├── contexts/AuthContext.jsx       # Auth provider & hook
├── components/PrivateRoute.jsx    # Protected routes
└── pages/
    ├── signup.jsx                 # Register page
    ├── login.jsx                  # Login page
    ├── forgotpassword.jsx         # Request password reset
    ├── resetpassword.jsx          # Reset password form
    ├── emailverification.jsx      # Email verification
    ├── profile.jsx                # User profile (protected)
    └── notfound.jsx               # 404 page
```

## Using the Auth System

### 1. Import the Hook
```javascript
import { useAuth } from '../contexts/AuthContext';
```

### 2. Use in Your Component
```javascript
const { currentUser, signup, login, logout, sendPasswordReset } = useAuth();
```

### 3. Check Authentication Status
```javascript
if (currentUser) {
  console.log('User is logged in:', currentUser.email);
}
```

### 4. Check Email Verification
```javascript
if (currentUser?.emailVerified) {
  // User email is verified
}
```

## Key Methods

### Sign Up
```javascript
await signup('user@example.com', 'password123');
// User is signed out, redirected to /verify-email
```

### Login
```javascript
await login('user@example.com', 'password123');
// If email verified → redirected to /profile
// If not verified → redirected to /verify-email
```

### Logout
```javascript
await logout();
// Redirected to /login
```

### Password Reset
```javascript
await sendPasswordReset('user@example.com');
// Email sent with reset link
```

### Resend Verification Email
```javascript
await sendVerificationEmail();
// Verification email sent
```

### Update Profile
```javascript
await updateUserProfile({
  displayName: 'John Doe',
  photoURL: 'https://example.com/photo.jpg'
});
```

## Authentication Routes

| Path | Page | Status | Login Required |
|------|------|--------|---|
| `/signup` | Sign Up Form | Public | No |
| `/login` | Login Form | Public | No |
| `/forgot-password` | Forgot Password | Public | No |
| `/reset-password?oobCode=...` | Reset Password | Public | No |
| `/verify-email` | Email Verification | Public* | No* |
| `/profile` | User Profile | Private | Yes |
| `/` | Home (→ Profile) | Private | Yes |

*Public page but shown for unverified users

## Firebase Configuration

Your Firebase config in `src/firebase.js`:
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

## Error Messages Handled

| Error | Page | Solution |
|-------|------|----------|
| Email already in use | Signup | Use different email |
| Weak password | Signup | Use 6+ char password |
| Invalid email | All | Use valid email format |
| User not found | Login | Create account or verify |
| Wrong password | Login | Check password |
| Email not verified | Login | Verify email first |
| Reset link expired | Reset | Request new link |

## Component Examples

### Protected Page
```javascript
import PrivateRoute from '../components/PrivateRoute';
import Profile from '../pages/profile';

// In your routes:
<Route
  path="/profile"
  element={
    <PrivateRoute>
      <Profile />
    </PrivateRoute>
  }
/>
```

### Using Auth in a Page
```javascript
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MyPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Welcome {currentUser?.email}</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### Form with Validation
```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const { signup } = useAuth();
const navigate = useNavigate();

async function handleSubmit(e) {
  e.preventDefault();
  
  try {
    setError('');
    setLoading(true);
    await signup(email, password);
    navigate('/verify-email');
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

## Styling Classes (TailwindCSS)

### Forms
```jsx
<input className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
```

### Buttons
```jsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
  Click me
</button>
```

### Error Alert
```jsx
<div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
  Error message
</div>
```

### Success Alert
```jsx
<div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded">
  Success message
</div>
```

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview

# Lint code
npm run lint
```

## Testing Checklist

- [ ] Signup with new email → verification email sent
- [ ] Can't login before email verified
- [ ] Click verification link in email → email verified
- [ ] Can login after verification → redirects to profile
- [ ] Profile shows user info
- [ ] Can edit display name and photo
- [ ] Forgot password → reset email sent
- [ ] Reset password → can login with new password
- [ ] Logout → redirects to login
- [ ] Try accessing /profile without login → redirects to login
- [ ] All error messages display correctly
- [ ] Responsive design on mobile

## Common Issues & Fixes

### "Firebase is not initialized"
→ Check firebase.js config, ensure all credentials are correct

### Email not sending
→ Check Firebase email template, wait 5-10 mins, check spam

### Can't login despite verification
→ Refresh page, check if email is actually verified

### Redirect loop
→ Clear browser cache and localStorage

### Form keeps showing loading state
→ Check console for errors, verify Firebase config

## Next Steps

1. Test all auth flows
2. Customize email templates in Firebase
3. Add Firebase Firestore for user data
4. Add profile picture upload
5. Add two-factor authentication
6. Add social login (Google, GitHub, etc.)
