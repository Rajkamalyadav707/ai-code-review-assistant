/**
 * Quality Analyzer
 * Analyzes code for quality issues, maintainability problems, and best practice violations
 */

import {
  QualityPattern,
  QualityIssueType,
  qualityPatterns,
  getAllPatterns,
  getPatternsForLanguage,
  qualityThresholds,
  Language as PatternLanguage
} from './patterns/quality-patterns';
import {
  detectLanguage,
  extractFunctions,
  getLineContext,
  isInComment,
  removeComments,
  Language as ParserLanguage
} from './utils/code-parser';
import {
  calculateComplexityMetrics,
  calculateFunctionComplexities,
  getComplexityGrade,
  getMaintainabilityGrade,
  ComplexityMetrics,
  FunctionComplexity
} from './utils/complexity-calculator';
import {
  calculateCodeMetrics,
  checkMetricThresholds,
  CodeMetrics,
  MetricThresholdViolation
} from './utils/code-metrics';
import { Severity } from '../types';

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface AnalyzerOptions {
  skipComments?: boolean;
  minConfidence?: number;
  maxIssuesPerFile?: number;
  contextLines?: number;
  checkComplexity?: boolean;
  checkDuplication?: boolean;
  checkNaming?: boolean;
  checkStyle?: boolean;
}

export interface QualityIssue {
  id: string;
  type: QualityIssueType;
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line: number;
  endLine?: number;
  column?: number;
  code?: string;
  suggestion?: string;
  category: string;
  patternId?: string;
  context?: string;
}

export interface QualityAnalysisResult {
  file: string;
  language: string;
  issues: QualityIssue[];
  metrics: CodeMetrics;
  complexity: ComplexityMetrics;
  functionComplexities: FunctionComplexity[];
  summary: QualitySummary;
  grade: QualityGrade;
  analysisTime: number;
  linesAnalyzed: number;
}

export interface QualitySummary {
  totalIssues: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  issuesByType: Record<QualityIssueType, number>;
  issuesByCategory: Record<string, number>;
}

export interface QualityGrade {
  overall: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  complexity: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  maintainability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  score: number; // 0-100
}

export interface PatternMatch {
  patternId: string;
  line: number;
  column: number;
  matchedText: string;
}

/**
 * Main Quality Analyzer Class
 * Analyzes code for quality issues, complexity, and maintainability
 */
