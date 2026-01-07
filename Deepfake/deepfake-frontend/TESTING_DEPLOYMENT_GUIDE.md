# Testing & Deployment Guide

## 🧪 Testing the Authentication System

### Pre-Testing Checklist

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser pointing to `http://localhost:5174/`
- [ ] Firebase project created and configured
- [ ] Email/Password auth enabled in Firebase Console

### Test Scenario 1: Complete Signup & Login Flow

**Objective:** Create account → Verify email → Login → Access profile

#### Steps:
1. Navigate to `http://localhost:5174/signup`
2. Fill signup form:
   - Email: `testuser@example.com`
   - Password: `Test@Password123`
   - Confirm: `Test@Password123`
3. Click "Sign Up"
4. **Expected:** 
   - Success message appears
   - Redirected to `/verify-email`
   - Email notification shows in Firebase Console

5. Go to Firebase Console → Authentication → Users
6. Click on the test user
7. Click "Edit" → Check "Email Verified" → Save
8. Return to `/verify-email` and click "I've Verified My Email"
9. Should be redirected to `/profile`
10. **Expected:**
   - Profile page displays user info
   - Display name shows as "User" initially
   - User email is displayed correctly

### Test Scenario 2: Profile Editing

**Objective:** Update display name and profile picture

#### Steps:
1. From profile page, click "Edit Profile"
2. Fill in:
   - Display Name: `John Doe`
   - Photo URL: `https://i.pravatar.cc/150?img=1`
3. Click "Save Changes"
4. **Expected:**
   - Success message appears
   - Profile picture updates to avatar
   - Display name changes to "John Doe"

### Test Scenario 3: Forgot & Reset Password

**Objective:** Reset password via email link

#### Steps:
1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter email: `testuser@example.com`
4. Click "Send Password Reset Email"
5. **Expected:**
   - Success message: "Check your email for password reset link"
6. Go to Firebase Console → Authentication → Users
7. Click three dots next to user → Delete
8. Or use Firebase emulator for email testing
9. In real scenario: Check email inbox for reset link
10. Click reset link (contains `oobCode`)
11. Enter new password: `NewPassword@123`
12. Click "Reset Password"
13. **Expected:**
   - Success message
   - Redirected to `/login` after 2 seconds
14. Login with new password
15. **Expected:**
   - Login successful
   - Redirected to `/profile`

### Test Scenario 4: Email Verification

**Objective:** Test email verification requirement

