# 🔧 Troubleshooting Guide - AI Code Review Assistant

## ⚠️ Common Issues and Solutions

---

## Issue: "App is not working in my system"

### Solution 1: Clean Start

```powershell
# Step 1: Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Step 2: Clean build
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build

# Step 3: Start fresh
npm run dev
```

### Solution 2: Check Port Availability

```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# If something is using it, either:
# Option A: Kill that process
# Option B: Change port in .env file
```

### Solution 3: Verify Dependencies

```powershell
# Reinstall dependencies
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force
npm install
```

---

## Issue: "Install is not allowed"

This usually means you have restricted permissions or corporate policies.

### Solution 1: Run as Administrator

1. Right-click PowerShell
2. Select "Run as Administrator"
3. Navigate to project folder
4. Try again

### Solution 2: Check Execution Policy

```powershell
# Check current policy
Get-ExecutionPolicy

# If it's Restricted, change it (as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Try running the app again
npm run dev
```

### Solution 3: Use Alternative Method

If you can't install ngrok or other tools:

**Option A: Use the built-in test**
```powershell
# The app works without external tools
# Just test locally with PowerShell
npm run dev

# In another terminal:
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing
```

**Option B: Deploy to a free service**
- Render.com (free tier)
- Railway.app (free tier)
- Fly.io (free tier)
- Heroku (free tier with credit card)

---

## Issue: "Nothing happens after starting"

This is NORMAL! The app is event-driven.

### What's Actually Happening:
```
✅ Server is listening on port 3000
✅ Worker is checking queue every 5 seconds
✅ Waiting for GitHub webhooks
```

### To Verify It's Working:

**Test 1: Health Check**
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing
```
Expected: Status 200, JSON response

**Test 2: Root Endpoint**
```powershell
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
```
Expected: API information

**Test 3: Open in Browser**
```
http://localhost:3000
```
Expected: JSON with API info

---

## Issue: "Can't access from GitHub"

GitHub can't reach `localhost` - you need a public URL.

### Solutions (in order of ease):

**1. Use a Free Cloud Service (Easiest)**
Deploy to:
- **Render.com**: Free, no credit card needed
- **Railway.app**: Free tier available
- **Fly.io**: Free tier available

**2. Use Your Own Server**
If you have a VPS or cloud server:
- Deploy there
- Use the public IP/domain
- Configure firewall to allow port 3000

**3. Skip Webhook Testing**
Test locally without GitHub:
- Use the manual webhook test in `WEBHOOK_TESTING_GUIDE.md`
- Simulate webhook payloads
- See the processing in logs

---

## Issue: "Port 3000 already in use"

### Solution:
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or kill all node processes
Get-Process node | Stop-Process -Force

# Start app
npm run dev
```

---

## Issue: "GitHub Token Invalid"

### Solution:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Required scopes:
   - `repo` (all)
   - `write:discussion`
4. Copy token
5. Update `.env` file:
   ```
   GITHUB_TOKEN=your_new_token_here
   ```
6. Restart app

---

## Issue: "Webhook signature verification failed"

### Solution:
1. Check your `.env` file:
   ```
   GITHUB_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
   ```
2. In GitHub webhook settings, use the EXACT same secret
3. Make sure there are no extra spaces or quotes

---

## Issue: "No comments appearing on PR"

### Checklist:
- [ ] Is app running? (`http://localhost:3000/health`)
- [ ] Is webhook configured in GitHub?
- [ ] Is webhook URL correct and accessible?
- [ ] Did you create/update a PR?
- [ ] Check GitHub webhook deliveries (Settings → Webhooks → Recent Deliveries)
- [ ] Check app logs for errors
- [ ] Is the PR in draft mode? (Draft PRs are skipped)

---

## Issue: "Dependencies won't install"

### Solution 1: Clear npm cache
```powershell
npm cache clean --force
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force
npm install
```

### Solution 2: Use different registry
```powershell
npm config set registry https://registry.npmjs.org/
npm install
```

### Solution 3: Install with legacy peer deps
```powershell
npm install --legacy-peer-deps
```

---

## Issue: "TypeScript compilation errors"

### Solution:
```powershell
# Clean and rebuild
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build

# If still errors, check TypeScript version
npm list typescript

# Should be 5.3.3 or higher
```

---

## Quick Diagnostic Commands

```powershell
# 1. Check if Node.js is installed
node --version
# Expected: v18.0.0 or higher

# 2. Check if npm is installed
npm --version
# Expected: 9.0.0 or higher

# 3. Check if app is running
Get-Process node -ErrorAction SilentlyContinue

# 4. Check port 3000
netstat -ano | findstr :3000

# 5. Test app health
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing

# 6. View app logs
Get-Content logs/app.log -Tail 50

# 7. View error logs
Get-Content logs/error.log -Tail 50
```

---

## Still Not Working?

### Minimal Test Setup

1. **Stop everything:**
```powershell
Get-Process node | Stop-Process -Force
```

2. **Clean start:**
```powershell
npm run build
node dist/index.js
```

3. **Test in browser:**
Open: `http://localhost:3000`

4. **Check logs:**
Look at the console output for errors

---

## Alternative: Use Without Webhook

You can use the app without GitHub webhooks:

### Manual Analysis Mode

1. **Start the app:**
```powershell
npm run dev
```

2. **Use the analyzers directly:**
Create a test script `test-analysis.js`:
```javascript
const { SecurityAnalyzer } = require('./dist/analyzers/security-analyzer');
const { QualityAnalyzer } = require('./dist/analyzers/quality-analyzer');

const code = `
const password = "hardcoded123";
function unsafeQuery(userId) {
  return "SELECT * FROM users WHERE id = " + userId;
}
`;

const securityAnalyzer = new SecurityAnalyzer();
securityAnalyzer.analyze(code, 'test.js').then(result => {
  console.log('Security findings:', result);
});
```

3. **Run it:**
```powershell
node test-analysis.js
```

---

## System Requirements

### Minimum:
- Windows 10/11
- Node.js 18.0.0+
- npm 9.0.0+
- 2GB RAM
- Internet connection

### Recommended:
- Windows 11
- Node.js 20.0.0+
- npm 10.0.0+
- 4GB RAM
- Fast internet connection

---

## Getting Help

### Check Logs:
```powershell
# Application logs
Get-Content logs/app.log -Tail 100

# Error logs
Get-Content logs/error.log -Tail 100
```

### Enable Debug Logging:
In `.env`:
```
LOG_LEVEL=debug
```

Restart app and check logs again.

---

## Contact & Support

If you're still having issues:

1. **Check the logs** in `logs/` folder
2. **Review error messages** carefully
3. **Try the minimal test setup** above
4. **Check GitHub Issues** for similar problems
5. **Create a new issue** with:
   - Error messages
   - Log files
   - Steps to reproduce
   - System information

---

**Made with ❤️ by Bob**

**Remember**: The app IS working if you see "AI Code Review Assistant started" in the logs!