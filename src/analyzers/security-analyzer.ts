/**
 * Security Analyzer
 * Analyzes code for security vulnerabilities using pattern matching and heuristics
 */

import {
  SecurityPattern,
  VulnerabilityType,
  securityPatterns,
  getAllPatterns,
  getPatternsForLanguage,
  Language as PatternLanguage
} from './patterns/security-patterns';
import {
  detectLanguage,
  extractFunctions,
  extractImports,
  getLineContext,
  isInComment,
  removeComments,
  Language as ParserLanguage
} from './utils/code-parser';
import {
  SecurityVulnerability,
  SecurityAnalysisResult,
  PatternMatch,
  Severity
} from '../types';

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface AnalyzerOptions {
  skipComments?: boolean;
  minConfidence?: number;
  maxVulnerabilitiesPerFile?: number;
  contextLines?: number;
}

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line: number;
  file: string;
}

/**
 * Main Security Analyzer Class
 * Scans code for security vulnerabilities across multiple languages
 */
export class SecurityAnalyzer {
  private options: Required<AnalyzerOptions>;

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      skipComments: options.skipComments ?? true,
      minConfidence: options.minConfidence ?? 0.5,
      maxVulnerabilitiesPerFile: options.maxVulnerabilitiesPerFile ?? 100,
      contextLines: options.contextLines ?? 3
    };
  }

  /**
   * Analyze code for security issues
   * Main entry point for security analysis
   */
  async analyze(code: string, filename: string): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    const language = this.detectLanguageFromFilename(filename);
    
    // Get code without comments if option is enabled
    const codeToAnalyze = this.options.skipComments 
      ? removeComments(code, language)
      : code;

    // Find all vulnerabilities
    const vulnerabilities = await this.findVulnerabilities(
      codeToAnalyze,
      code, // Keep original for context
      filename,
      language
    );

    // Filter by confidence threshold
    const filteredVulnerabilities = vulnerabilities.filter(
      v => v.confidence >= this.options.minConfidence
    );

    // Limit number of vulnerabilities
    const limitedVulnerabilities = filteredVulnerabilities.slice(
      0,
      this.options.maxVulnerabilitiesPerFile
    );

    // Calculate summary
    const summary = this.calculateSummary(limitedVulnerabilities);

    const analysisTime = Date.now() - startTime;
    const linesAnalyzed = code.split('\n').length;

    return {
      file: filename,
      language,
      vulnerabilities: limitedVulnerabilities,
      summary,
      analysisTime,
      linesAnalyzed
    };
  }

  /**
   * Find all vulnerabilities in code
   */
  private async findVulnerabilities(
    code: string,
    originalCode: string,
    filename: string,
    language: ParserLanguage
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const patternLanguage = this.mapLanguage(language);
    
    // Get applicable patterns for this language
    const patterns = getPatternsForLanguage(patternLanguage);

    // Scan with each pattern
    for (const pattern of patterns) {
      const matches = this.findPatternMatches(code, pattern, originalCode, language);
      
      for (const match of matches) {
        const vulnerability = this.createVulnerability(
          match,
          pattern,
          filename,
          originalCode
        );
        
        vulnerabilities.push(vulnerability);
      }
    }

    // Remove duplicates (same line, same type)
    return this.deduplicateVulnerabilities(vulnerabilities);
  }

  /**
   * Find matches for a specific pattern
   */
  private findPatternMatches(
    code: string,
    pattern: SecurityPattern,
    originalCode: string,
    language: ParserLanguage
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Skip if line is in a comment (using original code for accurate detection)
      if (this.options.skipComments && isInComment(originalCode, i + 1, language)) {
        continue;
      }

      // Try to match the pattern
      const regex = new RegExp(pattern.pattern);
      const match = line.match(regex);

      if (match) {
        // Check for false positive indicators
        if (this.isFalsePositive(line, pattern)) {
          continue;
        }

        matches.push({
          patternId: pattern.id,
          line: i + 1,
          column: match.index || 0,
          matchedText: match[0] || '',
          confidence: pattern.confidence
        });
      }
    }

    return matches;
  }

  /**
   * Check if a match is likely a false positive
   */
  private isFalsePositive(line: string, pattern: SecurityPattern): boolean {
    if (!pattern.falsePositiveIndicators) {
      return false;
    }

    for (const indicator of pattern.falsePositiveIndicators) {
      if (indicator.test(line)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create a vulnerability object from a pattern match
   */
  private createVulnerability(
    match: PatternMatch,
    pattern: SecurityPattern,
    filename: string,
    originalCode: string
  ): SecurityVulnerability {
    const context = getLineContext(originalCode, match.line, this.options.contextLines);
    const lines = originalCode.split('\n');
    const codeLine = lines[match.line - 1] || '';

    return {
      id: generateId(),
      type: this.extractVulnerabilityType(pattern.id),
      severity: pattern.severity,
      title: pattern.name,
      description: pattern.description,
      file: filename,
      line: match.line,
      column: match.column,
      code: codeLine.trim(),
      confidence: match.confidence,
      cwe: pattern.cwe,
      owasp: pattern.owasp,
      fixSuggestion: pattern.fixSuggestion,
      context,
      patternId: pattern.id
    };
  }

  /**
   * Extract vulnerability type from pattern ID
   */
  private extractVulnerabilityType(patternId: string): VulnerabilityType {
    if (patternId.includes('sql-injection')) return 'sql_injection';
    if (patternId.includes('xss')) return 'xss';
    if (patternId.includes('hardcoded')) return 'hardcoded_secret';
    if (patternId.includes('path-traversal')) return 'path_traversal';
    if (patternId.includes('command-injection')) return 'command_injection';
    if (patternId.includes('crypto') || patternId.includes('hash') || patternId.includes('cipher')) {
      return 'insecure_crypto';
    }
    if (patternId.includes('ssrf')) return 'ssrf';
    if (patternId.includes('deserialization')) return 'insecure_deserialization';
    
    // Default fallback
    return 'xss';
  }

  /**
   * Remove duplicate vulnerabilities
   */
  private deduplicateVulnerabilities(
    vulnerabilities: SecurityVulnerability[]
  ): SecurityVulnerability[] {
    const seen = new Set<string>();
    const unique: SecurityVulnerability[] = [];

    for (const vuln of vulnerabilities) {
      const key = `${vuln.file}:${vuln.line}:${vuln.type}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(vuln);
      }
    }

    return unique;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(vulnerabilities: SecurityVulnerability[]): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const summary = {
      total: vulnerabilities.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical':
          summary.critical++;
          break;
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
      }
    }

    return summary;
  }

  /**
   * Detect language from filename
   */
  private detectLanguageFromFilename(filename: string): ParserLanguage {
    return detectLanguage(filename);
  }

  /**
   * Map parser language to pattern language
   */
  private mapLanguage(language: ParserLanguage): PatternLanguage {
    const mapping: Record<ParserLanguage, PatternLanguage> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'go': 'go',
      'unknown': 'generic'
    };

    return mapping[language] || 'generic';
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  private checkSQLInjection(code: string, filename: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const patterns = securityPatterns.sql_injection;
    const lines = code.split('\n');

    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (pattern.pattern.test(line)) {
          issues.push({
            id: generateId(),
            severity: pattern.severity,
            message: `${pattern.name}: ${pattern.description}`,
            line: i + 1,
            file: filename
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check for XSS vulnerabilities
   */
  private checkXSS(code: string, filename: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const patterns = securityPatterns.xss;
    const lines = code.split('\n');

    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (pattern.pattern.test(line)) {
          issues.push({
            id: generateId(),
            severity: pattern.severity,
            message: `${pattern.name}: ${pattern.description}`,
            line: i + 1,
            file: filename
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check for hardcoded secrets
   */
  private checkHardcodedSecrets(code: string, filename: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const patterns = securityPatterns.hardcoded_secret;
    const lines = code.split('\n');

    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (pattern.pattern.test(line)) {
          // Additional check for false positives
          if (pattern.falsePositiveIndicators) {
            let isFalsePositive = false;
            for (const fpPattern of pattern.falsePositiveIndicators) {
              if (fpPattern.test(line)) {
                isFalsePositive = true;
                break;
              }
            }
            if (isFalsePositive) continue;
          }

          issues.push({
            id: generateId(),
            severity: pattern.severity,
            message: `${pattern.name}: ${pattern.description}`,
            line: i + 1,
            file: filename
          });
        }
      }
    }

    return issues;
  }

  /**
   * Analyze multiple files
   */
  async analyzeFiles(
    files: Array<{ filename: string; content: string }>
  ): Promise<SecurityAnalysisResult[]> {
    const results: SecurityAnalysisResult[] = [];

    for (const file of files) {
      try {
        const result = await this.analyze(file.content, file.filename);
        results.push(result);
      } catch (error) {
        // Log error but continue with other files
        // Error is silently caught to allow processing of remaining files
      }
    }

    return results;
  }

  /**
   * Get vulnerability statistics across multiple results
   */
  getOverallStatistics(results: SecurityAnalysisResult[]): {
    totalFiles: number;
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    averageConfidence: number;
    mostCommonTypes: Array<{ type: VulnerabilityType; count: number }>;
  } {
    const stats = {
      totalFiles: results.length,
      totalVulnerabilities: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      averageConfidence: 0,
      mostCommonTypes: [] as Array<{ type: VulnerabilityType; count: number }>
    };

    const typeCount = new Map<VulnerabilityType, number>();
    let totalConfidence = 0;
    let vulnerabilityCount = 0;

    for (const result of results) {
      stats.totalVulnerabilities += result.summary.total;
      stats.criticalCount += result.summary.critical;
      stats.highCount += result.summary.high;
      stats.mediumCount += result.summary.medium;
      stats.lowCount += result.summary.low;

      for (const vuln of result.vulnerabilities) {
        totalConfidence += vuln.confidence;
        vulnerabilityCount++;

        const currentCount = typeCount.get(vuln.type) || 0;
        typeCount.set(vuln.type, currentCount + 1);
      }
    }

    stats.averageConfidence = vulnerabilityCount > 0 
      ? totalConfidence / vulnerabilityCount 
      : 0;

    // Sort types by count
    stats.mostCommonTypes = Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return stats;
  }
}

export default SecurityAnalyzer;

// Made with Bob
