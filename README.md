# AI-Powered Code Review Assistant

An intelligent code review assistant powered by IBM Watson that automatically analyzes pull requests on GitHub, providing comprehensive feedback on code quality, security vulnerabilities, and performance issues.

## 🚀 Features

- **Automated Code Analysis**: Automatically triggered on pull request events
- **Security Scanning**: Identifies potential security vulnerabilities and best practice violations
- **Code Quality Assessment**: Analyzes code complexity, maintainability, and adherence to standards
- **Performance Analysis**: Detects performance bottlenecks and optimization opportunities
- **AI-Powered Insights**: Leverages IBM Watson for intelligent code understanding and recommendations
- **Contextual PR Comments**: Posts detailed, actionable feedback directly on pull requests
- **Severity Classification**: Categorizes issues by severity (critical, high, medium, low)

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- GitHub account with repository access
- IBM Cloud account with Watson services
- GitHub App or Personal Access Token

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-code-review-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Build the project:
```bash
npm run build
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# GitHub Configuration
GITHUB_TOKEN=your_github_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_APP_ID=your_app_id

# IBM Watson Configuration
WATSON_API_KEY=your_watson_api_key
WATSON_URL=your_watson_service_url
WATSON_VERSION=2023-12-01

# Analysis Configuration
MAX_FILE_SIZE=1048576
ANALYSIS_TIMEOUT=30000
```

### Analysis Rules

Customize analysis rules in `config/analysis-rules.json` to define:
- Code patterns to detect
- Security vulnerability checks
- Performance optimization rules
- Code quality metrics

### Severity Levels

Configure issue severity thresholds in `config/severity-levels.json`.

## 🚦 Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 📁 Project Structure

```
ai-code-review-assistant/
├── src/
│   ├── webhook/          # GitHub webhook handlers
│   ├── analyzers/        # Code analysis modules
│   ├── ai/              # Watson AI integration
│   ├── reporters/       # PR comment generation
│   ├── utils/           # Shared utilities
│   └── api/             # API endpoints
├── tests/               # Test files
├── docs/                # Documentation
├── config/              # Configuration files
├── scripts/             # Utility scripts
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## 🔧 API Endpoints

- `POST /webhook` - GitHub webhook endpoint for PR events
- `GET /health` - Health check endpoint
- `GET /status` - Service status and metrics

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- IBM Watson for AI capabilities
- GitHub API for integration
- Open source security and analysis tools

## 📧 Support

For issues and questions, please open an issue on GitHub or contact the maintainers.

## 🗺️ Roadmap

- [ ] Support for multiple programming languages
- [ ] Custom rule engine
- [ ] Integration with CI/CD pipelines
- [ ] Dashboard for analytics
- [ ] Machine learning model training on project-specific patterns
- [ ] Support for GitLab and Bitbucket

---

Built with ❤️ using IBM Watson and Node.js