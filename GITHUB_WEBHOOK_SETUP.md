# 🔗 GitHub Webhook Setup - Quick Guide

## ⚠️ Important: Localhost Won't Work!

**GitHub cannot reach `http://localhost:3000`** because:
- GitHub servers are on the internet
- Your localhost is on your private network
- They can't communicate directly

---

## ✅ Solution: Use ngrok (Free & Easy)

### Step 1: Download ngrok

1. Go to: https://ngrok.com/download
2. Download Windows version
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)
4. No installation needed!

### Step 2: Start Your App

```powershell
# In your project folder
npm run dev
```

Wait for: `AI Code Review Assistant started {"port":"3000"}`

### Step 3: Start ngrok (New Terminal)

```powershell
# Navigate to where you extracted ngrok.exe
cd C:\ngrok

# Start tunnel
.\ngrok.exe http 3000
```

You'll see:
```
ngrok

Session Status                online
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL**: `https://abc123.ngrok-free.app`

### Step 4: Configure GitHub Webhook

Now fill in the GitHub form:

**Payload URL**: `https://abc123.ngrok-free.app/webhook`  
(Replace with YOUR ngrok URL + `/webhook`)

**Content type**: `application/json` ✅

**Secret**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`  
(From your `.env` file - `GITHUB_WEBHOOK_SECRET`)

**SSL verification**: ✅ Enable SSL verification

**Which events**:
- Select "Let me select individual events"
- ✅ Check **"Pull requests"**
- ❌ Uncheck everything else

**Active**: ✅ Checked

Click **"Add webhook"**

---

## 🧪 Test It!

### Step 1: Create Test File

In your repository, create a new branch:
```bash
git checkout -b test-ai-review
```

Create a file with intentional issues:
```bash
echo "const password = 'hardcoded123';
function unsafeQuery(userId) {
  return 'SELECT * FROM users WHERE id = ' + userId;
}" > test-security.js

git add test-security.js
git commit -m "Test: Security issues"
git push origin test-ai-review
```

### Step 2: Create Pull Request

1. Go to your GitHub repository
2. Click "Compare & pull request"
3. Create the PR

### Step 3: Watch the Magic! 🎉

**In your app terminal**, you'll see:
```
[info]: Received webhook event
[info]: Processing pull request event
[info]: Analysis job queued
[info]: Starting job processing
[info]: Analyzing files
[info]: Posted summary comment to PR
```

**In ngrok terminal**, you'll see:
```
POST /webhook              200 OK
```

**On GitHub PR**, you'll see:
- Summary comment with analysis results
- Review comments on problematic lines

---

## 🔍 Troubleshooting

### Issue: "Webhook delivery failed"

**Check:**
1. Is your app running? (`npm run dev`)
2. Is ngrok running? (Check the terminal)
3. Did you use the correct ngrok URL?
4. Did you add `/webhook` to the end?

### Issue: "Invalid signature"

**Fix:**
1. Check your `.env` file: `GITHUB_WEBHOOK_SECRET`
2. Use the EXACT same value in GitHub webhook secret
3. No extra spaces or quotes

### Issue: ngrok URL changed

**This happens when you restart ngrok (free version)**

**Fix:**
1. Get new ngrok URL from terminal
2. Update GitHub webhook URL
3. Settings → Webhooks → Edit → Update Payload URL

---

## 📊 Verify Webhook is Working

### In GitHub:
1. Go to: Settings → Webhooks
2. Click on your webhook
3. Scroll to "Recent Deliveries"
4. You should see deliveries with ✅ green checkmarks

### In ngrok Dashboard:
1. Open: http://127.0.0.1:4040
2. See all requests in real-time
3. Inspect request/response details

---

## 🎯 Alternative: Free Cloud Deployment

If you don't want to use ngrok, deploy to a free service:

### Option 1: Render.com (Recommended)
1. Go to https://render.com
2. Sign up (free)
3. New → Web Service
4. Connect your GitHub repo
5. Build Command: `npm install && npm run build`
6. Start Command: `npm start`
7. Deploy!
8. Use the Render URL in webhook: `https://your-app.onrender.com/webhook`

### Option 2: Railway.app
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. Railway auto-detects Node.js
6. Deploy!
7. Use Railway URL in webhook

### Option 3: Fly.io
1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. `fly launch` in your project
3. Follow prompts
4. `fly deploy`
5. Use Fly URL in webhook

---

## 📝 Quick Reference

### Your Configuration:
```
Local App: http://localhost:3000
Webhook Path: /webhook
Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### ngrok Commands:
```powershell
# Start tunnel
ngrok http 3000

# View dashboard
Start http://127.0.0.1:4040
```

### GitHub Webhook Settings:
```
Payload URL: https://YOUR-NGROK-URL.ngrok-free.app/webhook
Content type: application/json
Secret: (from .env)
Events: Pull requests only
Active: Yes
```

---

## ✅ Success Checklist

Before creating a PR, verify:
- [ ] App is running (`npm run dev`)
- [ ] ngrok is running (see HTTPS URL)
- [ ] GitHub webhook is configured with ngrok URL
- [ ] Secret matches between GitHub and `.env`
- [ ] "Pull requests" event is selected
- [ ] Webhook is Active

---

## 🎉 What Happens Next

1. **You create/update a PR** → GitHub sends webhook
2. **ngrok forwards to localhost:3000** → Your app receives it
3. **App validates signature** → Ensures it's from GitHub
4. **App fetches PR files** → Gets code to analyze
5. **Runs 3 analyzers** → Security, Quality, Performance
6. **AI enhancement** → IBM ICA adds insights
7. **Posts to GitHub** → Summary + review comments
8. **You see results** → On your PR! 🎊

---

**Made with ❤️ by Bob**

**Remember**: ngrok URL changes each time you restart it (free version). Update GitHub webhook when that happens!