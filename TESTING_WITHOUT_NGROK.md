# 🧪 Testing Without ngrok - Alternative Methods

## Multiple Ways to Test Your AI Code Review Assistant

---

## ✅ Method 1: Deploy to Free Cloud Service (BEST)

### Option A: Render.com (Recommended - Easiest)

**Advantages:**
- ✅ Completely free
- ✅ No credit card required
- ✅ Permanent URL
- ✅ Auto-deploys from GitHub
- ✅ HTTPS included

**Steps:**

1. **Push your code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Sign up at Render.com**
   - Go to https://render.com
   - Sign up with GitHub (free)

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repo

4. **Configure:**
   - **Name**: `ai-code-review-assistant`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable"
   
   Add all from your `.env`:
   ```
   PORT=3000
   NODE_ENV=production
   GITHUB_TOKEN=your_token
   GITHUB_WEBHOOK_SECRET=your_secret
   ICA_API_KEY=your_key
   ICA_BASE_URL=your_url
   ICA_MODEL=your_model
   (add all other variables)
   ```

6. **Deploy!**
   - Click "Create Web Service"
   - Wait 2-3 minutes
   - Get your URL: `https://ai-code-review-assistant.onrender.com`

7. **Configure GitHub Webhook**
   - Payload URL: `https://ai-code-review-assistant.onrender.com/webhook`
   - Done! ✅

---

### Option B: Railway.app

**Advantages:**
- ✅ Free tier ($5 credit/month)
- ✅ Very fast deployment
- ✅ Auto-detects Node.js
- ✅ Easy to use

**Steps:**

1. **Sign up at Railway.app**
   - Go to https://railway.app
   - Sign up with GitHub

2. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**
   - Click on your service
   - Go to "Variables" tab
   - Add all from `.env`

4. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Get URL: `https://your-app.up.railway.app`

5. **Use in GitHub webhook**
   - `https://your-app.up.railway.app/webhook`

---

### Option C: Fly.io

**Advantages:**
- ✅ Free tier (3 VMs)
- ✅ Fast global deployment
- ✅ Good for production

**Steps:**

1. **Install flyctl**
   ```powershell
   # Using PowerShell
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Launch app**
   ```bash
   fly launch
   ```
   - Follow prompts
   - Choose region
   - Don't deploy yet

4. **Set secrets**
   ```bash
   fly secrets set GITHUB_TOKEN=your_token
   fly secrets set GITHUB_WEBHOOK_SECRET=your_secret
   fly secrets set ICA_API_KEY=your_key
   # ... add all secrets
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Get URL**
   ```bash
   fly status
   ```
   Use: `https://your-app.fly.dev/webhook`

---

## ✅ Method 2: Use localtunnel (ngrok Alternative)

**Advantages:**
- ✅ Free
- ✅ No signup required
- ✅ npm package (easy install)

**Steps:**

1. **Install globally**
   ```powershell
   npm install -g localtunnel
   ```

2. **Start your app**
   ```powershell
   npm run dev
   ```

3. **Start tunnel**
   ```powershell
   lt --port 3000
   ```

4. **Get URL**
   You'll see: `your url is: https://random-name.loca.lt`

5. **Use in GitHub webhook**
   `https://random-name.loca.lt/webhook`

**Note:** First visit will show a page asking to continue. Click "Continue" and bookmark it.

---

## ✅ Method 3: Use Cloudflare Tunnel (Free)

**Advantages:**
- ✅ Free forever
- ✅ Stable connection
- ✅ From Cloudflare (reliable)

**Steps:**

1. **Download cloudflared**
   - Go to https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   - Download Windows version

2. **Start tunnel**
   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Get URL**
   Look for: `https://random-name.trycloudflare.com`

4. **Use in GitHub webhook**
   `https://random-name.trycloudflare.com/webhook`

---

## ✅ Method 4: Manual Testing (No External Service)

**Test the app functionality without GitHub webhook**

### Create Test Script

Create `test-manual.js`:

```javascript
const axios = require('axios');

// Test webhook payload
const payload = {
  action: 'opened',
  pull_request: {
    number: 1,
    title: 'Test PR',
    draft: false,
    user: { login: 'testuser' },
    head: { sha: 'abc123', ref: 'feature' },
    base: { sha: 'def456', ref: 'main' },
    changed_files: 1,
    additions: 10,
    deletions: 5,
    html_url: 'https://github.com/test/repo/pull/1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  repository: {
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    owner: { login: 'testuser' }
  }
};

// Send to local app
axios.post('http://localhost:3000/webhook', payload, {
  headers: {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'pull_request',
    'X-GitHub-Delivery': '12345-test'
  }
})
.then(response => {
  console.log('✅ Success:', response.data);
})
.catch(error => {
  console.error('❌ Error:', error.message);
});
```

