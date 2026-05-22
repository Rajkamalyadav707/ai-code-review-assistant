# 🚀 Setup Guide: Running AI Code Review Assistant Locally

This guide will help you set up the AI Code Review Assistant to analyze pull requests in your repository: `https://github.com/Rajkamalyadav707/upsc-smart-ai-chat`

---

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- A GitHub account with access to your repository
- (Optional) IBM Watson account for AI features

---

## 🔧 Step 1: Install Dependencies

```bash
cd ai-code-review-assistant
npm install
```

This should now work without errors after our fixes!

---

## 🔑 Step 2: Create GitHub Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: `AI Code Review Assistant`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `write:discussion` (Read and write team discussions)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

Example token format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🔐 Step 3: Create Webhook Secret

Generate a secure random string for webhook verification:

```bash
# On Linux/Mac
openssl rand -hex 20

# On Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(40, 0)

# Or use any random string generator
```

Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

---

## ⚙️ Step 4: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your details:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# GitHub Configuration (REQUIRED)
GITHUB_TOKEN=ghp_your_token_from_step_2_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_from_step_3_here

# Analysis Configuration
MAX_FILE_SIZE=1048576
MAX_FILES_PER_PR=100
ENABLE_SECURITY_SCAN=true
ENABLE_QUALITY_SCAN=true
ENABLE_PERFORMANCE_SCAN=true

# Worker Configuration
WORKER_INTERVAL_MS=5000
MAX_REVIEW_COMMENTS=10

# Webhook Configuration
WEBHOOK_PATH=/webhook
WEBHOOK_VERIFY_SIGNATURE=true

# CORS (for local development)
CORS_ORIGIN=*

# Logging (optional)
LOG_FILE_PATH=./logs/app.log

# IBM Watson (OPTIONAL - for AI features)
# WATSON_API_KEY=your_watson_api_key_here
# WATSON_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com
# WATSON_VERSION=2022-04-07
```

---

## 🚀 Step 5: Start the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

You should see:
```
2026-05-18 17:45:00 [info]: Verifying GitHub connection...
2026-05-18 17:45:01 [info]: GitHub connection verified successfully
2026-05-18 17:45:01 [info]: Analysis worker started {"intervalMs":5000}
2026-05-18 17:45:01 [info]: AI Code Review Assistant started {"port":3000,"nodeEnv":"development","webhookPath":"/webhook","signatureVerification":true}
```

---

## 🌐 Step 6: Expose Local Server (for GitHub Webhooks)

Since GitHub needs to send webhooks to your local server, you need to expose it to the internet.

### Option A: Using ngrok (Recommended)

1. Install ngrok: https://ngrok.com/download
2. Expose your local server:
```bash
ngrok http 3000
```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Option B: Using localtunnel
```bash
npm install -g localtunnel
lt --port 3000
```

### Option C: Using Cloudflare Tunnel
```bash
npx cloudflared tunnel --url http://localhost:3000
```

**Important**: Use the HTTPS URL for the webhook!

---

## 🔗 Step 7: Configure GitHub Webhook

1. Go to your repository: `https://github.com/Rajkamalyadav707/upsc-smart-ai-chat`
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://your-ngrok-url.ngrok.io/webhook`
   - **Content type**: `application/json`
   - **Secret**: Your webhook secret from Step 3
   - **Events**: Select "Let me select individual events"
     - ✅ Pull requests
     - ✅ Pull request reviews
     - ✅ Pull request review comments
   - ✅ Active
4. Click **Add webhook**

---

## 🧪 Step 8: Test the Setup

