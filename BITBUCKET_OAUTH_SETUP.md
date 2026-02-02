# Bitbucket OAuth Setup Guide

## Overview

This guide walks you through setting up Bitbucket OAuth for Datta Studio to enable Bitbucket as a datasource provider.

## Prerequisites

- Bitbucket account (bitbucket.org)
- Admin access to account settings
- Local development environment with Datta Studio running

---

## Step 1: Create Bitbucket App Password

Bitbucket uses "App Passwords" instead of traditional OAuth apps. Here's how to create one:

### Navigate to App Passwords Settings

1. **Go to:**
   ```
   https://bitbucket.org/account/settings/app-passwords
   ```

2. **Click "Create app password"**

3. **Fill in the form:**
   - **Label:** `Datta Studio` (or your preferred name)
   
   - **Permissions:** Select these:
     - ✅ `Account` > `Read` - Read account info
     - ✅ `Repository` > `Read` - Access repositories
     - ✅ `Repository` > `Admin` - Manage access
   
   - **Redirect URI:** 
     ```
     http://localhost:3000/api/auth/bitbucket/callback
     ```
     *(Replace 3000 with your actual dev port if different)*

4. **Click "Create"**

5. **Copy the credentials:**
   - Your **Bitbucket username** → `BITBUCKET_CLIENT_ID`
   - **Generated password** → `BITBUCKET_CLIENT_SECRET`

---

## Step 2: Configure Environment Variables

### Edit `.env.local`

Open `datta-dashboard/.env.local` and find the Bitbucket section:

```env
# Bitbucket OAuth Configuration
BITBUCKET_CLIENT_ID=your_username_here
BITBUCKET_CLIENT_SECRET=your_generated_password_here
NEXT_PUBLIC_BITBUCKET_CLIENT_ID=your_username_here
```

**Example:**
```env
BITBUCKET_CLIENT_ID=john.doe
BITBUCKET_CLIENT_SECRET=aBcDeFgHiJkLmNoPqRsT
NEXT_PUBLIC_BITBUCKET_CLIENT_ID=john.doe
```

### Optional: Override Redirect URI

If your dev server runs on a different port (e.g., 3003):

```env
BITBUCKET_REDIRECT_URI=http://localhost:3003/api/auth/bitbucket/callback
```

---

## Step 3: Development Mode (Optional)

For development without actual network calls, enable mock OAuth:

```env
NEXT_PUBLIC_MOCK_OAUTH=true
```

To use real Bitbucket:
```env
NEXT_PUBLIC_MOCK_OAUTH=false
```

---

## Step 4: Test the OAuth Flow

### Start the development server:

```bash
cd datta-dashboard
npm run dev
```

### Test the Bitbucket OAuth endpoint:

1. **Open your browser:**
   ```
   http://localhost:3000/api/auth/bitbucket/start
   ```

2. **Expected behavior:**
   - ✅ Redirects to Bitbucket login (if not authenticated)
   - ✅ Shows permission approval screen
   - ✅ After approval, redirects back to callback
   - ✅ Shows "Bitbucket Connection Successful!" with user details

3. **If you see errors:**
   - Check browser console for error messages
   - Check server logs: `npm run dev` output
   - Verify app password and redirect URI are correct

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BITBUCKET_CLIENT_ID` | ✅ Yes | Your Bitbucket username | `john.doe` |
| `BITBUCKET_CLIENT_SECRET` | ✅ Yes | Generated app password from Bitbucket | `aBcDeFgHiJkLmNoPqRsT` |
| `NEXT_PUBLIC_BITBUCKET_CLIENT_ID` | ✅ Yes | Public version (same as username) | `john.doe` |
| `BITBUCKET_REDIRECT_URI` | ❌ No | Override redirect URI (different port) | `http://localhost:3003/api/auth/bitbucket/callback` |

---

## OAuth Flow Diagram

```
1. User clicks "Connect Bitbucket"
         ↓
2. Browser → /api/auth/bitbucket/start
         ↓
3. Server redirects to Bitbucket authorization
         ↓
4. Bitbucket shows login & permission screen
         ↓
5. User approves & Bitbucket redirects to /api/auth/bitbucket/callback?code=xxx
         ↓
6. Server exchanges code for access token (using credentials)
         ↓
7. Server fetches user data from Bitbucket API
         ↓
8. Server stores connection in browser storage
         ↓
9. Show success page to user
```

---

## Troubleshooting

### ❌ "redirect_uri_mismatch" Error

**Problem:** Bitbucket app settings don't match redirect URI

**Solution:**
1. Go to: https://bitbucket.org/account/settings/app-passwords
2. Update the redirect URI to exactly match:
   ```
   http://localhost:3000/api/auth/bitbucket/callback
   ```
3. Check for typos and NO trailing slash
4. Retry the OAuth flow

### ❌ "Invalid credentials" Error

**Problem:** App password is wrong or expired

**Solution:**
1. Delete the old app password
2. Create a new one at: https://bitbucket.org/account/settings/app-passwords
3. Copy new credentials carefully
4. Update `.env.local` and restart dev server

### ❌ "Cannot reach bitbucket.org" Error

**Problem:** Network connectivity issue

**Solution:**
- Check internet connection
- Verify bitbucket.org is accessible
- Enable `NEXT_PUBLIC_MOCK_OAUTH=true` for offline testing
- Check firewall/proxy settings

### ❌ Changes not taking effect

**Problem:** Environment variables not reloading

**Solution:**
1. Stop dev server: `Ctrl+C`
2. Delete cache:
   ```bash
   rm -r .next
   ```
3. Restart:
   ```bash
   npm run dev
   ```

---

## Security Best Practices

1. **Never commit secrets to git**
   - `.env.local` is in `.gitignore` ✅

2. **App passwords are sensitive**
   - Treat like passwords (don't share)
   - Rotate periodically

3. **Use HTTPS in production**
   - Update redirect URI to: `https://yourdomain.com/api/auth/bitbucket/callback`
   - Configure SSL certificate

4. **Limit app password scope**
   - Only grant necessary permissions
   - Review permissions monthly

5. **Rotate credentials regularly**
   - Delete old app passwords
   - Create new ones every 90 days

---

## Next Steps

After setup is complete:

1. ✅ Verify OAuth endpoints work
2. ✅ Test user data fetching
3. ✅ Verify browser storage
4. ✅ Integrate into UI components
5. ✅ Test with multiple accounts
6. ✅ Set up production credentials

---

## Additional Resources

- **Bitbucket API Docs:** https://developer.atlassian.com/cloud/bitbucket/rest/intro/
- **App Passwords Settings:** https://bitbucket.org/account/settings/app-passwords
- **Datta Studio Code:** `/src/app/api/auth/bitbucket/`

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review the troubleshooting section above
3. Verify credentials are correct in `.env.local`
4. Test with mock OAuth enabled first