**Run it:**
```powershell
# Install axios if needed
npm install axios

# Start your app
npm run dev

# In another terminal, run test
node test-manual.js
```

---

## ✅ Method 5: Use Your Own Server/VPS

If you have access to a server:

### Option A: Your Own VPS (DigitalOcean, Linode, etc.)

1. **Deploy to your server**
   ```bash
   # SSH to server
   ssh user@your-server.com
   
   # Clone repo
   git clone your-repo-url
   cd ai-code-review-assistant
   
   # Install and build
   npm install
   npm run build
   
   # Run with PM2
   npm install -g pm2
   pm2 start dist/index.js --name ai-review
   ```

2. **Configure firewall**
   ```bash
   # Allow port 3000
   sudo ufw allow 3000
   ```

3. **Use in webhook**
   `http://your-server-ip:3000/webhook`

### Option B: Use Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /webhook {
        proxy_pass http://localhost:3000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ Method 6: Use Serveo (SSH Tunnel)

**Advantages:**
- ✅ No installation
- ✅ Uses SSH (usually available)
- ✅ Free

**Steps:**

```bash
# Start tunnel
ssh -R 80:localhost:3000 serveo.net
```

You'll get a URL like: `https://random.serveo.net`

Use: `https://random.serveo.net/webhook`

---

## ✅ Method 7: Test Analyzers Directly

**Test the core functionality without webhooks**

Create `test-analyzers.js`:

```javascript
const { SecurityAnalyzer } = require('./dist/analyzers/security-analyzer');
const { QualityAnalyzer } = require('./dist/analyzers/quality-analyzer');
const { PerformanceAnalyzer } = require('./dist/analyzers/performance-analyzer');

const testCode = `
const password = "hardcoded123";
function unsafeQuery(userId) {
  return "SELECT * FROM users WHERE id = " + userId;
}
var x = 1;
for(var i=0; i<1000000; i++) {
  x = x + i;
}
`;

async function test() {
  console.log('🔍 Testing Security Analyzer...');
  const securityAnalyzer = new SecurityAnalyzer();
  const securityResult = await securityAnalyzer.analyze(testCode, 'test.js');
  console.log('Security findings:', securityResult.vulnerabilities.length);
  
  console.log('\n🔍 Testing Quality Analyzer...');
  const qualityAnalyzer = new QualityAnalyzer();
  const qualityResult = await qualityAnalyzer.analyze(testCode, 'test.js');
  console.log('Quality findings:', qualityResult.issues.length);
  
  console.log('\n🔍 Testing Performance Analyzer...');
  const performanceAnalyzer = new PerformanceAnalyzer();
  const performanceResult = await performanceAnalyzer.analyze(testCode, 'test.js');
  console.log('Performance findings:', performanceResult.issues.length);
  
  console.log('\n✅ All analyzers working!');
}

test().catch(console.error);
```

**Run:**
```powershell
npm run build
node test-analyzers.js
```

---

## 📊 Comparison Table

| Method | Free | Easy | Permanent URL | Best For |
|--------|------|------|---------------|----------|
| **Render.com** | ✅ | ✅✅✅ | ✅ | Production |
| **Railway.app** | ✅ | ✅✅✅ | ✅ | Production |
| **Fly.io** | ✅ | ✅✅ | ✅ | Production |
| **localtunnel** | ✅ | ✅✅ | ❌ | Testing |
| **Cloudflare Tunnel** | ✅ | ✅✅ | ❌ | Testing |
| **Serveo** | ✅ | ✅ | ❌ | Testing |
| **Manual Testing** | ✅ | ✅✅✅ | N/A | Development |
| **Direct Analyzers** | ✅ | ✅✅✅ | N/A | Development |
| **Own Server** | ❌ | ✅ | ✅ | Production |

---

## 🎯 Recommended Approach

### For Quick Testing:
1. **localtunnel** - Easiest, npm install
2. **Manual testing** - No external service needed
3. **Direct analyzer testing** - Test core functionality

### For Production:
1. **Render.com** - Best free option
2. **Railway.app** - Fast and easy
3. **Fly.io** - Good for scaling

---

## 🚀 Quick Start: Render.com (Recommended)

**5 Minutes to Deploy:**

1. Push code to GitHub
2. Sign up at render.com (free)
3. New Web Service → Connect GitHub repo
4. Add environment variables
5. Deploy!
6. Use URL in GitHub webhook

**Done!** ✅

---

## 💡 Pro Tips

### For Testing:
- Use **localtunnel** or **manual testing**
- No signup, no hassle
- Perfect for development

### For Production:
- Use **Render.com** or **Railway.app**
- Free tier is enough
- Permanent URL
- Auto-deploys from GitHub

### For Learning:
- Use **direct analyzer testing**
- See how analyzers work
- No webhook needed

---

**Made with ❤️ by Bob**

**You have MANY options besides ngrok!**