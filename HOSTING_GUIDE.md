# Complete Hosting Guide for Event Manager

This guide will help you deploy your Event Manager application to production. You have three components to host:

1. **React Frontend** - Your main application
2. **Node.js Backend Server** - Email service (in `server/` folder)
3. **Firebase** - Already configured (database & authentication)

---

## 🎯 Quick Overview

**Recommended Setup:**
- **Frontend:** Vercel or Netlify (Free, easy, automatic deployments)
- **Backend:** Render or Railway (Free tier available)
- **Firebase:** Already set up ✅

---

## 📋 Pre-Deployment Checklist

### 1. Build Your React App Locally (Test First)

```bash
# In the project root
npm run build
```

This creates a `build/` folder. Test it locally:
```bash
# Install serve globally (one-time)
npm install -g serve

# Test the build
serve -s build
```

Visit `http://localhost:3000` to make sure everything works.

### 2. Prepare Environment Variables

You'll need to set these in your hosting platforms:

**Frontend (React App):**
- `REACT_APP_EMAIL_API_URL` - Your backend server URL (set after deploying backend)

**Backend Server:**
- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password (16 characters)
- `PORT` - Usually set automatically by hosting platform
- `OPENAI_API_KEY` - (Optional) If you want AI chatbot later

---

## 🚀 Option 1: Vercel (Frontend) + Render (Backend) - RECOMMENDED

### Part A: Deploy Backend to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Service:**
   - **Name:** `event-manager-server` (or any name)
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)

4. **Add Environment Variables:**
   Click "Environment" tab and add:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   PORT=10000
   ```
   (Render sets PORT automatically, but include it just in case)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy your service URL (e.g., `https://event-manager-server.onrender.com`)

### Part B: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure Project:**
   - **Framework Preset:** Create React App
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

4. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   REACT_APP_EMAIL_API_URL=https://your-render-url.onrender.com
   ```
   (Use the URL from Part A)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-app.vercel.app`

### Part C: Update Firebase Settings

1. **Add Authorized Domains**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Authentication → Settings → Authorized domains
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

2. **Update Firestore Rules** (if needed)
   - Go to Firestore Database → Rules
   - Make sure your rules allow access from your domain

---

## 🚀 Option 2: Netlify (Frontend) + Railway (Backend)

### Part A: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service:**
   - Railway auto-detects Node.js
   - Set **Root Directory:** `server`
   - Set **Start Command:** `npm start`

4. **Add Environment Variables:**
   Click "Variables" tab:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

5. **Deploy**
   - Railway auto-deploys
   - Get your URL from the "Settings" → "Domains"

### Part B: Deploy Frontend to Netlify

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Add New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub and select repository

3. **Build Settings:**
   - **Base directory:** (leave empty)
   - **Build command:** `npm run build`
   - **Publish directory:** `build`

4. **Add Environment Variables:**
   Go to Site settings → Environment variables:
   ```
   REACT_APP_EMAIL_API_URL=https://your-railway-url.railway.app
   ```

5. **Deploy**
   - Click "Deploy site"
   - Your app will be at `https://random-name.netlify.app`

---

## 🚀 Option 3: Firebase Hosting (Frontend) + Render (Backend)

### Part A: Deploy Backend (Same as Option 1, Part A)

Follow the Render steps from Option 1.

### Part B: Deploy Frontend to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `build`
   - Single-page app: Yes
   - Overwrite index.html: No

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. **Add Environment Variables**
   Create `build/.env.production` before building:
   ```env
   REACT_APP_EMAIL_API_URL=https://your-render-url.onrender.com
   ```
   Or use Firebase Hosting environment variables in Firebase Console.

Your app will be at `https://your-project-id.web.app`

---

## 🔧 Post-Deployment Steps

### 1. Update Frontend Environment Variable

After deploying backend, update frontend's `REACT_APP_EMAIL_API_URL`:
- **Vercel:** Project Settings → Environment Variables → Edit
- **Netlify:** Site Settings → Environment Variables → Edit
- **Firebase:** Rebuild and redeploy

### 2. Test Everything

1. ✅ User registration/login works
2. ✅ Events can be created
3. ✅ Email notifications are sent (check spam folder)
4. ✅ All features work on production

### 3. Custom Domain (Optional)

**Vercel:**
- Project Settings → Domains → Add domain

**Netlify:**
- Site Settings → Domain Management → Add custom domain

**Firebase:**
- Hosting → Add custom domain

---

## 🐛 Troubleshooting

### Backend Not Responding

1. Check Render/Railway logs for errors
2. Verify environment variables are set correctly
3. Check if the service is "Live" (not sleeping)
4. Free tier services "sleep" after inactivity - first request may be slow

### Frontend Can't Connect to Backend

1. Verify `REACT_APP_EMAIL_API_URL` is correct
2. Check CORS settings in backend (should allow your frontend domain)
3. Rebuild frontend after changing environment variables

### Email Not Sending

1. Verify Gmail app password is correct
2. Check backend logs for email errors
3. Make sure Gmail account has 2-step verification enabled

### Firebase Errors

1. Add your production domain to Firebase authorized domains
2. Check Firestore security rules
3. Verify Firebase config in `src/firebase.js`

---

## 💰 Cost Estimate

**Free Tier (Recommended for Start):**
- Vercel/Netlify: Free (unlimited)
- Render: Free (sleeps after inactivity)
- Railway: $5/month (free trial available)
- Firebase: Free (generous free tier)

**Total: $0-5/month** for small to medium usage

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Railway Documentation](https://docs.railway.app)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

## ✅ Quick Start Checklist

- [ ] Test build locally (`npm run build`)
- [ ] Deploy backend to Render/Railway
- [ ] Copy backend URL
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Add `REACT_APP_EMAIL_API_URL` environment variable
- [ ] Add frontend domain to Firebase authorized domains
- [ ] Test registration, login, and email sending
- [ ] Share your live URL! 🎉

---

**Need Help?** Check the troubleshooting section or review the platform-specific documentation.

