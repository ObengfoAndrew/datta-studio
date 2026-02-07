# GitHub OAuth Setup - Quick Fix

## 🚀 Fastest Way to Fix GitHub Sign-In Errors

### The Problem
You're seeing: **"GitHub OAuth is not properly configured"** or **"redirect_uri_mismatch"**

### The Solution (4 Steps, 3 minutes)

#### Step 1: Create GitHub OAuth App
Go to: https://github.com/settings/developers

1. Click **New OAuth App**
2. Fill in:
   - Name: `Datta Studio`
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
3. Click **Register application**

#### Step 2: Copy Credentials
1. Copy the **Client ID**
2. Click **Generate a new client secret**
3. Copy the **Client Secret**

#### Step 3: Update .env.local
Add to `.env.local`:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

#### Step 4: Restart Dev Server
```bash
npm run dev
```

---

## 🔧 Callback URL Reference

### Local Development
```
http://localhost:3000/api/auth/github/callback
```

### Production (Vercel)
```
https://your-project.vercel.app/api/auth/github/callback
```

**IMPORTANT**: This must match **exactly** in GitHub App settings, or you'll get `redirect_uri_mismatch` error.

---

## 📋 Debugging Checklist

- [ ] GitHub App exists at https://github.com/settings/developers
- [ ] Client ID is in `.env.local` as `GITHUB_CLIENT_ID`
- [ ] Client Secret is in `.env.local` as `GITHUB_CLIENT_SECRET`
- [ ] Callback URL matches: `http://localhost:3000/api/auth/github/callback`
- [ ] Dev server restarted after updating `.env.local`
- [ ] Browser cache cleared (Ctrl+Shift+Delete)

---

## 🐛 Common Error Messages

| Message | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Fix callback URL in GitHub App settings |
| `Invalid Client ID` | Check GITHUB_CLIENT_ID in .env.local |
| `access_denied` | User cancelled - try again and click Authorize |
| `Popup blocked` | Allow popups in browser settings |
| `Cannot fetch GitHub repos` | GitHub API rate limited - try again later |

---

## 📞 Getting Help

1. **Open browser console** (F12 → Console)
2. **Look for error messages** with `github-auth`
3. **Check GitHub App settings** at https://github.com/settings/developers
4. **Verify callback URL** matches exactly

---

## ✨ That's It!

Most GitHub OAuth errors are fixed by:
1. Creating a GitHub OAuth App
2. Copying Client ID and Secret to `.env.local`
3. Setting the correct callback URL
4. Restarting the dev server

The callback URL must match **exactly** - even a trailing slash difference will cause `redirect_uri_mismatch`.
