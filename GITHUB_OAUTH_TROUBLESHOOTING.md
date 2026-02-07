# GitHub OAuth Troubleshooting Guide

## Complete Reference for Fixing GitHub Sign-In Issues

This guide covers all common GitHub OAuth errors and how to fix them.

---

## 🔥 Most Common Errors & Fixes

### 1. `redirect_uri_mismatch` ⚠️ (Most Common)
**What it means**: The callback URL doesn't match between your code and GitHub App settings

**Fix**:
1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click on your "Datta Studio" app
3. Check "Authorization callback URL"
4. Update it to match your current URL:
   - **Local**: `http://localhost:3000/api/auth/github/callback`
   - **Vercel**: `https://your-app.vercel.app/api/auth/github/callback`
5. Click "Update application"
6. Reload your page

**Pro tip**: Even a trailing slash will cause this error!

### 2. `access_denied`
**What it means**: User clicked "Cancel" instead of "Authorize"

**Fix**: 
- The user needs to click "Continue with GitHub" again
- This time, click the green "Authorize" button
- Do NOT click "Cancel"

### 3. `invalid_scope`
**What it means**: The permissions requested are invalid

**Fix**:
1. Delete the GitHub OAuth app (in [settings](https://github.com/settings/developers))
2. Create a new one
3. When creating, just approve the default scopes
4. Update `.env.local` with new credentials
5. Restart dev server: `npm run dev`

### 4. `invalid_client_id`
**What it means**: Client ID is missing, empty, or incorrect

**Fix**:
1. Check `.env.local` for `GITHUB_CLIENT_ID`
2. If empty, copy the Client ID from [GitHub OAuth Apps](https://github.com/settings/developers)
3. Make sure it's not wrapped in quotes
4. Restart dev server: `npm run dev`

### 5. `Popup blocked`
**What it means**: Browser prevented the sign-in popup from opening

**Fix**:
- **Chrome**: Settings > Privacy and security > Site settings > Pop-ups and redirects > Allow for this site
- **Firefox**: Click the popup blocker icon > Disable for this site
- **Safari**: Preferences > Security > Block pop-up windows (uncheck)
- **Edge**: Settings > Privacy > Pop-ups (Allow)

---

## 🔧 Full Setup Checklist

### Create GitHub OAuth App
- [ ] Go to https://github.com/settings/developers
- [ ] Click "New OAuth App"
- [ ] Fill in:
  - **Application name**: Datta Studio
  - **Homepage URL**: http://localhost:3000 (for local) or https://your-domain.com (for production)
  - **Authorization callback URL**: http://localhost:3000/api/auth/github/callback
- [ ] Click "Register application"
- [ ] Copy Client ID and Client Secret

### Configure Environment Variables
- [ ] Add to `.env.local`:
  ```
  GITHUB_CLIENT_ID=your_client_id
  GITHUB_CLIENT_SECRET=your_client_secret
  NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
  ```
- [ ] Check for typos (common: extra spaces, missing equals)
- [ ] Do not use quotes around values

### Start Application
- [ ] Stop dev server if running: Ctrl+C
- [ ] Start new dev server: `npm run dev`
- [ ] Open browser to http://localhost:3000
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Try "Continue with GitHub"

### Verify Success
- [ ] You're redirected to GitHub.com
- [ ] You see "Authorize Datta Studio" button
- [ ] After clicking Authorize, you're logged in
- [ ] Your profile appears in the dashboard

---

## 🐛 Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools: **F12**
2. Go to **Console** tab
3. Look for error messages with `github-auth`
4. Take a screenshot of any errors

### Step 2: Check Dev Server Logs
In your terminal running `npm run dev`, look for:
```
🔐 GitHub sign-in initiated via custom OAuth flow...
GitHub OAuth Token Exchange START
Response status: ...
```

If you see errors here, note them down.

### Step 3: Verify GitHub App Settings
1. Go to https://github.com/settings/developers
2. Click on your app
3. Check these match your `.env.local`:
   - **Client ID** → `GITHUB_CLIENT_ID`
   - **Client Secret** → `GITHUB_CLIENT_SECRET`
4. Check Authorization callback URL is exact match to your app URL

### Step 4: Test Network
- Can you visit github.com manually? (Network works)
- Is GitHub down? Check https://www.githubstatus.com
- Disable VPN if using one

### Step 5: Clear Everything
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Delete next build cache
rm -rf .next

# Restart dev server
npm run dev
```

---

## 🌍 Deployment Configuration

### For Vercel / Netlify / Production

**Step 1: Update GitHub OAuth App**
1. Go to [GitHub OAuth Apps](https://github.com/settings/developers)
2. Click your app
3. Add another "Authorization callback URL":
   - `https://your-app.vercel.app/api/auth/github/callback`
   - `https://your-app.netlify.app/api/auth/github/callback`
4. Save

**Step 2: Update Environment Variables in Hosting**

For **Vercel**:
1. Go to Vercel Project Settings
2. Go to Environment Variables
3. Add:
   - `GITHUB_CLIENT_ID` = your_client_id
   - `GITHUB_CLIENT_SECRET` = your_client_secret
   - `NEXT_PUBLIC_GITHUB_CLIENT_ID` = your_client_id
4. Deploy

For **Netlify**:
1. Go to Site settings > Build & deploy > Environment
2. Add same variables
3. Deploy

**Step 3: Test Production**
1. Go to your production URL
2. Try "Continue with GitHub"
3. Verify it works

---

## 📊 Callback URL Examples

### By Environment

| Environment | Callback URL |
|-------------|--------------|
| localhost:3000 | `http://localhost:3000/api/auth/github/callback` |
| localhost:4000 | `http://localhost:4000/api/auth/github/callback` |
| Vercel | `https://your-project.vercel.app/api/auth/github/callback` |
| Netlify | `https://your-site.netlify.app/api/auth/github/callback` |
| Custom domain | `https://your-domain.com/api/auth/github/callback` |
| Custom domain + subdomain | `https://app.your-domain.com/api/auth/github/callback` |

**❌ Common Mistakes**:
- Using `https://` for localhost (should be `http://`)
- Including a trailing slash: `...callback/`
- Including port number in production: `...com:3000/...`
- Using `www.` vs non-www inconsistently

---

## 💻 OAuth Flow Diagram

```
1. User clicks "Continue with GitHub"
   ↓
2. Browser opens: github.com/login/oauth/authorize?client_id=...&redirect_uri=...
   ↓
3. User logs in (if needed) and sees "Authorize Datta Studio"
   ↓
4. User clicks "Authorize"
   ↓
5. GitHub redirects to: /api/auth/github/callback?code=...
   ↓
6. Server exchanges code for access_token (using CLIENT_SECRET)
   ↓
7. Server fetches user data from GitHub API
   ↓
8. Server returns user data to popup window via postMessage
   ↓
9. Frontend receives message and creates user session
   ↓
10. User logged in ✅
```

---

## 🆘 Still Having Issues?

### Try This Order:

1. ✅ Verify GitHub OAuth App exists at https://github.com/settings/developers
2. ✅ Check Client ID is in `.env.local`
3. ✅ Check Client Secret is in `.env.local`
4. ✅ Verify callback URL in GitHub app matches your current URL
5. ✅ Restart dev server: `npm run dev`
6. ✅ Clear browser cache: Ctrl+Shift+Delete
7. ✅ Try in incognito/private window
8. ✅ Try a different browser
9. ✅ Disable browser extensions that block popups
10. ✅ Check GitHub status: https://www.githubstatus.com

### If Still Stuck:

Open browser console (F12 → Console) and:
1. Look for `github-auth-error` messages
2. Note the exact error code
3. Search this document for that error code
4. Follow the fix steps

---

## 📞 Quick Support Matrix

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | URL mismatch | Update GitHub app callback URL |
| `access_denied` | User cancelled | Click Authorize, not Cancel |
| `invalid_scope` | Bad permissions | Recreate GitHub OAuth app |
| `invalid_client_id` | Missing/wrong ID | Check `.env.local` GITHUB_CLIENT_ID |
| `Popup blocked` | Browser blocking | Allow popups in browser settings |
| `Cannot fetch user` | Network error | Check internet connection |
| `GitHub API 401` | Auth token bad | Verify credentials in `.env.local` |
| `GitHub API 403` | Rate limited | Wait and try again later |
| Auth timeout | Took too long | Try again within 5 minutes |
| Popup closed | User closed it | Have user keep popup open |

---

## 🎓 Understanding the Error Messages

### From Frontend (User Sees):
- `GitHub OAuth is not properly configured` → Server env vars wrong
- `Popup blocked` → Browser prevented popup
- `Sign-in window was closed` → User/browser closed popup

### From Backend (Console Logs):
- `GitHub OAuth configuration missing` → Missing env vars
- `redirect_uri_mismatch` → Callback URL doesn't match
- `GitHub API Error: 401` → Bad credentials
- `GitHub API Error: 403` → Rate limited

### From GitHub (OAuth):
- `access_denied` → User clicked Cancel
- `invalid_scope` → Bad permissions
- `invalid_client_id` → Client ID invalid

---

## 💡 Pro Tips

1. **Always restart dev server** after updating `.env.local`
2. **Callback URL must match exactly** (including protocol, domain, path, port)
3. **Client Secret is sensitive** - never commit to git or share
4. **Test locally first** before deploying
5. **Use different OAuth apps** for local/production if possible
6. **GitHub codes expire quickly** - complete auth within 10 minutes
7. **Check GitHub status** if multiple users report issues

---

This guide covers ~95% of GitHub OAuth issues. If you encounter something not listed here, check the browser console for the specific error code and search this document for matching text.
