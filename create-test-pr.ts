/**
 * Script to create a test pull request with dummy code
 */

import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';

dotenv.config();

async function createTestPR() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found in environment variables');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  try {
    // Create the pull request
    const { data: pr } = await octokit.pulls.create({
      owner: 'Rajkamalyadav707',
      repo: 'ai-code-review-assistant',
      title: 'Test: Dummy code with intentional issues',
      head: 'test-dummy-code-issues',
      base: 'main',
      body: `## 🧪 Test Pull Request for AI Code Review Assistant

This PR contains dummy code with **multiple intentional issues** for testing the AI code review assistant.

### 🔴 Security Issues:
- ❌ Hardcoded credentials (API keys, passwords, tokens)
- ❌ SQL injection vulnerability in \`getUserByUsername()\`
- ❌ Weak cryptography (MD5 hashing)
- ❌ \`eval()\` usage - arbitrary code execution risk
- ❌ Console.log with sensitive data exposure

### ⚡ Performance Issues:
- ❌ O(n²) algorithm complexity in \`findDuplicates()\`
- ❌ Synchronous file operations blocking event loop
- ❌ Inefficient string concatenation in loops
- ❌ Memory leaks (unremoved event listeners)

### 📝 Code Quality Issues:
- ❌ No error handling in async operations
- ❌ No input validation
- ❌ Global mutable state
- ❌ Unused variables
- ❌ TypeScript type errors

### 📁 File Changed:
- \`src/test-dummy-code.ts\` (120 lines)

---

**⚠️ This is for testing purposes only. Do not merge this PR.**

The AI code review assistant should detect and report all these issues automatically.`,
    });

    console.log('✅ Pull request created successfully!');
    console.log(`📝 PR #${pr.number}: ${pr.title}`);
    console.log(`🔗 URL: ${pr.html_url}`);
    console.log('\n🤖 Your AI code review assistant should now analyze this PR and post comments about the issues.');
    
  } catch (error: any) {
    console.error('❌ Failed to create pull request:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

createTestPR();

// Made with Bob
