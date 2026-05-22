/**
 * Security Patterns
 * Regex patterns for detecting security vulnerabilities across multiple languages
 */

export type VulnerabilityType =
  | 'sql_injection'
  | 'xss'
  | 'hardcoded_secret'
  | 'path_traversal'
  | 'command_injection'
  | 'insecure_crypto'
  | 'ssrf'
  | 'insecure_deserialization';

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'generic';

export interface SecurityPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-1, how confident we are this is a real issue
  languages: Language[];
  cwe?: string; // Common Weakness Enumeration ID
  owasp?: string; // OWASP Top 10 reference
  fixSuggestion?: string;
  falsePositiveIndicators?: RegExp[]; // Patterns that suggest this might be a false positive
}

/**
 * SQL Injection Patterns
 * Detects unsafe SQL query construction that could lead to SQL injection
 */
export const sqlInjectionPatterns: SecurityPattern[] = [
  {
    id: 'sql-injection-string-concat-js',
    name: 'SQL Injection via String Concatenation (JavaScript/TypeScript)',
    description: 'SQL query constructed using string concatenation with user input',
    pattern: /(?:query|execute|exec|run)\s*\(\s*['"`].*?(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE).*?['"`]\s*\+\s*(?!['"`])/gi,
    severity: 'critical',
    confidence: 0.85,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-89',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use parameterized queries or prepared statements instead of string concatenation',
    falsePositiveIndicators: [/sanitize|escape|validate/i]
  },
  {
    id: 'sql-injection-template-literal-js',
    name: 'SQL Injection via Template Literal (JavaScript/TypeScript)',
    description: 'SQL query using template literals with variables',
    pattern: /(?:query|execute|exec|run)\s*\(\s*`.*?(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE).*?\$\{[^}]+\}/gi,
    severity: 'critical',
    confidence: 0.8,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-89',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use parameterized queries with placeholders ($1, $2, etc.) instead of template literals'
  },
  {
    id: 'sql-injection-format-python',
    name: 'SQL Injection via String Formatting (Python)',
    description: 'SQL query using string formatting with user input',
    pattern: /(?:execute|executemany|cursor\.execute)\s*\(\s*(?:f['"]|['"].*?%s|['"].*?\.format)/gi,
    severity: 'critical',
    confidence: 0.85,
    languages: ['python'],
    cwe: 'CWE-89',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use parameterized queries with ? or %s placeholders and pass values as tuple'
  },
  {
    id: 'sql-injection-concat-java',
    name: 'SQL Injection via String Concatenation (Java)',
    description: 'SQL query constructed using string concatenation',
    pattern: /(?:executeQuery|executeUpdate|execute)\s*\(\s*".*?(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE).*?"\s*\+/gi,
    severity: 'critical',
    confidence: 0.85,
    languages: ['java'],
    cwe: 'CWE-89',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use PreparedStatement with setString(), setInt(), etc. instead of string concatenation'
  }
];

/**
 * XSS (Cross-Site Scripting) Patterns
 * Detects unsafe HTML/DOM manipulation that could lead to XSS
 */
export const xssPatterns: SecurityPattern[] = [
  {
    id: 'xss-innerhtml-js',
    name: 'XSS via innerHTML (JavaScript/TypeScript)',
    description: 'Direct assignment to innerHTML with potentially unsafe content',
    pattern: /\.innerHTML\s*=\s*(?!['"`])[^;]+/gi,
    severity: 'high',
    confidence: 0.75,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-79',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use textContent for text or sanitize HTML with DOMPurify before assigning to innerHTML',
    falsePositiveIndicators: [/sanitize|DOMPurify|escape/i]
  },
  {
    id: 'xss-document-write-js',
    name: 'XSS via document.write (JavaScript/TypeScript)',
    description: 'Using document.write with dynamic content',
    pattern: /document\.write\s*\(\s*(?!['"`])[^)]+\)/gi,
    severity: 'high',
    confidence: 0.8,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-79',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Avoid document.write; use DOM manipulation methods and sanitize user input'
  },
  {
    id: 'xss-eval-js',
    name: 'XSS via eval (JavaScript/TypeScript)',
    description: 'Using eval with user-controlled input',
    pattern: /\beval\s*\(\s*(?!['"`])[^)]+\)/gi,
    severity: 'critical',
    confidence: 0.9,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-95',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Never use eval with user input; use JSON.parse for JSON or safer alternatives'
  },
  {
    id: 'xss-dangerously-set-html-react',
    name: 'XSS via dangerouslySetInnerHTML (React)',
    description: 'Using dangerouslySetInnerHTML without sanitization',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\{?\s*__html:\s*(?!['"`])[^}]+\}\}?/gi,
    severity: 'high',
    confidence: 0.8,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-79',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Sanitize HTML with DOMPurify before using dangerouslySetInnerHTML'
  },
  {
    id: 'xss-v-html-vue',
    name: 'XSS via v-html (Vue.js)',
    description: 'Using v-html directive with unsanitized content',
    pattern: /v-html\s*=\s*["'](?!sanitize)[^"']+["']/gi,
    severity: 'high',
    confidence: 0.75,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-79',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Sanitize HTML content before using v-html directive'
  }
];

/**
 * Hardcoded Secrets Patterns
 * Detects API keys, passwords, tokens, and other secrets in code
 */
export const hardcodedSecretPatterns: SecurityPattern[] = [
  {
    id: 'hardcoded-password',
    name: 'Hardcoded Password',
    description: 'Password hardcoded in source code',
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"](?!.*\$\{)(?!.*%s)(?!.*\?)(?!.*password|passwd|pwd|secret|key|token)[^'"]{8,}['"]/gi,
    severity: 'critical',
    confidence: 0.7,
    languages: ['generic'],
    cwe: 'CWE-798',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    fixSuggestion: 'Store passwords in environment variables or secure secret management systems',
    falsePositiveIndicators: [/example|test|demo|placeholder|dummy/i]
  },
  {
    id: 'hardcoded-api-key',
    name: 'Hardcoded API Key',
    description: 'API key hardcoded in source code',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*['"](?!.*\$\{)(?!.*%s)[A-Za-z0-9_\-]{20,}['"]/gi,
    severity: 'critical',
    confidence: 0.8,
    languages: ['generic'],
    cwe: 'CWE-798',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    fixSuggestion: 'Store API keys in environment variables or secure secret management systems'
  },
  {
    id: 'hardcoded-aws-key',
    name: 'Hardcoded AWS Access Key',
    description: 'AWS access key hardcoded in source code',
    pattern: /(?:AKIA|A3T|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: 'critical',
    confidence: 0.95,
    languages: ['generic'],
    cwe: 'CWE-798',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    fixSuggestion: 'Immediately rotate the AWS key and use AWS IAM roles or environment variables'
  },
  {
    id: 'hardcoded-private-key',
    name: 'Hardcoded Private Key',
    description: 'Private key hardcoded in source code',
    pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/gi,
    severity: 'critical',
    confidence: 0.95,
    languages: ['generic'],
    cwe: 'CWE-798',
    owasp: 'A02:2021 - Cryptographic Failures',
    fixSuggestion: 'Remove private key from code and store in secure key management system'
  },
  {
    id: 'hardcoded-jwt-secret',
    name: 'Hardcoded JWT Secret',
    description: 'JWT secret hardcoded in source code',
    pattern: /(?:jwt[_-]?secret|jwt[_-]?key)\s*[=:]\s*['"](?!.*\$\{)(?!.*%s)[^'"]{16,}['"]/gi,
    severity: 'critical',
    confidence: 0.85,
    languages: ['generic'],
    cwe: 'CWE-798',
    owasp: 'A02:2021 - Cryptographic Failures',
    fixSuggestion: 'Store JWT secret in environment variables with strong random value'
  },
  {
    id: 'hardcoded-github-token',
    name: 'Hardcoded GitHub Token',
    description: 'GitHub personal access token in source code',
    pattern: /ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}/g,
    severity: 'critical',
    confidence: 0.95,
    languages: ['generic'],
    cwe: 'CWE-798',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    fixSuggestion: 'Revoke the token immediately and use GitHub secrets or environment variables'
  }
];

/**
 * Path Traversal Patterns
 * Detects unsafe file path operations that could lead to path traversal attacks
 */
export const pathTraversalPatterns: SecurityPattern[] = [
  {
    id: 'path-traversal-fs-js',
    name: 'Path Traversal in File Operations (JavaScript/TypeScript)',
    description: 'File system operation with unsanitized user input',
    pattern: /(?:readFile|writeFile|unlink|rmdir|mkdir|stat|access|open)\s*\(\s*(?!['"`])[^,)]+/gi,
    severity: 'high',
    confidence: 0.6,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-22',
    owasp: 'A01:2021 - Broken Access Control',
    fixSuggestion: 'Validate and sanitize file paths; use path.resolve() and check if result is within allowed directory',
    falsePositiveIndicators: [/path\.resolve|path\.normalize|sanitize|validate/i]
  },
  {
    id: 'path-traversal-python',
    name: 'Path Traversal in File Operations (Python)',
    description: 'File operation with potentially unsafe path',
    pattern: /(?:open|os\.path\.join|pathlib\.Path)\s*\(\s*(?!['"`])[^,)]+/gi,
    severity: 'high',
    confidence: 0.6,
    languages: ['python'],
    cwe: 'CWE-22',
    owasp: 'A01:2021 - Broken Access Control',
    fixSuggestion: 'Use os.path.abspath() and verify the resolved path is within allowed directory'
  },
  {
    id: 'path-traversal-java',
    name: 'Path Traversal in File Operations (Java)',
    description: 'File operation with unsanitized input',
    pattern: /new\s+File\s*\(\s*(?!["'])[^)]+\)|Files\.(?:read|write|delete)\s*\(\s*Paths\.get\s*\(\s*(?!["'])/gi,
    severity: 'high',
    confidence: 0.6,
    languages: ['java'],
    cwe: 'CWE-22',
    owasp: 'A01:2021 - Broken Access Control',
    fixSuggestion: 'Validate file paths and use getCanonicalPath() to resolve and verify paths'
  }
];

/**
 * Command Injection Patterns
 * Detects unsafe shell command execution
 */
export const commandInjectionPatterns: SecurityPattern[] = [
  {
    id: 'command-injection-exec-js',
    name: 'Command Injection via exec (JavaScript/TypeScript)',
    description: 'Shell command execution with unsanitized input',
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\(\s*(?!['"`])[^,)]+/gi,
    severity: 'critical',
    confidence: 0.75,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-78',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use execFile or spawn with array arguments instead of shell commands; validate all inputs',
    falsePositiveIndicators: [/sanitize|escape|validate|shellEscape/i]
  },
  {
    id: 'command-injection-system-python',
    name: 'Command Injection via system/popen (Python)',
    description: 'Shell command execution with user input',
    pattern: /(?:os\.system|os\.popen|subprocess\.(?:call|run|Popen))\s*\(\s*(?!['"`])[^,)]+/gi,
    severity: 'critical',
    confidence: 0.75,
    languages: ['python'],
    cwe: 'CWE-78',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use subprocess with list arguments and shell=False; validate all inputs'
  },
  {
    id: 'command-injection-runtime-java',
    name: 'Command Injection via Runtime.exec (Java)',
    description: 'Command execution with unsanitized input',
    pattern: /Runtime\.getRuntime\(\)\.exec\s*\(\s*(?!["'])[^)]+\)/gi,
    severity: 'critical',
    confidence: 0.75,
    languages: ['java'],
    cwe: 'CWE-78',
    owasp: 'A03:2021 - Injection',
    fixSuggestion: 'Use ProcessBuilder with array arguments; validate and sanitize all inputs'
  }
];

/**
 * Insecure Cryptography Patterns
 * Detects use of weak or broken cryptographic algorithms
 */
export const insecureCryptoPatterns: SecurityPattern[] = [
  {
    id: 'weak-hash-md5',
    name: 'Weak Hash Algorithm (MD5)',
    description: 'Use of MD5 hash algorithm which is cryptographically broken',
    pattern: /\b(?:md5|MD5|createHash\s*\(\s*['"]md5['"])/gi,
    severity: 'high',
    confidence: 0.9,
    languages: ['generic'],
    cwe: 'CWE-327',
    owasp: 'A02:2021 - Cryptographic Failures',
    fixSuggestion: 'Use SHA-256 or SHA-3 instead of MD5 for cryptographic purposes'
  },
  {
    id: 'weak-hash-sha1',
    name: 'Weak Hash Algorithm (SHA-1)',
    description: 'Use of SHA-1 hash algorithm which is deprecated',
    pattern: /\b(?:sha1|SHA1|createHash\s*\(\s*['"]sha1['"])/gi,
    severity: 'medium',
    confidence: 0.85,
    languages: ['generic'],
    cwe: 'CWE-327',
    owasp: 'A02:2021 - Cryptographic Failures',
    fixSuggestion: 'Use SHA-256 or SHA-3 instead of SHA-1'
  },
  {
    id: 'weak-cipher-des',
    name: 'Weak Cipher (DES/3DES)',
    description: 'Use of DES or 3DES encryption which is insecure',
    pattern: /\b(?:DES|3DES|TripleDES|des-ede3|des-ede-cbc)/gi,
    severity: 'high',
    confidence: 0.9,
    languages: ['generic'],
    cwe: 'CWE-327',
    owasp: 'A02:2021 - Cryptographic Failures',
    fixSuggestion: 'Use AES-256-GCM or ChaCha20-Poly1305 for encryption'
  },
  {
    id: 'weak-cipher-rc4',
    name: 'Weak Cipher (RC4)',
    description: 'Use of RC4 cipher which is broken',
    pattern: /\b(?:RC4|rc4|arcfour)/gi,
    severity: 'high',
    confidence: 0.9,
    languages: ['generic'],
    cwe: 'CWE-327',
    owasp: 'A02:2021 - Cryptographic Failures',
    fixSuggestion: 'Use AES-256-GCM or ChaCha20-Poly1305 instead of RC4'
  },
  {
    id: 'insecure-random',
    name: 'Insecure Random Number Generation',
    description: 'Use of Math.random() for security-sensitive operations',
    pattern: /Math\.random\(\)/gi,
    severity: 'medium',
    confidence: 0.6,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-338',
    owasp: 'A02:2021 - Cryptographic Failures',
    fixSuggestion: 'Use crypto.randomBytes() or crypto.getRandomValues() for cryptographic randomness',
    falsePositiveIndicators: [/animation|ui|display|visual/i]
  }
];

/**
 * SSRF (Server-Side Request Forgery) Patterns
 * Detects unsafe URL handling that could lead to SSRF
 */
export const ssrfPatterns: SecurityPattern[] = [
  {
    id: 'ssrf-fetch-js',
    name: 'SSRF via fetch (JavaScript/TypeScript)',
    description: 'HTTP request with user-controlled URL',
    pattern: /(?:fetch|axios\.(?:get|post|put|delete)|request)\s*\(\s*(?!['"`])[^,)]+/gi,
    severity: 'high',
    confidence: 0.65,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-918',
    owasp: 'A10:2021 - Server-Side Request Forgery',
    fixSuggestion: 'Validate URLs against allowlist; block private IP ranges and localhost',
    falsePositiveIndicators: [/validate|whitelist|allowlist|sanitize/i]
  },
  {
    id: 'ssrf-requests-python',
    name: 'SSRF via requests (Python)',
    description: 'HTTP request with unsanitized URL',
    pattern: /requests\.(?:get|post|put|delete|request)\s*\(\s*(?!['"`])[^,)]+/gi,
    severity: 'high',
    confidence: 0.65,
    languages: ['python'],
    cwe: 'CWE-918',
    owasp: 'A10:2021 - Server-Side Request Forgery',
    fixSuggestion: 'Validate URLs against allowlist; block private IP ranges'
  },
  {
    id: 'ssrf-url-connection-java',
    name: 'SSRF via URL Connection (Java)',
    description: 'HTTP connection with user-controlled URL',
    pattern: /new\s+URL\s*\(\s*(?!["'])[^)]+\)\.openConnection/gi,
    severity: 'high',
    confidence: 0.65,
    languages: ['java'],
    cwe: 'CWE-918',
    owasp: 'A10:2021 - Server-Side Request Forgery',
    fixSuggestion: 'Validate URLs against allowlist; use URL parsing to check host'
  }
];

/**
 * Insecure Deserialization Patterns
 * Detects unsafe object deserialization
 */
export const insecureDeserializationPatterns: SecurityPattern[] = [
  {
    id: 'unsafe-deserialization-pickle-python',
    name: 'Unsafe Deserialization (Python pickle)',
    description: 'Using pickle.loads with untrusted data',
    pattern: /pickle\.loads?\s*\(\s*(?!['"`])[^)]+\)/gi,
    severity: 'critical',
    confidence: 0.8,
    languages: ['python'],
    cwe: 'CWE-502',
    owasp: 'A08:2021 - Software and Data Integrity Failures',
    fixSuggestion: 'Never deserialize untrusted data; use JSON or implement signature verification'
  },
  {
    id: 'unsafe-deserialization-yaml-python',
    name: 'Unsafe YAML Deserialization (Python)',
    description: 'Using yaml.load without SafeLoader',
    pattern: /yaml\.load\s*\(\s*[^,)]+\s*(?:,\s*Loader\s*=\s*yaml\.Loader)?\)/gi,
    severity: 'critical',
    confidence: 0.85,
    languages: ['python'],
    cwe: 'CWE-502',
    owasp: 'A08:2021 - Software and Data Integrity Failures',
    fixSuggestion: 'Use yaml.safe_load() instead of yaml.load()'
  },
  {
    id: 'unsafe-deserialization-java',
    name: 'Unsafe Deserialization (Java)',
    description: 'Using ObjectInputStream with untrusted data',
    pattern: /new\s+ObjectInputStream\s*\([^)]+\)\.readObject\s*\(\)/gi,
    severity: 'critical',
    confidence: 0.75,
    languages: ['java'],
    cwe: 'CWE-502',
    owasp: 'A08:2021 - Software and Data Integrity Failures',
    fixSuggestion: 'Avoid deserializing untrusted data; implement input validation and use allowlists'
  },
  {
    id: 'unsafe-deserialization-node-serialize',
    name: 'Unsafe Deserialization (Node.js)',
    description: 'Using node-serialize or similar with untrusted data',
    pattern: /(?:unserialize|deserialize)\s*\(\s*(?!['"`])[^)]+\)/gi,
    severity: 'critical',
    confidence: 0.7,
    languages: ['javascript', 'typescript'],
    cwe: 'CWE-502',
    owasp: 'A08:2021 - Software and Data Integrity Failures',
    fixSuggestion: 'Use JSON.parse() for data serialization; never deserialize untrusted data'
  }
];

/**
 * All security patterns organized by vulnerability type
 */
export const securityPatterns: Record<VulnerabilityType, SecurityPattern[]> = {
  sql_injection: sqlInjectionPatterns,
  xss: xssPatterns,
  hardcoded_secret: hardcodedSecretPatterns,
  path_traversal: pathTraversalPatterns,
  command_injection: commandInjectionPatterns,
  insecure_crypto: insecureCryptoPatterns,
  ssrf: ssrfPatterns,
  insecure_deserialization: insecureDeserializationPatterns
};

/**
 * Get patterns for a specific language
 */
export function getPatternsForLanguage(language: Language): SecurityPattern[] {
  const allPatterns: SecurityPattern[] = [];
  
  Object.values(securityPatterns).forEach(patterns => {
    patterns.forEach(pattern => {
      if (pattern.languages.includes(language) || pattern.languages.includes('generic')) {
        allPatterns.push(pattern);
      }
    });
  });
  
  return allPatterns;
}

/**
 * Get patterns by vulnerability type
 */
export function getPatternsByType(type: VulnerabilityType): SecurityPattern[] {
  return securityPatterns[type] || [];
}

/**
 * Get all patterns
 */
export function getAllPatterns(): SecurityPattern[] {
  const allPatterns: SecurityPattern[] = [];
  Object.values(securityPatterns).forEach(patterns => {
    allPatterns.push(...patterns);
  });
  return allPatterns;
}

// Made with Bob