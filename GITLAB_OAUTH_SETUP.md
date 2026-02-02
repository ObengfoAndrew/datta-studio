# GitLab OAuth Setup Guide

## Overview

This guide walks you through setting up GitLab OAuth for Datta Studio to enable GitLab as a datasource provider.

## Prerequisites

- GitLab account (gitlab.com or self-hosted instance)
- Admin/developer access to create OAuth applications
- Local development environment with Datta Studio running

---

## Step 1: Create GitLab OAuth Application

### For GitLab.com:

1. **Go to Applications Settings**
   ```
   https://gitlab.com/-/user_settings/applications
   ```

2. **Click "Add new application"**

3. **Fill in the form:**
   - **Name:** `Datta Studio` (or your preferred name)
   - **Redirect URI:** 
     ```
     http://localhost:3000/api/auth/gitlab/callback
     ```
     *(For production: `https://yourdomain.com/api/auth/gitlab/callback`)*
   
   - **Scopes:** Select these checkboxes:
     - ✅ `api` - Access to GitLab API
     - ✅ `read_user` - Read user data
     - ✅ `read_repository` - Access to repositories
   
   - **Expire access tokens:** Optional (recommended: never)

4. **Click "Save application"**

5. **Copy the credentials:**
   - **Application ID** → `GITLAB_CLIENT_ID`
   - **Client Secret** → `GITLAB_CLIENT_SECRET`

### For Self-Hosted GitLab:

1. **Navigate to Admin > Applications:**
   ```
   https://your-gitlab-instance.com/admin/applications
   ```

2. **Follow the same steps 2-5 above**

3. **Update Redirect URI to your domain:**
   ```
   https://yourdomain.com/api/auth/gitlab/callback
   ```

---

## Step 2: Configure Environment Variables

### Edit `.env.local`

Open `datta-dashboard/.env.local` and find the GitLab section:

```env
# GitLab OAuth Configuration
GITLAB_CLIENT_ID=your_application_id_here
GITLAB_CLIENT_SECRET=your_client_secret_here
# For self-hosted only:
# GITLAB_INSTANCE=https://your-gitlab-instance.com
```

**Replace with your actual credentials:**

```env
GITLAB_CLIENT_ID=1234567890abcdef1234567890abcdef
GITLAB_CLIENT_SECRET=9876543210fedcba9876543210fedcba
```

### Optional: Self-Hosted GitLab

If using a self-hosted GitLab instance:

```env
GITLAB_INSTANCE=https://gitlab.your-company.com
```

---

## Step 3: Development Mode (Optional)

For development without actual network calls, enable mock OAuth:

```env
NEXT_PUBLIC_MOCK_OAUTH=true
```

**What it does:**
- Returns mock GitLab user data
- Doesn't require valid credentials
- Useful for UI testing and offline development

**To disable (use real GitLab):**
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

### Test the GitLab OAuth endpoint:

1. **Open your browser:**
   ```
   http://localhost:3000/api/auth/gitlab/start
   ```

2. **Expected behavior:**
   - ✅ Redirects to GitLab login (if not authenticated)
   - ✅ Shows permission approval screen
   - ✅ After approval, redirects back to callback
   - ✅ Shows "GitLab Connection Successful!" with user details

3. **If you see errors:**
   - Check browser console for error messages
   - Check server logs: `npm run dev` output
   - Verify redirect URI matches GitLab app settings

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GITLAB_CLIENT_ID` | ✅ Yes | OAuth application ID from GitLab | `1234567890abcdef1234567890abcdef` |
| `GITLAB_CLIENT_SECRET` | ✅ Yes | OAuth application secret from GitLab | `9876543210fedcba9876543210fedcba` |
| `GITLAB_INSTANCE` | ❌ No | GitLab instance URL (defaults to gitlab.com) | `https://gitlab.company.com` |
| `NEXT_PUBLIC_MOCK_OAUTH` | ❌ No | Enable mock data (dev only) | `true` or `false` |

---

## OAuth Flow Diagram

```
1. User clicks "Connect GitLab"
         ↓
2. Browser → /api/auth/gitlab/start
         ↓
3. Server generates state token & redirects to GitLab
         ↓
4. GitLab shows login & permission screen
         ↓
5. User approves & GitLab redirects to /api/auth/gitlab/callback?code=xxx
         ↓
6. Server exchanges code for access token (using CLIENT_SECRET)
         ↓
7. Server fetches user data from GitLab API
         ↓
8. Server stores connection in Firestore
         ↓
9. Show success page to user
```

---

## Troubleshooting

### ❌ "redirect_uri_mismatch" Error

**Problem:** GitLab app settings don't match redirect URI

**Solution:**
1. Go to GitLab app settings
2. Verify redirect URI is exactly:
   ```
   http://localhost:3000/api/auth/gitlab/callback
   ```
3. Check for trailing slashes, typos, or different ports
4. Save changes and retry

### ❌ "Invalid client credentials" Error

**Problem:** CLIENT_ID or CLIENT_SECRET is wrong

**Solution:**
1. Go back to GitLab OAuth app settings
2. Delete current app and create a new one
3. Copy new credentials carefully (watch for spaces)
4. Update `.env.local` and restart dev server

### ❌ "Cannot reach GitLab instance" Error

**Problem:** Network connectivity or GITLAB_INSTANCE URL wrong

**Solution:**
- For gitlab.com: Remove `GITLAB_INSTANCE` from `.env.local`
- For self-hosted: Verify URL is correct and accessible
- Check network connectivity from your machine
- Enable `NEXT_PUBLIC_MOCK_OAUTH=true` for offline testing

### ❌ Changes not taking effect

**Problem:** Environment variables not loading

**Solution:**
1. Stop dev server: `Ctrl+C`
2. Delete `.next` folder:
   ```bash
   rm -r .next
   ```
3. Restart dev server:
   ```bash
   npm run dev
   ```

---

## Security Best Practices

1. **Never commit secrets to git**
   - `.env.local` is in `.gitignore` ✅

2. **Use strong client secrets**
   - GitLab generates these securely ✅

3. **HTTPS in production**
   - Update redirect URI to `https://yourdomain.com/api/auth/gitlab/callback`
   - Configure SSL certificate

4. **Rotate credentials periodically**
   - Review GitLab app settings monthly
   - Regenerate secret if compromised

5. **Limit OAuth scopes**
   - Only grant: `api`, `read_user`, `read_repository`
   - Don't grant `write` or `admin` scopes

---

## Next Steps

After setup is complete:

1. ✅ Verify OAuth endpoints work
2. ✅ Test user data fetching
3. ✅ Verify Firestore storage
4. ✅ Integrate into UI components
5. ✅ Test with multiple users
6. ✅ Set up production credentials

---

## Additional Resources

- **GitLab OAuth Docs:** https://docs.gitlab.com/ee/integration/oauth_provider.html
- **GitLab API Docs:** https://docs.gitlab.com/ee/api/
- **Datta Studio Code:** `/src/app/api/auth/gitlab/`

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review the troubleshooting section above
3. Check `.env.local` for missing/incorrect variables
4. Verify Firestore rules allow writes
