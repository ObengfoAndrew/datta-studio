# Firebase OAuth Domain Configuration - Quick Fix

## 🚀 Fastest Way to Fix Authentication Errors

### The Problem
You're seeing: **"Authentication internal error"** or **"Domain not authorized for OAuth"**

### The Solution (3 Steps, 2 minutes)

#### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com

#### Step 2: Add Your Domain
1. Click your project
2. Go to **Authentication** → **Settings** (gear icon)
3. Scroll to **Authorized domains**
4. Click **Add domain**
5. Enter these domains:
   - `localhost`
   - `127.0.0.1`
   - Your actual domain (what's in your browser address bar)

#### Step 3: Wait & Reload
1. Wait 5 minutes for Firebase to propagate changes
2. Reload your page: **Ctrl+Shift+R** (hard refresh)
3. Try signing in again

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] Authorized domains include your production domain
- [ ] Google Sign-In is enabled in Authentication > Sign-in method
- [ ] All `NEXT_PUBLIC_FIREBASE_*` variables are in your `.env.local`
- [ ] You can sign in on `localhost:3000`
- [ ] You can sign in after `npm run build` locally

---

## 🔧 Environment Variables to Check

Your `.env.local` must have:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Get these from**: Firebase Console → ⚙️ Project Settings → Your Apps (</> Web)

---

## 🐛 Debugging

**Check the browser console (F12 → Console)**

Look for messages like:
- ✅ "Google sign-in successful" = Working!
- ❌ "auth/internal-error" = See "The Solution" above
- ❌ "auth/unauthorized-domain" = Add domain to Firebase Console

---

## 📞 Still Having Issues?

1. **For localhost**: Add `localhost` AND `127.0.0.1` to authorized domains
2. **For Vercel**: Add `your-project.vercel.app` to authorized domains
3. **Domain not showing up**: Wait 5-10 minutes, it takes time to propagate
4. **Still errors**: Clear browser cache (Ctrl+Shift+Delete) and reload

---

## ✨ That's It!

Most authentication errors are fixed by adding the domain to Firebase's Authorized domains list. The other 90% are fixed by reloading the page after updating Firebase.
