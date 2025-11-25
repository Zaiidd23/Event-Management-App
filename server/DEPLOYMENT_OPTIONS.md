# Email Server Deployment Options

You don't have to keep a terminal open! Here are several ways to run your email server in the background:

## Option 1: PM2 Process Manager (Recommended for Local Development)

PM2 keeps your server running in the background and automatically restarts it if it crashes.

### Installation
```bash
npm install -g pm2
```

### Usage
```bash
# Start the server in background
npm run pm2:start

# View logs
npm run pm2:logs

# Stop the server
npm run pm2:stop

# Restart the server
npm run pm2:restart

# Delete from PM2 (stops and removes)
npm run pm2:delete

# View all PM2 processes
pm2 list

# Make PM2 start on Windows boot (optional)
pm2 startup
pm2 save
```

**Pros:**
- ✅ Easy to use
- ✅ Auto-restarts on crash
- ✅ View logs easily
- ✅ Works on Windows

**Cons:**
- ❌ Requires PM2 to be installed
- ❌ Server stops if you restart your computer (unless you set up startup)

---

## Option 2: Windows Task Scheduler (Built-in Windows Solution)

Run the server automatically when Windows starts.

### Setup Steps:

1. **Create a batch file** (`server/start-server.bat`):
   ```batch
   @echo off
   cd /d "C:\Users\zaid\Desktop\event-manager\server"
   node index.js
   ```

2. **Open Task Scheduler**:
   - Press `Win + R`, type `taskschd.msc`, press Enter

3. **Create Basic Task**:
   - Click "Create Basic Task"
   - Name: "Event Manager Email Server"
   - Trigger: "When I log on" or "When the computer starts"
   - Action: "Start a program"
   - Program: `node`
   - Arguments: `index.js`
   - Start in: `C:\Users\zaid\Desktop\event-manager\server`

4. **Advanced Settings**:
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges" (if needed)

**Pros:**
- ✅ Built into Windows
- ✅ Starts automatically on boot
- ✅ No additional software needed

**Cons:**
- ❌ More complex setup
- ❌ Harder to view logs
- ❌ Manual restart required if it crashes

---

## Option 3: Cloud Deployment (Best for Production)

Deploy your server to a cloud platform so it runs 24/7 without using your computer.

### Recommended Platforms:

#### **Render.com** (Free tier available)
1. Create account at [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repo
4. Settings:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment Variables: Add `GMAIL_USER` and `GMAIL_APP_PASSWORD`
5. Update your React app's `.env`:
   ```
   REACT_APP_EMAIL_API_URL=https://your-app-name.onrender.com
   ```

#### **Railway.app** (Free tier available)
1. Create account at [railway.app](https://railway.app)
2. Deploy from GitHub
3. Set environment variables
4. Railway provides a URL automatically

#### **Heroku** (Paid, but reliable)
1. Create account at [heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Deploy using Git

**Pros:**
- ✅ Runs 24/7
- ✅ Accessible from anywhere
- ✅ No need to keep your computer on
- ✅ Professional solution

**Cons:**
- ❌ Requires internet connection
- ❌ Free tiers may have limitations
- ❌ Need to update frontend API URL

---

## Option 4: Windows Service (Advanced)

Use `node-windows` to install as a Windows service.

### Installation
```bash
npm install -g node-windows
```

### Create service script (`server/install-service.js`):
```javascript
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Event Manager Email Server',
  description: 'Email server for event manager application',
  script: path.join(__dirname, 'index.js'),
  nodeOptions: []
});

svc.on('install', () => {
  svc.start();
  console.log('Service installed and started!');
});

svc.install();
```

### Usage
```bash
node install-service.js
```

**Pros:**
- ✅ Runs as Windows service
- ✅ Starts automatically on boot
- ✅ Professional solution

**Cons:**
- ❌ More complex setup
- ❌ Requires admin privileges

---

## Option 5: Simple Background Process (Quick & Easy)

Run in background using Windows `start` command:

```bash
# In server directory
start /B node index.js
```

Or create a batch file (`server/start-background.bat`):
```batch
@echo off
cd /d "%~dp0"
start "Email Server" /MIN node index.js
```

**Pros:**
- ✅ Very simple
- ✅ No installation needed

**Cons:**
- ❌ Window still exists (minimized)
- ❌ Stops if you close the window
- ❌ No auto-restart on crash

---

## My Recommendation

**For Development:**
- Use **PM2** (Option 1) - Easy to manage, view logs, and restart

**For Production:**
- Use **Cloud Deployment** (Option 3) - Best for real users, runs 24/7

**For Simple Local Use:**
- Use **Windows Task Scheduler** (Option 2) - Starts automatically when you boot your computer

---

## Quick Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Navigate to server directory
cd server

# Start server in background
npm run pm2:start

# Check if it's running
pm2 list

# View logs
npm run pm2:logs

# That's it! Server runs in background now.
```

The server will keep running even if you close the terminal!