### 1. Check Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-18T12:00:00.000Z",
  "uptime": 60,
  "version": "1.0.0",
  "github": {
    "connected": true,
    "rateLimit": {
      "remaining": 4999,
      "limit": 5000,
      "reset": "2026-05-18T13:00:00.000Z"
    }
  }
}
```

### 2. Check Queue Status
```bash
curl http://localhost:3000/queue/status
```

### 3. Test with a Pull Request

1. Create a new branch in your repository
2. Make some code changes (add a simple JavaScript/TypeScript file)
3. Create a pull request
4. Watch the logs in your terminal
5. Check the PR for comments from the bot

---

## 📁 Example Test File

Create this file in your repository to test the analysis:

**`test-security.js`**
```javascript
// This file contains intentional security issues for testing

const express = require('express');
const app = express();

// SQL Injection vulnerability (will be detected)
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const query = `SELECT * FROM users WHERE id = ${userId}`;  // Vulnerable!
    // ... rest of code
});

// Hardcoded secret (will be detected)
const API_KEY = "sk-1234567890abcdef";  // Vulnerable!

// XSS vulnerability (will be detected)
app.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    res.send(`<h1>Results for: ${searchTerm}</h1>`);  // Vulnerable!
});

module.exports = app;
```

---

## 🎯 Expected Results

When you create a PR with the test file, you should see:

1. **Summary Comment** on the PR with:
   - Overall status (🔴 Critical Issues Found)
   - Statistics table
   - Findings by category
   - Recommendations

2. **Individual Comments** on specific lines with:
   - Severity badges (🔴 Critical, 🟠 High, etc.)
   - Issue descriptions
   - Code suggestions
   - Reference links

---

## 🔧 Troubleshooting

### Issue: "GitHub connection could not be verified"
- Check your `GITHUB_TOKEN` is correct
- Ensure token has `repo` scope
- Verify token hasn't expired

### Issue: "Webhook signature verification failed"
- Check `GITHUB_WEBHOOK_SECRET` matches in both .env and GitHub
- Ensure webhook is using HTTPS URL
- Verify webhook is sending to `/webhook` path

### Issue: "No comments posted"
- Check webhook is triggering (see logs)
- Verify PR has supported file types (.js, .ts, .py, etc.)
- Check file size limits (default 1MB)
- Look for errors in application logs

### Issue: Worker not processing jobs
- Check worker status: `curl http://localhost:3000/queue/status`
- Verify `WORKER_INTERVAL_MS` is set
- Look for worker errors in logs

---

## 📊 Monitoring

### View Logs
```bash
# Follow logs in real-time
tail -f logs/app.log

# Or check console output in development mode
npm run dev
```

### Check Status
```bash
# Health check
curl http://localhost:3000/health

# Queue and worker status
curl http://localhost:3000/queue/status

# API info
curl http://localhost:3000/
```

---

## 🎨 Customization

### Adjust Analysis Settings
Edit `.env`:
```env
# Disable specific analyzers
ENABLE_SECURITY_SCAN=true
ENABLE_QUALITY_SCAN=false
ENABLE_PERFORMANCE_SCAN=true

# Adjust limits
MAX_REVIEW_COMMENTS=5
MAX_FILES_PER_PR=50
```

### Change Worker Frequency
```env
# Process queue every 10 seconds instead of 5
WORKER_INTERVAL_MS=10000
```

---

## 🚀 Production Deployment

For production deployment, consider:

1. **Use GitHub App** instead of Personal Access Token
2. **Set up proper logging** with log rotation
3. **Use production queue** (Redis/RabbitMQ)
4. **Set up monitoring** and alerting
5. **Configure rate limiting**
6. **Use HTTPS** with proper SSL certificates

---

## 🆘 Need Help?

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Test GitHub token permissions
4. Ensure webhook URL is accessible from GitHub
5. Check file types are supported

---

## 🎉 Success!

Once everything is working, you'll have:

- ✅ Automated code analysis on every PR
- ✅ Security vulnerability detection
- ✅ Code quality assessment
- ✅ Performance issue identification
- ✅ Beautiful, actionable comments
- ✅ AI-powered insights (if Watson configured)

Your repository `upsc-smart-ai-chat` will now have intelligent code review assistance! 🤖

---

**Made with ❤️ by Bob**