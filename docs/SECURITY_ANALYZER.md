# Security Analyzer Module Documentation

## Overview

The Security Analyzer is a comprehensive code security scanning module that detects vulnerabilities across multiple programming languages using pattern matching and heuristics.

## Architecture

### Components

1. **Security Analyzer** (`src/analyzers/security-analyzer.ts`)
   - Main analyzer class that orchestrates security scanning
   - Supports incremental analysis and configurable options
   - Returns structured results with confidence scores

2. **Security Patterns** (`src/analyzers/patterns/security-patterns.ts`)
   - Comprehensive regex patterns for vulnerability detection
   - Organized by vulnerability type and language
   - Includes confidence scores and false positive indicators

3. **Code Parser** (`src/analyzers/utils/code-parser.ts`)
   - Language detection and code parsing utilities
   - Extracts functions, imports, and code structure
   - Provides context for vulnerability findings

4. **Type Definitions** (`src/types/index.ts`)
   - TypeScript interfaces for security analysis
   - Vulnerability types and severity levels
   - Analysis result structures

## Supported Vulnerabilities

### 1. SQL Injection (CWE-89)
- **Severity**: Critical
- **Detection**: Unsafe SQL query construction via string concatenation or template literals
- **Languages**: JavaScript, TypeScript, Python, Java
- **Examples**:
  ```javascript
  // Vulnerable
  db.query("SELECT * FROM users WHERE id = " + userId);
  db.query(`SELECT * FROM users WHERE name = '${userName}'`);
  
  // Safe
  db.query("SELECT * FROM users WHERE id = ?", [userId]);
  ```

### 2. Cross-Site Scripting (XSS) (CWE-79)
- **Severity**: High
- **Detection**: Unsafe HTML/DOM manipulation
- **Languages**: JavaScript, TypeScript
- **Examples**:
  ```javascript
  // Vulnerable
  element.innerHTML = userInput;
  document.write(userContent);
  eval(userCode);
  
  // Safe
  element.textContent = userInput;
  DOMPurify.sanitize(userContent);
  ```

### 3. Hardcoded Secrets (CWE-798)
- **Severity**: Critical
- **Detection**: API keys, passwords, tokens in source code
- **Languages**: All (generic patterns)
- **Examples**:
  ```javascript
  // Vulnerable
  const apiKey = "AKIA1234567890ABCDEF";
  const password = "MySecretPassword123";
  
  // Safe
  const apiKey = process.env.API_KEY;
  const password = process.env.DB_PASSWORD;
  ```

### 4. Path Traversal (CWE-22)
- **Severity**: High
- **Detection**: Unsafe file path operations
- **Languages**: JavaScript, TypeScript, Python, Java
- **Examples**:
  ```javascript
  // Vulnerable
  fs.readFile(userProvidedPath);
  
  // Safe
  const safePath = path.resolve(baseDir, userProvidedPath);
  if (!safePath.startsWith(baseDir)) throw new Error('Invalid path');
  fs.readFile(safePath);
  ```

### 5. Command Injection (CWE-78)
- **Severity**: Critical
- **Detection**: Unsafe shell command execution
- **Languages**: JavaScript, TypeScript, Python, Java
- **Examples**:
  ```javascript
  // Vulnerable
  exec(`ping ${userInput}`);
  
  // Safe
  execFile('ping', [userInput]);
  ```

### 6. Insecure Cryptography (CWE-327)
- **Severity**: High/Medium
- **Detection**: Weak hash algorithms (MD5, SHA-1) and ciphers (DES, RC4)
- **Languages**: All (generic patterns)
- **Examples**:
  ```javascript
  // Vulnerable
  crypto.createHash('md5');
  crypto.createCipher('des-ede3');
  
  // Safe
  crypto.createHash('sha256');
  crypto.createCipheriv('aes-256-gcm', key, iv);
  ```

### 7. Server-Side Request Forgery (SSRF) (CWE-918)
- **Severity**: High
- **Detection**: HTTP requests with user-controlled URLs
- **Languages**: JavaScript, TypeScript, Python, Java
- **Examples**:
  ```javascript
  // Vulnerable
  fetch(userProvidedUrl);
  
  // Safe
  if (!isAllowedDomain(url)) throw new Error('Invalid URL');
  fetch(url);
  ```

### 8. Insecure Deserialization (CWE-502)
- **Severity**: Critical
- **Detection**: Unsafe object deserialization
- **Languages**: JavaScript, TypeScript, Python, Java
- **Examples**:
  ```python
  # Vulnerable
  pickle.loads(user_data)
  yaml.load(user_input)
  
  # Safe
  json.loads(user_data)
  yaml.safe_load(user_input)
  ```

## Usage

### Basic Usage

```typescript
import { SecurityAnalyzer } from './analyzers/security-analyzer';

const analyzer = new SecurityAnalyzer({
  skipComments: true,
  minConfidence: 0.7,
  maxVulnerabilitiesPerFile: 100,
  contextLines: 3
});

const result = await analyzer.analyze(code, filename);

console.log(`Found ${result.summary.total} vulnerabilities`);
console.log(`Critical: ${result.summary.critical}`);
console.log(`High: ${result.summary.high}`);
```

### Analyzing Multiple Files

```typescript
const files = [
  { filename: 'app.js', content: jsCode },
  { filename: 'utils.py', content: pythonCode }
];

const results = await analyzer.analyzeFiles(files);
const stats = analyzer.getOverallStatistics(results);

console.log(`Total vulnerabilities: ${stats.totalVulnerabilities}`);
console.log(`Most common: ${stats.mostCommonTypes[0].type}`);
```

### Configuration Options

