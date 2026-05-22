# Setup Guide

## Prerequisites

Before setting up the AI-Powered Code Review Assistant, ensure you have:

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- GitHub account with repository access
- IBM Cloud account

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-code-review-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

#### GitHub Configuration

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate new token with `repo` and `write:discussion` scopes
   - Copy the token to `GITHUB_TOKEN`

2. Set up GitHub Webhook:
   - Go to your repository Settings > Webhooks
   - Add webhook with URL: `https://your-domain.com/webhook`
   - Content type: `application/json`
   - Secret: Generate a random string and set as `GITHUB_WEBHOOK_SECRET`
   - Events: Select "Pull requests"

#### IBM Watson Configuration

1. Create Watson Natural Language Understanding service:
   - Log in to IBM Cloud
   - Create a new NLU service instance
   - Copy API key to `WATSON_API_KEY`
   - Copy service URL to `WATSON_URL`

2. Set IBM Cloud credentials:
   - Copy your IBM Cloud API key to `IBM_CLOUD_API_KEY`
   - Set your region in `IBM_CLOUD_REGION`

### 4. Build the Project

```bash
npm run build
```

### 5. Run Tests

```bash
npm test
```

### 6. Start the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

## Verification

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-13T09:00:00.000Z"
}
```

### Test Webhook Locally

Use a tool like ngrok to expose your local server:

```bash
ngrok http 3000
```

Update your GitHub webhook URL with the ngrok URL.

## Configuration

### Analysis Rules

Edit `config/analysis-rules.json` to customize:
- Security checks
- Quality metrics
- Performance patterns
- Best practices

### Severity Levels

Edit `config/severity-levels.json` to adjust:
- Issue severity thresholds
- Notification settings
- Scoring system

## Deployment

### Deploy to IBM Cloud

1. Install IBM Cloud CLI:
```bash
curl -fsSL https://clis.cloud.ibm.com/install/linux | sh
```

2. Login to IBM Cloud:
```bash
ibmcloud login
```

3. Deploy the application:
```bash
ibmcloud cf push
```

### Deploy with Docker

1. Build Docker image:
```bash
docker build -t ai-code-review-assistant .
```

2. Run container:
```bash
docker run -p 3000:3000 --env-file .env ai-code-review-assistant
```

## Troubleshooting

### Common Issues

#### Port Already in Use

Change the port in `.env`:
```
PORT=3001
```

#### GitHub Webhook Not Receiving Events

1. Check webhook URL is accessible
2. Verify webhook secret matches
3. Check GitHub webhook delivery logs

#### Watson API Errors

1. Verify API key is correct
2. Check service URL
3. Ensure service is active in IBM Cloud

#### TypeScript Compilation Errors

```bash
npm run build
```

Check for syntax errors in TypeScript files.

## Next Steps

- Configure custom analysis rules
- Set up CI/CD pipeline
- Enable monitoring and logging
- Configure notifications

## Support

For help and support:
- Open an issue on GitHub
- Check documentation in `/docs`
- Review API documentation in `docs/API.md`