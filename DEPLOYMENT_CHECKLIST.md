# Pre-Deployment Checklist

Use this checklist before deploying your application.

## ✅ Pre-Deployment

### Code Preparation
- [ ] Test the app locally (`npm start`)
- [ ] Build the app successfully (`npm run build`)
- [ ] Test the build locally (`serve -s build`)
- [ ] All features work in production build
- [ ] No console errors

### Environment Variables
- [ ] Backend `.env` file has all required variables:
  - [ ] `GMAIL_USER`
  - [ ] `GMAIL_APP_PASSWORD`
  - [ ] `PORT` (optional, hosting sets this)
- [ ] Frontend environment variables ready:
  - [ ] `REACT_APP_EMAIL_API_URL` (will set after backend deployment)

### Security
- [ ] `.env` files are in `.gitignore` ✅ (already done)
- [ ] No API keys or secrets in code
- [ ] Firebase config is safe to expose (it's public by design)

### Firebase Setup
- [ ] Firebase project is created
- [ ] Firestore database is initialized
- [ ] Authentication is enabled
- [ ] Firestore security rules are configured
- [ ] Ready to add production domain to authorized domains

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend
- [ ] Choose hosting: Render / Railway / Heroku
- [ ] Create account and connect GitHub
- [ ] Create new web service
- [ ] Set root directory: `server`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add environment variables:
  - [ ] `GMAIL_USER`
  - [ ] `GMAIL_APP_PASSWORD`
- [ ] Deploy and wait for success
- [ ] Copy backend URL (e.g., `https://your-app.onrender.com`)

### Step 2: Deploy Frontend
- [ ] Choose hosting: Vercel / Netlify / Firebase Hosting
- [ ] Create account and connect GitHub
- [ ] Import repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `build`
- [ ] Add environment variable:
  - [ ] `REACT_APP_EMAIL_API_URL` = your backend URL from Step 1
- [ ] Deploy and wait for success
- [ ] Copy frontend URL (e.g., `https://your-app.vercel.app`)

### Step 3: Configure Firebase
- [ ] Go to Firebase Console
- [ ] Authentication → Settings → Authorized domains
- [ ] Add your frontend domain (e.g., `your-app.vercel.app`)
- [ ] Verify Firestore rules allow your domain

### Step 4: Test Production
- [ ] Visit your live frontend URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test creating an event
- [ ] Test registering for an event
- [ ] Check email inbox for confirmation email
- [ ] Test all major features

---

## 🔍 Post-Deployment Verification

### Functionality Tests
- [ ] User can register new account
- [ ] User can login
- [ ] User can create events
- [ ] User can view events
- [ ] User can register for events
- [ ] Email notifications are sent
- [ ] User can edit/delete their events
- [ ] Calendar widget works
- [ ] Popular events widget works
- [ ] Search and filters work
- [ ] Dark mode toggle works

### Performance
- [ ] Page loads quickly (< 3 seconds)
- [ ] No console errors
- [ ] Images load properly
- [ ] Firebase queries are fast

### Security
- [ ] Only authenticated users can create events
- [ ] Users can only edit/delete their own events
- [ ] Firestore rules are working
- [ ] No sensitive data exposed in network tab

---

## 📝 Notes

- **Backend URL:** _________________________
- **Frontend URL:** _________________________
- **Firebase Project:** _________________________
- **Deployment Date:** _________________________

---

## 🐛 Common Issues & Solutions

### Issue: Backend returns 503 or times out
**Solution:** Free tier services "sleep" after inactivity. First request may take 30-60 seconds.

### Issue: CORS errors
**Solution:** Update backend CORS to include your frontend domain, or set to allow all origins in production.

### Issue: Environment variables not working
**Solution:** 
- Rebuild frontend after adding environment variables
- Restart backend after adding environment variables
- Check variable names are correct (case-sensitive)

### Issue: Email not sending
**Solution:**
- Verify Gmail app password is correct
- Check backend logs for errors
- Check spam folder
- Ensure Gmail account has 2-step verification enabled

---

## 🎉 Success!

Once all items are checked, your app is live and ready to use!