```typescript
interface AnalyzerOptions {
  // Skip analysis of comments (default: true)
  skipComments?: boolean;
  
  // Minimum confidence threshold (0-1, default: 0.5)
  minConfidence?: number;
  
  // Maximum vulnerabilities per file (default: 100)
  maxVulnerabilitiesPerFile?: number;
  
  // Lines of context around vulnerability (default: 3)
  contextLines?: number;
}
```

## Output Format

### SecurityAnalysisResult

```typescript
{
  file: string;                    // File path
  language: string;                // Detected language
  vulnerabilities: SecurityVulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  analysisTime: number;            // Milliseconds
  linesAnalyzed: number;
}
```

### SecurityVulnerability

```typescript
{
  id: string;                      // Unique identifier
  type: VulnerabilityType;         // sql_injection, xss, etc.
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;                   // Short description
  description: string;             // Detailed explanation
  file: string;                    // File path
  line: number;                    // Line number
  column?: number;                 // Column number
  code: string;                    // Vulnerable code snippet
  confidence: number;              // 0-1 confidence score
  cwe?: string;                    // CWE identifier
  owasp?: string;                  // OWASP reference
  fixSuggestion?: string;          // How to fix
  context?: string;                // Code context
  patternId?: string;              // Pattern that matched
}
```

## Supported Languages

- **JavaScript** (.js, .jsx)
- **TypeScript** (.ts, .tsx)
- **Python** (.py)
- **Java** (.java)
- **Go** (.go)

## Pattern Matching

### Pattern Structure

Each security pattern includes:
- **ID**: Unique identifier
- **Name**: Human-readable name
- **Description**: What the pattern detects
- **Pattern**: Regex for matching
- **Severity**: Critical, high, medium, or low
- **Confidence**: 0-1 score indicating reliability
- **Languages**: Applicable languages
- **CWE/OWASP**: Security references
- **Fix Suggestion**: Remediation advice
- **False Positive Indicators**: Patterns that suggest safe usage

### Example Pattern

```typescript
{
  id: 'sql-injection-string-concat-js',
  name: 'SQL Injection via String Concatenation',
  description: 'SQL query constructed using string concatenation',
  pattern: /query\s*\(\s*['"].*?SELECT.*?['"]\s*\+/gi,
  severity: 'critical',
  confidence: 0.85,
  languages: ['javascript', 'typescript'],
  cwe: 'CWE-89',
  owasp: 'A03:2021 - Injection',
  fixSuggestion: 'Use parameterized queries',
  falsePositiveIndicators: [/sanitize|escape/i]
}
```

## Performance Considerations

### Efficiency
- Patterns use non-backtracking regex where possible
- Comments are optionally skipped to reduce false positives
- Results are deduplicated to avoid redundant findings
- Analysis is stateless and thread-safe

### Scalability
- Supports incremental analysis (only changed files)
- Configurable limits on vulnerabilities per file
- Efficient pattern matching with early termination
- Minimal memory footprint

## False Positive Reduction

### Strategies
1. **Context Analysis**: Check if code is in comments
2. **False Positive Indicators**: Patterns that suggest safe usage
3. **Confidence Scores**: Filter by minimum confidence threshold
4. **Language-Specific Patterns**: Tailored to each language's idioms
5. **Deduplication**: Remove duplicate findings on same line

### Example

```typescript
// This will NOT be flagged due to sanitization
const query = "SELECT * FROM users WHERE id = " + sanitize(userId);

// This WILL be flagged
const query = "SELECT * FROM users WHERE id = " + userId;
```

## Integration

### With Webhook Handler

```typescript
import { SecurityAnalyzer } from './analyzers/security-analyzer';

async function analyzePR(files: FileChange[]) {
  const analyzer = new SecurityAnalyzer();
  const results = await analyzer.analyzeFiles(files);
  
  // Convert to findings for comment generator
  const findings = results.flatMap(r => 
    r.vulnerabilities.map(v => ({
      type: 'security',
      severity: v.severity,
      title: v.title,
      description: v.description,
      file: v.file,
      line: v.line,
      suggestion: v.fixSuggestion
    }))
  );
  
  return findings;
}
```

### With CI/CD Pipeline

```typescript
const analyzer = new SecurityAnalyzer({ minConfidence: 0.8 });
const results = await analyzer.analyzeFiles(changedFiles);

if (results.some(r => r.summary.critical > 0)) {
  console.error('Critical vulnerabilities found!');
  process.exit(1);
}
```

## Testing

### Unit Tests

```typescript
describe('SecurityAnalyzer', () => {
  it('should detect SQL injection', async () => {
    const code = 'db.query("SELECT * FROM users WHERE id = " + userId)';
    const result = await analyzer.analyze(code, 'test.js');
    
    expect(result.vulnerabilities).toHaveLength(1);
    expect(result.vulnerabilities[0].type).toBe('sql_injection');
  });
  
  it('should skip comments', async () => {
    const code = '// db.query("SELECT * FROM users WHERE id = " + userId)';
    const result = await analyzer.analyze(code, 'test.js');
    
    expect(result.vulnerabilities).toHaveLength(0);
  });
});
```

## Future Enhancements

1. **AST-Based Analysis**: Use abstract syntax trees for more accurate detection
2. **Data Flow Analysis**: Track tainted data through the codebase
3. **Machine Learning**: Train models on known vulnerabilities
4. **Custom Rules**: Allow users to define custom security patterns
5. **Fix Automation**: Automatically generate patches for common issues
6. **Integration with SAST Tools**: Combine with existing security scanners

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE - Common Weakness Enumeration](https://cwe.mitre.org/)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)

## License

MIT License - See LICENSE file for details

---

**Made with Bob**