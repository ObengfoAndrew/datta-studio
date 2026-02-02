# Deployment Guide - Datta Studio

## ✅ Step 1: Code is Ready
- ✅ Git initialized
- ✅ All files committed
- ✅ .gitignore configured (excludes node_modules, .env files, etc.)

## 📦 Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `datta-studio` (or your preferred name)
3. Description: "The YouTube of AI training data - collect, manage and monetize the data that powers tomorrow's intelligence"
4. Choose: **Private** (recommended) or **Public**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

## 🚀 Step 3: Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
cd "C:\Users\ADMIN\Desktop\Datta Studio\datta-dashboard"
git remote add origin https://github.com/YOUR_USERNAME/datta-studio.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username and `datta-studio` with your repo name.

## 🌐 Step 4: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your `datta-studio` repository
5. Vercel will auto-detect Next.js settings
6. **Environment Variables** (if needed later):
   - You can add Firebase env vars here, but since we're using hardcoded values, it's optional
7. Click **"Deploy"**

## ✅ What's Included in the Repository

- ✅ All source code
- ✅ Firebase configuration (with hardcoded values - safe to commit)
- ✅ Firestore rules
- ✅ Package.json with all dependencies
- ✅ Next.js configuration

## 🔒 What's NOT Included (Protected by .gitignore)

- ❌ node_modules (will be installed on Vercel)
- ❌ .env files (if you add them later)
- ❌ .next build folder
- ❌ Any sensitive credentials

## 🎯 After Deployment

1. Your app will be live at: `https://your-project.vercel.app`
2. Update Firebase Console → Authentication → Authorized domains:
   - Add: `your-project.vercel.app`
   - Add: `*.vercel.app` (for preview deployments)
3. Test the live deployment
4. Share with your 120 beta users!

## 📝 Notes

- The Firebase config uses hardcoded values, so no env vars needed for now
- All code is production-ready
- Vercel will automatically build and deploy on every push to main branch
















