# 🚀 Webhook Testing Guide - AI Code Review Assistant

This guide will help you test the GitHub webhook integration with your AI Code Review Assistant.

---

## 📋 Prerequisites

- ✅ Application running on `http://localhost:3000`
- ✅ GitHub account with a repository
- ✅ GitHub Personal Access Token configured in `.env`

---

## 🎯 Option 1: Using ngrok (Recommended for Testing)

### Step 1: Install ngrok

**Download ngrok:**
1. Go to https://ngrok.com/download
2. Download the Windows version
3. Extract the `ngrok.exe` file
4. (Optional) Add to PATH or run from the extracted folder

**Or use Chocolatey:**
```powershell
choco install ngrok
```

### Step 2: Start ngrok Tunnel

Open a **NEW PowerShell terminal** (keep your app running in the other one):

```powershell
# Navigate to where ngrok.exe is located, or if in PATH:
ngrok http 3000
```

You'll see output like:
```
ngrok                                                                           
                                                                                
Session Status                online                                            
Account                       Your Name (Plan: Free)                           
Version                       3.x.x                                             
Region                        United States (us)                                
Latency                       -                                                 
Web Interface                 http://127.0.0.1:4040                            
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90      
                              0       0       0.00    0.00    0.00    0.00     
```

**Copy the Forwarding URL**: `https://abc123def456.ngrok-free.app`

### Step 3: Configure GitHub Webhook

1. **Go to your GitHub repository**
2. Click **Settings** → **Webhooks** → **Add webhook**
3. **Configure the webhook:**
   - **Payload URL**: `https://abc123def456.ngrok-free.app/webhook` (use YOUR ngrok URL)
   - **Content type**: `application/json`
   - **Secret**: Copy from your `.env` file: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`
   - **Which events**: Select "Let me select individual events"
     - ✅ Check "Pull requests"
     - ✅ Uncheck everything else
   - **Active**: ✅ Checked
4. Click **Add webhook**

### Step 4: Test with a Pull Request

1. **Create a test branch:**
   ```bash
   git checkout -b test-ai-review
   ```

2. **Create a test file with some code issues:**
   ```bash
   # Create a file with intentional issues
   echo 'const password = "hardcoded123";
   function unsafeQuery(userId) {
     return "SELECT * FROM users WHERE id = " + userId;
   }
   var x = 1;
   for(var i=0; i<1000000; i++) {
     x = x + i;
   }' > test-security.js
   ```

3. **Commit and push:**
   ```bash
   git add test-security.js
   git commit -m "Test: Add file with security issues"
   git push origin test-ai-review
   ```

4. **Create Pull Request:**
   - Go to your GitHub repository
   - Click "Compare & pull request"
   - Create the PR

5. **Watch the Magic! 🎉**
   - Check your app terminal - you'll see logs
   - Check ngrok dashboard at `http://127.0.0.1:4040`
   - Check your PR - comments will appear!

---

## 🎯 Option 2: Using localtunnel (Alternative)

### Step 1: Install localtunnel

```powershell
npm install -g localtunnel
```

### Step 2: Start Tunnel

```powershell
lt --port 3000
```

You'll get a URL like: `https://random-name-123.loca.lt`

### Step 3: Configure GitHub Webhook

Use the localtunnel URL: `https://random-name-123.loca.lt/webhook`

Follow the same steps as ngrok above.

---

## 🎯 Option 3: Manual Webhook Testing (No Tunnel Needed)

### Create Test Webhook Payload

Create a file `test-webhook-payload.json`:

```json
{
  "action": "opened",
  "pull_request": {
    "number": 999,
    "title": "Test PR for AI Review",
    "body": "Testing the AI code review assistant",
    "draft": false,
    "user": {
      "login": "testuser"
    },
    "head": {
      "sha": "abc123def456",
      "ref": "test-branch"
    },
    "base": {
      "sha": "main123",
      "ref": "main"
    },
    "changed_files": 1,
    "additions": 10,
    "deletions": 2,
    "html_url": "https://github.com/yourusername/yourrepo/pull/999",
    "created_at": "2026-05-22T11:00:00Z",
    "updated_at": "2026-05-22T11:00:00Z"
  },
  "repository": {
    "name": "test-repo",
    "full_name": "yourusername/test-repo",
    "owner": {
      "login": "yourusername"
    }
  }
}
```

### Send Test Webhook

