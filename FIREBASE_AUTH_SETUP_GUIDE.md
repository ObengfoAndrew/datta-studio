# Firebase Authentication Setup Guide

## 🔴 Fixing "Authentication internal error" / "Domain not authorized for OAuth"

This guide helps you resolve Firebase authentication errors when signing in with Google.

---

## ✅ Quick Fix Checklist

### Step 1: Verify Firebase Configuration Variables
Check that your `.env.local` file has all required Firebase variables:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Where to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **⚙️ Project Settings** (bottom left)
4. Go to **"Your apps"** section
5. Find your Web app (looks like `</> Web`)
6. Click it and copy the Firebase config

### Step 2: Add Authorized OAuth Domains (CRITICAL)

This is the most common cause of authentication errors!

1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to **Authentication** > **Settings** tab
3. Look for **"Authorized domains"** section
4. Add these domains:
   - `localhost`
   - `127.0.0.1`
   - Your actual domain (e.g., `datta-studio.vercel.app`, `example.com`)
   - `3000` (if running locally on port 3000)

5. **Important**: After adding domains, wait 5-10 minutes for Firebase to propagate the changes
6. Refresh your browser and clear cache (Ctrl+Shift+Delete)

### Step 3: Enable Google Sign-In Provider

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Ensure **Google** is enabled (toggle should be blue)
3. If not enabled, click **Google** and toggle it on
4. The OAuth consent screen may appear - configure it as needed

---

## 🛠️ Troubleshooting Different Errors

### Error: "auth/internal-error"
**Cause**: Firebase configuration incomplete or OAuth redirect domains not configured

**Solution**:
1. ✅ Complete Step 1 (verify all env vars are set)
2. ✅ Complete Step 2 (add authorized domains)
3. ✅ Reload the page (hard refresh: Ctrl+Shift+R)

### Error: "auth/unauthorized-domain"
**Cause**: Your current domain is not in Firebase's authorized domains list

**Solution**:
1. Note your current domain (shown in browser address bar)
2. Go to Firebase Console > Authentication > Settings
3. Add your domain to "Authorized domains"
4. Wait 5 minutes and reload

### Error: "auth/invalid-api-key"
**Cause**: Firebase API key is missing or invalid

**Solution**:
1. Verify `NEXT_PUBLIC_FIREBASE_API_KEY` is set in `.env.local`
2. Check it matches the key from Firebase Console > Project Settings
3. Restart your dev server: `npm run dev`

### Error: "Popup blocked"
**Cause**: Browser is blocking the sign-in popup

**Solution**:
1. Check browser popup settings
2. Whitelist your domain in popup blocker
3. Try a different browser

---

## 📋 Complete Setup Walkthrough

### For Local Development (localhost)

Your `.env.local` should look like:

```dotenv
# Firebase Configuration (from Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=datta-dattawallet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=datta-dattawallet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=datta-dattawallet.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=116130275498
NEXT_PUBLIC_FIREBASE_APP_ID=1:116130275498:web:333096f0b508bdc2b170d3
```

**Firebase Console Settings:**
- **Authorized domains**: `localhost`, `127.0.0.1`
- **Google Sign-In**: Enabled
- **OAuth Consent**: Configured

### For Production (Deployed)

When deploying to production (Vercel, Netlify, etc.):

1. **Update environment variables** in your hosting provider's settings:
   - Copy all `NEXT_PUBLIC_FIREBASE_*` vars
   - Also copy `FIREBASE_*` vars if using server-side auth

2. **Update Firebase Authorized Domains**:
   - Add your production domain (e.g., `myapp.vercel.app`)
   - Keep `localhost` and `127.0.0.1` for local testing

3. **Test before going live**:
   ```bash
   npm run dev
   # Visit http://localhost:3000
   # Try signing in to verify it works
   ```

---

## 🔍 How to Debug

### Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for Firebase initialization logs
4. If you see errors, they'll help identify the issue

### Enable Debug Logging
Add this to your code to see detailed Firebase logs:

```typescript
import { getAuth, debugErrorMap } from 'firebase/auth';
const auth = getAuth();
```

---

## 📞 Getting Help

If issues persist:

1. **Verify all steps above are complete**
2. **Check Firebase Console for errors**:
   - Go to Firebase Console > Firestore > Data
   - Look for any error messages
3. **Check your `.env.local`**:
   - Ensure no typos in variable names
   - Values should not be in quotes
4. **Clear everything and restart**:
   - Delete `.next` folder: `rm -rf .next`
   - Restart dev server: `npm run dev`
   - Clear browser cache

---

## ✨ Summary

| Error | Fix |
|-------|-----|
| `auth/internal-error` | Add domain to Firebase Authorized Domains |
| `auth/unauthorized-domain` | Add current domain to Firebase Authorized Domains |
| `auth/invalid-api-key` | Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local |
| `auth/popup-blocked` | Allow popups in browser settings |
| No config error but auth fails | Reload page, clear cache |

**Most Common Solution**: Domains take 5-10 minutes to propagate in Firebase. After adding a domain, **wait a few minutes and reload the page**.
