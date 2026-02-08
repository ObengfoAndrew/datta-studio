# ⚡ Quick Start: Launch in 24 Hours

## 🔴 **CRITICAL - Do These First (2-3 hours)**

### 1. Security Rules Fix (15 minutes)
```bash
# Edit firestore.rules - Remove demo-user access
# Change line 17 from:
function canAccess(userId) {
  return isOwner(userId) || userId == 'demo-user';
}
# To:
function canAccess(userId) {
  return isOwner(userId);
}

# Deploy rules
firebase deploy --only firestore:rules
```

### 2. Environment Variables Setup (30 minutes)

**Create `.env.production.local`:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

**Update `src/lib/firebase.ts`:**
```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "datta-dattawallet.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "datta-dattawallet",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "datta-dattawallet.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "116130275498",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:116130275498:web:333096f0b508bdc2b170d3"
};
```

### 3. OAuth Production URLs (20 minutes)

**GitHub OAuth App:**
1. Go to: https://github.com/settings/developers
2. Edit your OAuth App
3. Add production callback URL:
   ```
   https://your-domain.vercel.app/api/auth/github/callback
   ```
4. Save changes

**Google OAuth (if using):**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Add authorized redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/google/callback
   ```

### 4. Firebase Authorized Domains (10 minutes)
1. Go to: Firebase Console → Authentication → Settings
2. Add authorized domains:
   - `your-domain.vercel.app`
   - `*.vercel.app` (for preview deployments)

### 5. Test Production Build (30 minutes)
```bash
# Test build locally
npm run build
npm run start

# Test on localhost:3000
# Verify all features work
```

---

## 🟡 **IMPORTANT - Do Before Launch (4-6 hours)**

### 6. Error Monitoring (30 minutes)
**Option A: Sentry (Recommended)**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Option B: LogRocket or similar**

### 7. Analytics Setup (30 minutes)
**Google Analytics:**
1. Create GA4 property
2. Add to `src/app/layout.tsx`:
```typescript
import Script from 'next/script'

// In your layout component
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

### 8. Legal Pages (2-3 hours)
- [ ] Create Privacy Policy (use template or lawyer)
- [ ] Create Terms of Service
- [ ] Add links in footer
- [ ] Review with legal counsel (if possible)

### 9. Basic Testing (1-2 hours)
- [ ] Test signup/login
- [ ] Test GitHub connection
- [ ] Test dataset upload
- [ ] Test on mobile device
- [ ] Test in different browsers

---

## 🟢 **NICE TO HAVE - Can Do After Launch**

- User onboarding tutorial
- Advanced analytics
- Marketing materials
- Video tutorials
- Press kit

---

## 🚀 **Launch Day Checklist**

### Morning (Before Launch)
- [ ] Final security review
- [ ] Test production build one more time
- [ ] Check all environment variables are set in Vercel
- [ ] Verify OAuth redirects work
- [ ] Test on mobile device

### Launch
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Test live site
- [ ] Announce launch

### After Launch (First Hour)
- [ ] Monitor error rates
- [ ] Watch for user signups
- [ ] Check Firebase usage
- [ ] Respond to any issues immediately

---

## 📞 **Emergency Contacts**

- **Vercel Status:** https://www.vercel-status.com
- **Firebase Status:** https://status.firebase.google.com
- **GitHub Status:** https://www.githubstatus.com

---

## ✅ **Minimum Viable Launch Checklist**

If you need to launch FAST, do at minimum:

1. ✅ Remove demo-user from Firestore rules
2. ✅ Set up environment variables
3. ✅ Configure OAuth production URLs
4. ✅ Test production build
5. ✅ Deploy to Vercel
6. ✅ Test live site
7. ✅ Monitor for first hour

**Everything else can be done post-launch!**


