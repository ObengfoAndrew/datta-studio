# GitHub OAuth Setup Guide

## 🔴 Fixing "GitHub OAuth is not properly configured" Errors

This guide helps you resolve GitHub OAuth authentication errors when signing in with GitHub.

---

## ✅ Quick Fix Checklist

### Step 1: Create GitHub OAuth App
1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `Datta Studio`
   - **Homepage URL**: `http://localhost:3000` (for local dev)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click **Register application**

### Step 2: Copy Credentials
1. You'll see **Client ID** - copy it
2. Click **Generate a new client secret** - copy the secret (shown only once!)
3. Add to `.env.local`:
```dotenv
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
```

### Step 3: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
# Start a new one
npm run dev
```

### Step 4: Test
1. Go to `http://localhost:3000`
2. Click "Continue with GitHub"
3. Authorize the app
4. You should see your GitHub profile

---

## 🛠️ Troubleshooting Different Errors

### Error: "redirect_uri_mismatch"
**Cause**: The callback URL in GitHub App doesn't match your current domain

**Solution**:
1. Go to [GitHub OAuth Apps](https://github.com/settings/developers)
2. Click on your "Datta Studio" app
3. Check **Authorization callback URL**
4. It should be: `http://localhost:3000/api/auth/github/callback` (for local)
5. Update to match your current URL exactly
6. Save and reload the page

### Error: "access_denied"
**Cause**: User clicked "Cancel" on GitHub authorization screen

**Solution**:
1. The user needs to click "Continue with GitHub" again
2. This time, click **Authorize** instead of Cancel
3. Make sure they have permissions to grant

### Error: "Invalid Client ID"
**Cause**: GITHUB_CLIENT_ID is incorrect or missing

**Solution**:
1. Verify `GITHUB_CLIENT_ID` in `.env.local`
2. Go to [GitHub OAuth Apps](https://github.com/settings/developers) and copy the correct Client ID
3. Restart dev server: `npm run dev`

### Error: "Popup blocked"
**Cause**: Browser is blocking the authentication popup

**Solution**:
1. Check browser popup blocker settings
2. Add your domain to popup whitelist
3. Try a different browser temporarily
4. Check for browser extensions blocking popups

### Error: "Cannot reach GitHub API"
**Cause**: Network issue or GitHub is down

**Solution**:
1. Check internet connection
2. Check [GitHub Status](https://www.githubstatus.com)
3. Try disabling VPN
4. Try a different network/browser

### Error: "Popup was closed unexpectedly"
**Cause**: Browser or extension closed the auth popup

**Solution**:
1. Don't close the auth popup manually
2. Disable browser extensions that might interfere
3. Try in a private/incognito window
4. Try a different browser

---

## 📋 Complete Setup Walkthrough

### For Local Development (localhost)

Your `.env.local` should look like:
```dotenv
# GitHub OAuth (from https://github.com/settings/developers)
GITHUB_CLIENT_ID=Ov23liC3ycgNqKuDMKAQ
GITHUB_CLIENT_SECRET=2a308edbf56bcab542860c64e4f63930c6c4ae23
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liC3ycgNqKuDMKAQ

# Other configs...
```

**GitHub App Settings should have**:
- Client ID: (same as GITHUB_CLIENT_ID)
- Authorization callback URL: `http://localhost:3000/api/auth/github/callback`

### For Production (Deployed to Vercel)

When deploying to production:

1. **Create a new GitHub OAuth App** (or reuse with multiple callback URLs):
   - Go to [GitHub OAuth Apps](https://github.com/settings/developers)
   - Click on your app
   - Add **Authorization callback URL**: `https://your-app.vercel.app/api/auth/github/callback`

2. **Update environment variables** in Vercel:
   - Go to Vercel Project Settings > Environment Variables
   - Add: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXT_PUBLIC_GITHUB_CLIENT_ID`
   - Deploy the changes

3. **Test before going live**:
   ```bash
   npm run build
   npm run start
   # Visit http://localhost:3000
   # Try GitHub sign-in
   ```

---

## 🔍 How to Debug

### Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for GitHub OAuth error messages
4. Messages like `github-auth-error: redirect_uri_mismatch` will tell you exactly what's wrong

### Check Server Logs
In your terminal running `npm run dev`, look for messages like:
- `🔐 GitHub sign-in initiated`
- `✅ GitHub OAuth callback received`
- `❌ GitHub OAuth error`

### Verify GitHub App Configuration
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click on your OAuth App
3. Check:
   - ✅ Client ID matches `GITHUB_CLIENT_ID`
   - ✅ Authorization callback URL is correct
   - ✅ Application is active (not archived)

---

## 📊 GitHub OAuth Flow

```
User clicks "Continue with GitHub"
           ↓
Browser opens popup to GitHub
           ↓
User logs in and authorizes
           ↓
GitHub redirects to: /api/auth/github/callback
           ↓
API exchanges code for access token
           ↓
API fetches user data from GitHub
           ↓
User profile created in database
           ↓
User logged in to Datta Studio ✅
```

---

## ✨ Summary

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Update Authorization callback URL in GitHub App settings |
| `access_denied` | User needs to click Authorize, not Cancel |
| `Invalid Client ID` | Check GITHUB_CLIENT_ID in .env.local |
| `Popup blocked` | Allow popups in browser settings |
| `Cannot reach GitHub API` | Check internet connection and GitHub status |
| Still not working | Clear cache, restart dev server, try incognito window |

**Pro Tip**: After any changes to GitHub App settings or `.env.local`, always restart the dev server with `npm run dev`.