export class QualityAnalyzer {
  private options: Required<AnalyzerOptions>;

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      skipComments: options.skipComments ?? true,
      minConfidence: options.minConfidence ?? 0.5,
      maxIssuesPerFile: options.maxIssuesPerFile ?? 100,
      contextLines: options.contextLines ?? 3,
      checkComplexity: options.checkComplexity ?? true,
      checkDuplication: options.checkDuplication ?? true,
      checkNaming: options.checkNaming ?? true,
      checkStyle: options.checkStyle ?? true
    };
  }

  /**
   * Analyze code for quality issues
   * Main entry point for quality analysis
   */
  async analyze(code: string, filename: string): Promise<QualityAnalysisResult> {
    const startTime = Date.now();
    const language = this.detectLanguageFromFilename(filename);
    
    // Calculate metrics first
    const metrics = calculateCodeMetrics(code, language);
    const complexity = calculateComplexityMetrics(
      code,
      language,
      metrics.linesOfCode,
      metrics.commentRatio,
      0 // Will update with issue count later
    );
    const functionComplexities = calculateFunctionComplexities(code, language);
    
    // Get code without comments if option is enabled
    const codeToAnalyze = this.options.skipComments 
      ? removeComments(code, language)
      : code;

    // Find all quality issues
    const issues = await this.findQualityIssues(
      codeToAnalyze,
      code, // Keep original for context
      filename,
      language,
      metrics,
      complexity,
      functionComplexities
    );

    // Limit number of issues
    const limitedIssues = issues.slice(0, this.options.maxIssuesPerFile);

    // Calculate summary
    const summary = this.calculateSummary(limitedIssues);
    
    // Calculate grade
    const grade = this.calculateGrade(complexity, metrics, limitedIssues.length);

    const analysisTime = Date.now() - startTime;
    const linesAnalyzed = code.split('\n').length;

    return {
      file: filename,
      language,
      issues: limitedIssues,
      metrics,
      complexity,
      functionComplexities,
      summary,
      grade,
      analysisTime,
      linesAnalyzed
    };
  }

  /**
   * Find all quality issues in code
   */
  private async findQualityIssues(
    code: string,
    originalCode: string,
    filename: string,
    language: ParserLanguage,
    metrics: CodeMetrics,
    complexity: ComplexityMetrics,
    functionComplexities: FunctionComplexity[]
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const patternLanguage = this.mapLanguage(language);
    
    // Get applicable patterns for this language
    const patterns = getPatternsForLanguage(patternLanguage);

    // Scan with each pattern
    for (const pattern of patterns) {
      // Skip patterns based on options
      if (!this.shouldCheckPattern(pattern)) {
        continue;
      }

      const matches = this.findPatternMatches(code, pattern, originalCode, language);
      
      for (const match of matches) {
        const issue = this.createQualityIssue(
          match,
          pattern,
          filename,
          originalCode
        );
        
        issues.push(issue);
      }
    }

    // Add complexity-based issues
    if (this.options.checkComplexity) {
      issues.push(...this.checkComplexityIssues(
        filename,
        complexity,
        functionComplexities,
        originalCode
      ));
    }

    // Add metric-based issues
    issues.push(...this.checkMetricIssues(filename, metrics, originalCode));

    // Remove duplicates (same line, same type)
    return this.deduplicateIssues(issues);
  }

  /**
   * Check if pattern should be analyzed based on options
   */
  private shouldCheckPattern(pattern: QualityPattern): boolean {
    if (!this.options.checkNaming && pattern.type === 'naming') {
      return false;
    }
    if (!this.options.checkStyle && pattern.type === 'style') {
      return false;
    }
    return true;
  }

  /**
   * Find matches for a specific pattern
   */
  private findPatternMatches(
    code: string,
    pattern: QualityPattern,
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
        matches.push({
          patternId: pattern.id,
          line: i + 1,
          column: match.index || 0,
          matchedText: match[0] || ''
        });
      }
    }

    return matches;
  }

  /**
   * Create a quality issue object from a pattern match
   */
  private createQualityIssue(
    match: PatternMatch,
    pattern: QualityPattern,
    filename: string,
    originalCode: string
  ): QualityIssue {
    const context = getLineContext(originalCode, match.line, this.options.contextLines);
    const lines = originalCode.split('\n');
    const codeLine = lines[match.line - 1] || '';

    return {
      id: generateId(),
      type: pattern.type,
      severity: this.mapSeverity(pattern.severity),
      title: pattern.name,
      description: pattern.description,
      file: filename,
      line: match.line,
      column: match.column,
      code: codeLine.trim(),
      suggestion: pattern.fixSuggestion,
      category: pattern.category,
      patternId: pattern.id,
      context
    };
  }

  /**
   * Check for complexity-based issues
   */
  private checkComplexityIssues(
    filename: string,
    complexity: ComplexityMetrics,
    functionComplexities: FunctionComplexity[],
    originalCode: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check overall cyclomatic complexity
    if (complexity.cyclomaticComplexity > qualityThresholds.maxCyclomaticComplexity) {
      issues.push({
        id: generateId(),
        type: 'complexity',
        severity: 'medium',
        title: 'High Cyclomatic Complexity',
        description: `File has high cyclomatic complexity (${complexity.cyclomaticComplexity})`,
        file: filename,
        line: 1,
        suggestion: 'Break down complex logic into smaller, more manageable functions',
        category: 'complexity'
      });
    }

    // Check overall cognitive complexity
    if (complexity.cognitiveComplexity > qualityThresholds.maxCognitiveComplexity) {
      issues.push({
        id: generateId(),
        type: 'complexity',
        severity: 'medium',
        title: 'High Cognitive Complexity',
        description: `File has high cognitive complexity (${complexity.cognitiveComplexity})`,
        file: filename,
        line: 1,
        suggestion: 'Simplify logic and reduce nesting to improve readability',
        category: 'complexity'
      });
    }

    // Check individual function complexities
    for (const func of functionComplexities) {
      if (func.cyclomaticComplexity > qualityThresholds.maxCyclomaticComplexity) {
        issues.push({
          id: generateId(),
          type: 'complexity',
          severity: func.cyclomaticComplexity > 20 ? 'high' : 'medium',
          title: `Complex Function: ${func.name}`,
          description: `Function '${func.name}' has cyclomatic complexity of ${func.cyclomaticComplexity}`,
          file: filename,
          line: func.startLine,
          endLine: func.endLine,
          suggestion: 'Break this function into smaller, more focused functions',
          category: 'complexity',
          context: getLineContext(originalCode, func.startLine, 2)
        });
      }

      if (func.length > qualityThresholds.maxFunctionLength) {
        issues.push({
          id: generateId(),
          type: 'code_smell',
          severity: func.length > 100 ? 'high' : 'medium',
          title: `Long Function: ${func.name}`,
          description: `Function '${func.name}' is ${func.length} lines long`,
          file: filename,
          line: func.startLine,
          endLine: func.endLine,
          suggestion: `Functions should be under ${qualityThresholds.maxFunctionLength} lines. Extract logic into helper functions`,
          category: 'code_smell'
        });
      }
    }

    return issues;
  }

  /**
   * Check for metric-based issues
   */
  private checkMetricIssues(
    filename: string,
    metrics: CodeMetrics,
    originalCode: string
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const violations = checkMetricThresholds(metrics);

    for (const violation of violations) {
      issues.push({
        id: generateId(),
        type: 'maintainability',
        severity: this.mapSeverity(violation.severity),
        title: `Metric Violation: ${violation.metric}`,
        description: violation.message,
        file: filename,
        line: 1,
        suggestion: this.getSuggestionForMetric(violation.metric),
        category: 'maintainability'
      });
    }

    // Check for duplicate code blocks
    if (this.options.checkDuplication && metrics.duplicateBlocks.length > 0) {
      for (const block of metrics.duplicateBlocks.slice(0, 5)) { // Limit to top 5
        const firstOccurrence = block.occurrences[0];
        if (!firstOccurrence) continue;

        issues.push({
          id: generateId(),
          type: 'maintainability',
          severity: block.duplicateLineCount > 20 ? 'high' : 'medium',
          title: 'Duplicate Code Block',
          description: `Found duplicate code block (${block.lines.length} lines, ${block.occurrences.length} occurrences)`,
          file: filename,
          line: firstOccurrence.startLine,
          endLine: firstOccurrence.endLine,
          suggestion: 'Extract duplicate code into a reusable function or module',
          category: 'maintainability',
          context: getLineContext(originalCode, firstOccurrence.startLine, 2)
        });
      }
    }

    return issues;
  }

  /**
   * Get suggestion for a specific metric violation
   */
  private getSuggestionForMetric(metric: string): string {
    const suggestions: Record<string, string> = {
      maxFunctionLength: 'Break down long functions into smaller, focused functions',
      totalLines: 'Consider splitting this file into multiple smaller files',
      maxNestingDepth: 'Reduce nesting by using early returns or extracting nested logic',
      maxLineLength: 'Break long lines into multiple lines for better readability',
      commentRatio: 'Add comments to explain complex logic and document public APIs',
      duplicateBlocks: 'Extract duplicate code into reusable functions'
    };
    return suggestions[metric] || 'Review and refactor to improve code quality';
  }

  /**
   * Map pattern severity to Finding severity
   */
  private mapSeverity(severity: 'high' | 'medium' | 'low' | 'info'): Severity {
    const mapping: Record<string, Severity> = {
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'info': 'info'
    };
    return mapping[severity] || 'low';
  }

  /**
   * Remove duplicate issues
   */
  private deduplicateIssues(issues: QualityIssue[]): QualityIssue[] {
    const seen = new Set<string>();
    const unique: QualityIssue[] = [];

    for (const issue of issues) {
      const key = `${issue.file}:${issue.line}:${issue.type}:${issue.title}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(issue);
      }
    }

    return unique;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(issues: QualityIssue[]): QualitySummary {
    const summary: QualitySummary = {
      totalIssues: issues.length,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      issuesByType: {
        complexity: 0,
        code_smell: 0,
        naming: 0,
        style: 0,
        best_practice: 0,
        documentation: 0,
        maintainability: 0
      },
      issuesByCategory: {}
    };

    for (const issue of issues) {
      // Count by severity
      switch (issue.severity) {
        case 'high':
          summary.highCount++;
          break;
        case 'medium':
          summary.mediumCount++;
          break;
        case 'low':
          summary.lowCount++;
          break;
        case 'info':
          summary.infoCount++;
          break;
      }

      // Count by type
      summary.issuesByType[issue.type]++;

      // Count by category
      summary.issuesByCategory[issue.category] = 
        (summary.issuesByCategory[issue.category] || 0) + 1;
    }

    return summary;
  }

  /**
   * Calculate overall quality grade
   */
  private calculateGrade(
    complexity: ComplexityMetrics,
    metrics: CodeMetrics,
    issueCount: number
  ): QualityGrade {
    const complexityGrade = getComplexityGrade(complexity.cyclomaticComplexity);
    const maintainabilityGrade = getMaintainabilityGrade(complexity.maintainabilityIndex);
    
    // Calculate overall score (0-100)
    let score = 100;
    
    // Deduct for complexity
    score -= Math.min(30, complexity.cyclomaticComplexity);
    
    // Deduct for maintainability
    score -= Math.max(0, 100 - complexity.maintainabilityIndex) * 0.3;
    
    // Deduct for issues
    score -= Math.min(30, issueCount * 0.5);
    
    // Deduct for poor metrics
    if (metrics.maxFunctionLength > qualityThresholds.maxFunctionLength) {
      score -= 5;
    }
    if (metrics.maxNestingDepth > qualityThresholds.maxNestingDepth) {
      score -= 5;
    }
    if (metrics.duplicateBlocks.length > 0) {
      score -= Math.min(10, metrics.duplicateBlocks.length * 2);
    }
    
    score = Math.max(0, Math.min(100, score));
    
    // Determine overall grade
    let overall: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    if (score >= 90) overall = 'A';
    else if (score >= 80) overall = 'B';
    else if (score >= 70) overall = 'C';
    else if (score >= 60) overall = 'D';
    else if (score >= 50) overall = 'E';
    else overall = 'F';

    return {
      overall,
      complexity: complexityGrade,
      maintainability: maintainabilityGrade,
      score: Math.round(score)
    };
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
   * Analyze multiple files
   */
  async analyzeFiles(
    files: Array<{ filename: string; content: string }>
  ): Promise<QualityAnalysisResult[]> {
    const results: QualityAnalysisResult[] = [];

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
   * Get overall statistics across multiple results
   */
  getOverallStatistics(results: QualityAnalysisResult[]): {
    totalFiles: number;
    totalIssues: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    averageComplexity: number;
    averageMaintainability: number;
    averageGrade: number;
    gradeDistribution: Record<string, number>;
    mostCommonIssues: Array<{ type: QualityIssueType; count: number }>;
  } {
    const stats = {
      totalFiles: results.length,
      totalIssues: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      averageComplexity: 0,
      averageMaintainability: 0,
      averageGrade: 0,
      gradeDistribution: {} as Record<string, number>,
      mostCommonIssues: [] as Array<{ type: QualityIssueType; count: number }>
    };

    const issueTypeCount = new Map<QualityIssueType, number>();
    let totalComplexity = 0;
    let totalMaintainability = 0;
    let totalGrade = 0;

    for (const result of results) {
      stats.totalIssues += result.summary.totalIssues;
      stats.highCount += result.summary.highCount;
      stats.mediumCount += result.summary.mediumCount;
      stats.lowCount += result.summary.lowCount;
      stats.infoCount += result.summary.infoCount;

      totalComplexity += result.complexity.cyclomaticComplexity;
      totalMaintainability += result.complexity.maintainabilityIndex;
      totalGrade += result.grade.score;

      // Count grade distribution
      stats.gradeDistribution[result.grade.overall] = 
        (stats.gradeDistribution[result.grade.overall] || 0) + 1;

      // Count issue types
      for (const issue of result.issues) {
        const currentCount = issueTypeCount.get(issue.type) || 0;
        issueTypeCount.set(issue.type, currentCount + 1);
      }
    }

    stats.averageComplexity = results.length > 0 
      ? Math.round(totalComplexity / results.length) 
      : 0;
    stats.averageMaintainability = results.length > 0 
      ? Math.round((totalMaintainability / results.length) * 10) / 10
      : 0;
    stats.averageGrade = results.length > 0 
      ? Math.round(totalGrade / results.length) 
      : 0;

    // Sort issue types by count
    stats.mostCommonIssues = Array.from(issueTypeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return stats;
  }
}

export default QualityAnalyzer;

// Made with Bob