#### Steps:
1. Create new account (don't verify email)
2. Try to login with unverified email
3. **Expected:**
   - Error message: "Please verify your email before logging in"
   - NOT redirected to profile
   - Redirected to `/verify-email`
4. On email verification page, click "Resend Verification Email"
5. **Expected:**
   - Button shows "Resend in 60s" countdown
   - Can't click again for 60 seconds
   - Success message: "Verification email sent"
6. Verify email manually (Firebase Console)
7. Click "I've Verified My Email"
8. **Expected:**
   - Page refreshes
   - Redirected to `/profile`

### Test Scenario 5: Protected Routes

**Objective:** Verify unauthenticated users can't access protected routes

#### Steps:
1. Open browser console: `F12`
2. Clear localStorage: 
   ```javascript
   localStorage.clear()
   ```
3. Navigate to `http://localhost:5174/profile`
4. **Expected:**
   - Redirected to `/login`
5. Log out (if logged in):
   - Click logout button
   - Should redirect to `/login`
6. Try accessing `/profile` again
7. **Expected:**
   - Still redirected to `/login`

### Test Scenario 6: Error Messages

Test each error scenario:

#### Invalid Email:
1. Go to `/signup`
2. Enter: `invalidemail`
3. Click Sign Up
4. **Expected:** HTML5 validation prevents submission

#### Password Mismatch:
1. Go to `/signup`
2. Password: `Test123456`
3. Confirm: `Different123`
4. Click Sign Up
5. **Expected:** Error: "Passwords do not match"

#### Weak Password:
1. Go to `/signup`
2. Password: `short`
3. Confirm: `short`
4. Click Sign Up
5. **Expected:** Error: "Password must be at least 6 characters"

#### Existing Email:
1. Sign up with `test@example.com`
2. Sign up again with same email
3. **Expected:** Error: "auth/email-already-in-use"

#### Wrong Password:
1. Go to `/login`
2. Correct email, wrong password
3. Click Login
4. **Expected:** Error: "auth/wrong-password"

### Test Scenario 7: 404 Page

#### Steps:
1. Navigate to `http://localhost:5174/random-page`
2. **Expected:**
   - 404 page displays
   - "Page Not Found" message
   - Links to Home and Login

### Test Scenario 8: Responsiveness

Test on different screen sizes:

#### Mobile (375px):
1. Open DevTools: `F12`
2. Toggle device toolbar: `Ctrl+Shift+M`
3. Select iPhone SE (375x667)
4. Navigate through all pages
5. **Expected:**
   - Forms are full width
   - Buttons are easily clickable
   - Text is readable
   - No horizontal scroll

#### Tablet (768px):
1. Select iPad (768x1024)
2. Navigate through all pages
3. **Expected:**
   - Layout adapts nicely
   - Max-width container works well

#### Desktop (1920px):
1. Test on full screen
2. **Expected:**
   - Content centered
   - Max-width container (768px) works

## 🚀 Building for Production

### 1. Build the Project
```bash
npm run build
```

**Expected output:**
```
✓ built in 2.34s

dist/
├── index.html
├── assets/
│   ├── index-XXXXX.css
│   └── index-XXXXX.js
└── ...
```

### 2. Test Production Build
```bash
npm run preview
```

Then open `http://localhost:4173` to test

### 3. Deploy to Firebase Hosting

#### Setup Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

#### During init, answer:
- What do you want to use as your public directory? → `dist`
- Configure as single-page app? → `Yes` (important for routing!)

#### Deploy:
```bash
npm run build
firebase deploy
```

**Expected:** Deployed URL provided in console

### 4. Configure Redirects (Important!)

In `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "redirects": [],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

This ensures all routes redirect to `index.html` for client-side routing!

## 📊 Performance Testing

### 1. Lighthouse Audit
1. Open DevTools: `F12`
2. Go to Lighthouse tab
3. Run Audit (Desktop)
4. **Target scores:**
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+

### 2. Network Testing
1. Open DevTools: `F12`
2. Go to Network tab
3. Go through auth flow
4. **Expected:**
   - Main bundle < 200KB
   - Firebase bundle < 100KB
   - Network requests are reasonable

### 3. Memory Usage
1. DevTools → Memory tab
2. Take heap snapshot
3. Go through app
4. Take another snapshot
5. Compare sizes
6. **Expected:** No major memory leaks

## 🔍 Security Testing

### 1. Firebase Rules
Check your Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

### 2. CORS Testing
Test API calls (if using):
```javascript
// Should work from your domain
fetch('https://your-api.com/data')
```

### 3. XSS Protection
Test with suspicious input:
1. Go to `/signup`
2. Enter: `<script>alert('xss')</script>`
3. **Expected:**
   - No alert appears
   - Input sanitized by React

### 4. CSRF Protection
- Uses Firebase auth tokens (built-in)
- No additional CSRF needed for frontend

## 🐛 Debugging Tips

### Check Browser Console
```javascript
// View current user
firebase.auth().currentUser

// Clear auth state
firebase.auth().signOut()

// Check error messages
console.error(error)
```

### Check Network Tab
1. Open DevTools Network tab
2. Look for failed requests
3. Check Firebase API responses
4. Verify auth headers

### Check Application Tab
1. Open DevTools Application
2. Check localStorage (Firebase session)
3. Check Cookies (Firebase tokens)
4. Check IndexedDB (Firebase data)

## ✅ Pre-Launch Checklist

- [ ] All pages render without errors
- [ ] All auth flows work
- [ ] Email verification works
- [ ] Password reset works
- [ ] Protected routes work
- [ ] Error messages display
- [ ] Responsive on mobile/tablet
- [ ] No console errors
- [ ] Firebase rules configured
- [ ] Email templates customized
- [ ] Environment variables set
- [ ] Production build succeeds
- [ ] Production build loads correctly
- [ ] All features work on production
- [ ] No sensitive data in code
- [ ] Lighthouse scores acceptable
- [ ] HTTPS enabled
- [ ] Domain/DNS configured

## 🎯 Common Issues & Solutions

### Issue: "Auth/unknown-error"
**Solution:** 
- Clear cache
- Verify Firebase config
- Check network connection

### Issue: "Email already in use"
**Solution:**
- Use different email
- Delete user from Firebase Console if testing

### Issue: "Email not sending"
**Solution:**
- Check Firebase email templates
- Wait 5-10 minutes (can be delayed)
- Verify email in spam folder
- Check Firebase project domain allowlist

### Issue: "Reset link not working"
**Solution:**
- Use correct code in URL
- Check link expiration (usually 1 hour)
- Request new reset email

### Issue: "Profile image not loading"
**Solution:**
- Verify URL is accessible
- Check CORS settings
- Use HTTPS URLs

## 📞 Support Resources

- **Firebase Console:** https://console.firebase.google.com/
- **Firebase Documentation:** https://firebase.google.com/docs
- **React Documentation:** https://react.dev/
- **React Router:** https://reactrouter.com/
- **TailwindCSS:** https://tailwindcss.com/

---

**Testing Status:** Ready for full testing and deployment! 🚀