```powershell
# Calculate signature (simplified - for testing only)
$secret = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
$payload = Get-Content test-webhook-payload.json -Raw

# Send request
$headers = @{
    "Content-Type" = "application/json"
    "X-GitHub-Event" = "pull_request"
    "X-GitHub-Delivery" = "12345-67890-test"
}

Invoke-WebRequest -Uri http://localhost:3000/webhook -Method POST -Headers $headers -Body $payload
```

**Note**: This won't actually post comments to GitHub (no real PR), but you'll see the processing in logs.

---

## 📊 What to Expect

### In Your App Terminal:
```
2026-05-22 17:00:00 [info]: Received webhook event
2026-05-22 17:00:00 [info]: Processing pull request event {"action":"opened","prNumber":123}
2026-05-22 17:00:01 [info]: Extracted PR data {"prNumber":123,"changedFiles":1}
2026-05-22 17:00:01 [info]: Fetched changed files {"fileCount":1}
2026-05-22 17:00:01 [info]: Filtered files for analysis {"filteredCount":1}
2026-05-22 17:00:01 [info]: Analysis job queued {"jobId":"owner-repo-123-..."}
2026-05-22 17:00:06 [info]: Starting job processing
2026-05-22 17:00:07 [info]: Analyzing files {"fileCount":1}
2026-05-22 17:00:08 [info]: Analysis complete {"totalFindings":5,"criticalCount":2}
2026-05-22 17:00:09 [info]: Posted summary comment to PR
2026-05-22 17:00:10 [info]: Posted review comments {"count":2}
```

### On GitHub PR:
You'll see:
1. **Summary Comment** with:
   - Overall status (🔴 Critical Issues Found)
   - Statistics table
   - List of critical/high issues
   - Recommendations

2. **Review Comments** on specific lines:
   - Security vulnerabilities
   - Code quality issues
   - Performance problems

---

## 🔍 Troubleshooting

### Issue: "Invalid webhook signature"
**Solution**: Make sure the secret in GitHub webhook matches your `.env` file exactly.

### Issue: "No comments appearing"
**Check:**
1. Is your app running? (`http://localhost:3000/health`)
2. Is ngrok/tunnel running?
3. Check app logs for errors
4. Check GitHub webhook delivery (Settings → Webhooks → Recent Deliveries)

### Issue: "Port 3000 already in use"
**Solution**: 
```powershell
Get-Process node | Stop-Process -Force
npm run dev
```

### Issue: ngrok session expired
**Solution**: Free ngrok sessions expire after 2 hours. Restart ngrok and update GitHub webhook URL.

---

## 🎯 Expected Analysis Results

For the test file with security issues, you should see:

### Security Findings:
- 🔴 **CRITICAL**: Hardcoded credentials detected
- 🔴 **CRITICAL**: SQL injection vulnerability
- 🟠 **HIGH**: Unsafe string concatenation in query

### Quality Findings:
- 🟡 **MEDIUM**: Use of `var` instead of `const`/`let`
- 🟢 **LOW**: Variable naming could be improved

### Performance Findings:
- 🟠 **HIGH**: Inefficient loop with O(n) complexity
- 🟡 **MEDIUM**: Consider optimization for large iterations

---

## 📝 Quick Reference

### Your Configuration:
```
App URL: http://localhost:3000
Webhook Path: /webhook
Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
GitHub Token: github_pat_11AN2D4HQ0xAQmlPut1ZBu_...
```

### Test Commands:
```powershell
# Check app health
Invoke-WebRequest http://localhost:3000/health

# Check queue status
Invoke-WebRequest http://localhost:3000/queue/status

# View ngrok dashboard
Start http://127.0.0.1:4040
```

---

## 🎉 Success Indicators

✅ Webhook delivery shows "200 OK" in GitHub  
✅ App logs show "Analysis job queued"  
✅ Summary comment appears on PR  
✅ Review comments appear on code lines  
✅ Queue status shows job processed  

---

## 🚀 Next Steps After Testing

1. **Deploy to Production**:
   - Use a cloud service (Heroku, AWS, Azure, etc.)
   - Get a permanent public URL
   - Update GitHub webhook with production URL

2. **Monitor Performance**:
   - Check `/queue/status` regularly
   - Monitor GitHub API rate limits
   - Review logs for errors

3. **Customize Analysis**:
   - Adjust severity levels in `config/severity-levels.json`
   - Add custom patterns in `config/analysis-rules.json`
   - Configure analysis features in `.env`

---

**Made with ❤️ by Bob**

**Status**: Ready for Testing! 🚀