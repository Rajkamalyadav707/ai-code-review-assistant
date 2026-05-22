/**
 * Performance Analyzer
 * Analyzes code for performance issues, inefficient algorithms, and optimization opportunities
 */

import {
  PerformancePattern,
  PerformanceCategory,
  PerformanceImpact,
  BigOComplexity,
  getAllPatterns,
  getPatternsForLanguage,
  getPatternsByCategory,
  Language as PatternLanguage
} from './patterns/performance-patterns';
import {
  analyzeAlgorithmComplexity,
  detectNestedLoops,
  detectRecursion,
  detectInefficientOperations,
  suggestAlgorithmicImprovements,
  getComplexityScore,
  ComplexityAnalysis,
  LoopInfo,
  RecursionInfo
} from './utils/algorithm-analyzer';
import {
  detectLanguage,
  getLineContext,
  isInComment,
  removeComments,
  Language as ParserLanguage
} from './utils/code-parser';
import { Severity } from '../types';

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface AnalyzerOptions {
  skipComments?: boolean;
  maxIssuesPerFile?: number;
  contextLines?: number;
  checkAlgorithms?: boolean;
  checkMemory?: boolean;
  checkDatabase?: boolean;
  checkNetwork?: boolean;
  checkRendering?: boolean;
  checkResources?: boolean;
}

export interface PerformanceIssue {
  id: string;
  category: PerformanceCategory;
  severity: Severity;
  impact: PerformanceImpact;
  title: string;
  description: string;
  file: string;
  line: number;
  endLine?: number;
  column?: number;
  code?: string;
  suggestion?: string;
  complexity?: BigOComplexity;
  patternId?: string;
  context?: string;
  example?: {
    before: string;
    after: string;
  };
}

export interface PerformanceAnalysisResult {
  file: string;
  language: string;
  issues: PerformanceIssue[];
  algorithmAnalysis: ComplexityAnalysis;
  summary: PerformanceSummary;
  recommendations: string[];
  performanceScore: number; // 0-100, higher is better
  analysisTime: number;
  linesAnalyzed: number;
}

export interface PerformanceSummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issuesByCategory: Record<PerformanceCategory, number>;
  issuesByImpact: Record<PerformanceImpact, number>;
  overallComplexity: BigOComplexity;
  hasNestedLoops: boolean;
  hasRecursion: boolean;
  hasMemoryLeaks: boolean;
}

export interface PatternMatch {
  patternId: string;
  line: number;
  column: number;
  matchedText: string;
}

/**
 * Main Performance Analyzer Class
 * Analyzes code for performance issues across multiple dimensions
 */
export class PerformanceAnalyzer {
  private options: Required<AnalyzerOptions>;

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      skipComments: options.skipComments ?? true,
      maxIssuesPerFile: options.maxIssuesPerFile ?? 100,
      contextLines: options.contextLines ?? 3,
      checkAlgorithms: options.checkAlgorithms ?? true,
      checkMemory: options.checkMemory ?? true,
      checkDatabase: options.checkDatabase ?? true,
      checkNetwork: options.checkNetwork ?? true,
      checkRendering: options.checkRendering ?? true,
      checkResources: options.checkResources ?? true
    };
  }

  /**
   * Analyze code for performance issues
   * Main entry point for performance analysis
   */
  async analyze(code: string, filename: string): Promise<PerformanceAnalysisResult> {
    const startTime = Date.now();
    const language = this.detectLanguageFromFilename(filename);
    
    // Get code without comments if option is enabled
    const codeToAnalyze = this.options.skipComments 
      ? removeComments(code, language)
      : code;

    // Perform algorithm analysis
    const algorithmAnalysis = analyzeAlgorithmComplexity(codeToAnalyze, language);

    // Find all performance issues
    const issues = await this.findPerformanceIssues(
      codeToAnalyze,
      code, // Keep original for context
      filename,
      language,
      algorithmAnalysis
    );

    // Limit number of issues
    const limitedIssues = issues.slice(0, this.options.maxIssuesPerFile);

    // Calculate summary
    const summary = this.calculateSummary(limitedIssues, algorithmAnalysis);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      algorithmAnalysis,
      limitedIssues,
      code
    );

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(
      algorithmAnalysis,
      limitedIssues
    );

    const analysisTime = Date.now() - startTime;
    const linesAnalyzed = code.split('\n').length;

    return {
      file: filename,
      language,
      issues: limitedIssues,
      algorithmAnalysis,
      summary,
      recommendations,
      performanceScore,
      analysisTime,
      linesAnalyzed
    };
  }

  /**
   * Find all performance issues in code
   */
  private async findPerformanceIssues(
    code: string,
    originalCode: string,
    filename: string,
    language: ParserLanguage,
    algorithmAnalysis: ComplexityAnalysis
  ): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];
    const patternLanguage = this.mapLanguage(language);
    
    // Get applicable patterns for this language
    const patterns = getPatternsForLanguage(patternLanguage);

    // Scan with each pattern based on options
    for (const pattern of patterns) {
      if (!this.shouldCheckPattern(pattern)) {
        continue;
      }

      const matches = this.findPatternMatches(code, pattern, originalCode, language);
      
      for (const match of matches) {
        const issue = this.createPerformanceIssue(
          match,
          pattern,
          filename,
          originalCode
        );
        
        issues.push(issue);
      }
    }

    // Add algorithm-based issues
    if (this.options.checkAlgorithms) {
      issues.push(...this.createAlgorithmIssues(
        filename,
        algorithmAnalysis,
        originalCode
      ));
    }

    // Remove duplicates
    return this.deduplicateIssues(issues);
  }

  /**
   * Check if pattern should be analyzed based on options
   */
  private shouldCheckPattern(pattern: PerformancePattern): boolean {
    const categoryChecks: Record<PerformanceCategory, boolean> = {
      algorithm: this.options.checkAlgorithms,
      memory: this.options.checkMemory,
      database: this.options.checkDatabase,
      network: this.options.checkNetwork,
      rendering: this.options.checkRendering,
      resource: this.options.checkResources,
      inefficient_pattern: true // Always check
    };

    return categoryChecks[pattern.category] ?? true;
  }

  /**
   * Find matches for a specific pattern
   */
  private findPatternMatches(
    code: string,
    pattern: PerformancePattern,
    originalCode: string,
    language: ParserLanguage
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Skip if line is in a comment
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
   * Create a performance issue object from a pattern match
   */
  private createPerformanceIssue(
    match: PatternMatch,
    pattern: PerformancePattern,
    filename: string,
    originalCode: string
  ): PerformanceIssue {
    const context = getLineContext(originalCode, match.line, this.options.contextLines);
    const lines = originalCode.split('\n');
    const codeLine = lines[match.line - 1] || '';

    return {
      id: generateId(),
      category: pattern.category,
      severity: pattern.severity,
      impact: pattern.impact,
      title: pattern.name,
      description: pattern.description,
      file: filename,
      line: match.line,
      column: match.column,
      code: codeLine.trim(),
      suggestion: pattern.fixSuggestion,
      complexity: pattern.complexity,
      patternId: pattern.id,
      context,
      example: pattern.example
    };
  }

  /**
   * Create issues based on algorithm analysis
   */
  private createAlgorithmIssues(
    filename: string,
    analysis: ComplexityAnalysis,
    originalCode: string
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Check for high complexity
    if (analysis.timeComplexity === 'O(n³)' || analysis.timeComplexity === 'O(2ⁿ)' || analysis.timeComplexity === 'O(n!)') {
      issues.push({
        id: generateId(),
        category: 'algorithm',
        severity: 'high',
        impact: 'high',
        title: `High Time Complexity: ${analysis.timeComplexity}`,
        description: `Code has ${analysis.timeComplexity} time complexity, which may cause performance issues with large datasets`,
        file: filename,
        line: 1,
        suggestion: 'Consider using more efficient algorithms or data structures (hash maps, binary search, dynamic programming)',
        complexity: analysis.timeComplexity
      });
    } else if (analysis.timeComplexity === 'O(n²)') {
      issues.push({
        id: generateId(),
        category: 'algorithm',
        severity: 'medium',
        impact: 'medium',
        title: `Quadratic Time Complexity: ${analysis.timeComplexity}`,
        description: `Code has O(n²) time complexity. Consider optimization for large datasets`,
        file: filename,
        line: 1,
        suggestion: 'Use hash maps or sets to reduce nested loop complexity',
        complexity: analysis.timeComplexity
      });
    }

    // Check for deeply nested loops
    if (analysis.maxNestingLevel >= 3) {
      const deepestLoop = analysis.nestedLoops.find(l => l.nestingLevel === analysis.maxNestingLevel);
      if (deepestLoop) {
        issues.push({
          id: generateId(),
          category: 'algorithm',
          severity: 'high',
          impact: 'high',
          title: `Deeply Nested Loops (${analysis.maxNestingLevel} levels)`,
          description: `Found ${analysis.maxNestingLevel} levels of nested loops, resulting in poor performance`,
          file: filename,
          line: deepestLoop.startLine,
          suggestion: 'Refactor to reduce nesting depth using hash maps, early returns, or helper functions',
          context: getLineContext(originalCode, deepestLoop.startLine, 2)
        });
      }
    }

    // Check for recursion without base case
    for (const recursion of analysis.recursiveCalls) {
      if (recursion.potentialStackOverflow) {
        issues.push({
          id: generateId(),
          category: 'algorithm',
          severity: 'high',
          impact: 'high',
          title: `Potential Stack Overflow in ${recursion.functionName}`,
          description: `Recursive function '${recursion.functionName}' may not have a proper base case`,
          file: filename,
          line: recursion.line,
          suggestion: 'Ensure recursive function has a clear base case to prevent stack overflow',
          context: getLineContext(originalCode, recursion.line, 2)
        });
      }
    }

    // Add inefficient operations
    for (const op of analysis.inefficientOperations) {
      issues.push({
        id: generateId(),
        category: 'inefficient_pattern',
        severity: 'medium',
        impact: 'medium',
        title: `Inefficient Operation: ${op.operation}`,
        description: op.reason,
        file: filename,
        line: op.line,
        suggestion: op.suggestion || undefined
      });
    }

    return issues;
  }

  /**
   * Remove duplicate issues
   */
  private deduplicateIssues(issues: PerformanceIssue[]): PerformanceIssue[] {
    const seen = new Set<string>();
    const unique: PerformanceIssue[] = [];

    for (const issue of issues) {
      const key = `${issue.file}:${issue.line}:${issue.category}:${issue.title}`;
      
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
  private calculateSummary(
    issues: PerformanceIssue[],
    algorithmAnalysis: ComplexityAnalysis
  ): PerformanceSummary {
    const summary: PerformanceSummary = {
      totalIssues: issues.length,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      issuesByCategory: {
        algorithm: 0,
        memory: 0,
        database: 0,
        network: 0,
        rendering: 0,
        resource: 0,
        inefficient_pattern: 0
      },
      issuesByImpact: {
        low: 0,
        medium: 0,
        high: 0
      },
      overallComplexity: algorithmAnalysis.timeComplexity,
      hasNestedLoops: algorithmAnalysis.nestedLoops.length > 0,
      hasRecursion: algorithmAnalysis.recursiveCalls.length > 0,
      hasMemoryLeaks: false
    };

    for (const issue of issues) {
      // Count by severity
      switch (issue.severity) {
        case 'critical':
          summary.criticalCount++;
          break;
        case 'high':
          summary.highCount++;
          break;
        case 'medium':
          summary.mediumCount++;
          break;
        case 'low':
          summary.lowCount++;
          break;
      }

      // Count by category
      summary.issuesByCategory[issue.category]++;

      // Count by impact
      summary.issuesByImpact[issue.impact]++;

      // Check for memory leaks
      if (issue.category === 'memory' && issue.severity === 'high') {
        summary.hasMemoryLeaks = true;
      }
    }

    return summary;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    algorithmAnalysis: ComplexityAnalysis,
    issues: PerformanceIssue[],
    code: string
  ): string[] {
    const recommendations: string[] = [];

    // Algorithm recommendations
    const algorithmSuggestions = suggestAlgorithmicImprovements(
      algorithmAnalysis.timeComplexity,
      algorithmAnalysis.nestedLoops,
      code
    );
    recommendations.push(...algorithmSuggestions);

    // Category-specific recommendations
    const categoryIssues = this.groupIssuesByCategory(issues);

    if (categoryIssues.database > 0) {
      recommendations.push('Consider implementing database query optimization and proper indexing');
      recommendations.push('Use connection pooling to manage database connections efficiently');
    }

    if (categoryIssues.memory > 0) {
      recommendations.push('Implement proper cleanup for event listeners and timers');
      recommendations.push('Use weak references where appropriate to prevent memory leaks');
    }

    if (categoryIssues.network > 0) {
      recommendations.push('Implement caching strategies for frequently accessed data');
      recommendations.push('Use Promise.all() for parallel API requests when possible');
    }

    if (categoryIssues.rendering > 0) {
      recommendations.push('Batch DOM operations to minimize reflows and repaints');
      recommendations.push('Use virtual scrolling for large lists');
    }

    if (categoryIssues.resource > 0) {
      recommendations.push('Always close file handles and database connections');
      recommendations.push('Use try-finally or context managers to ensure cleanup');
    }

    // Complexity-based recommendations
    if (algorithmAnalysis.maxNestingLevel >= 2) {
      recommendations.push('Reduce loop nesting by extracting inner loops into separate functions');
    }

    if (algorithmAnalysis.recursiveCalls.length > 0) {
      recommendations.push('Consider iterative alternatives to recursion for better performance');
      recommendations.push('Implement memoization for recursive functions with overlapping subproblems');
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Group issues by category
   */
  private groupIssuesByCategory(issues: PerformanceIssue[]): Record<PerformanceCategory, number> {
    const grouped: Record<PerformanceCategory, number> = {
      algorithm: 0,
      memory: 0,
      database: 0,
      network: 0,
      rendering: 0,
      resource: 0,
      inefficient_pattern: 0
    };

    for (const issue of issues) {
      grouped[issue.category]++;
    }

    return grouped;
  }

  /**
   * Calculate overall performance score (0-100, higher is better)
   */
  private calculatePerformanceScore(
    algorithmAnalysis: ComplexityAnalysis,
    issues: PerformanceIssue[]
  ): number {
    let score = 100;

    // Deduct for complexity
    const complexityScore = getComplexityScore(algorithmAnalysis.timeComplexity);
    score -= (100 - complexityScore) * 0.4; // 40% weight

    // Deduct for issues by severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 10;
          break;
        case 'high':
          score -= 5;
          break;
        case 'medium':
          score -= 2;
          break;
        case 'low':
          score -= 0.5;
          break;
      }
    }

    // Deduct for nested loops
    score -= Math.min(20, algorithmAnalysis.maxNestingLevel * 5);

    // Deduct for recursion issues
    const recursionIssues = algorithmAnalysis.recursiveCalls.filter(r => r.potentialStackOverflow);
    score -= recursionIssues.length * 10;

    return Math.max(0, Math.min(100, Math.round(score)));
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
  ): Promise<PerformanceAnalysisResult[]> {
    const results: PerformanceAnalysisResult[] = [];

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
  getOverallStatistics(results: PerformanceAnalysisResult[]): {
    totalFiles: number;
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    averagePerformanceScore: number;
    filesWithHighComplexity: number;
    filesWithMemoryLeaks: number;
    mostCommonIssues: Array<{ category: PerformanceCategory; count: number }>;
    averageComplexityScore: number;
  } {
    const stats = {
      totalFiles: results.length,
      totalIssues: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      averagePerformanceScore: 0,
      filesWithHighComplexity: 0,
      filesWithMemoryLeaks: 0,
      mostCommonIssues: [] as Array<{ category: PerformanceCategory; count: number }>,
      averageComplexityScore: 0
    };

    const categoryCount = new Map<PerformanceCategory, number>();
    let totalScore = 0;
    let totalComplexityScore = 0;

    for (const result of results) {
      stats.totalIssues += result.summary.totalIssues;
      stats.criticalCount += result.summary.criticalCount;
      stats.highCount += result.summary.highCount;
      stats.mediumCount += result.summary.mediumCount;
      stats.lowCount += result.summary.lowCount;
      totalScore += result.performanceScore;

      const complexityScore = getComplexityScore(result.algorithmAnalysis.timeComplexity);
      totalComplexityScore += complexityScore;

      if (complexityScore < 60) {
        stats.filesWithHighComplexity++;
      }

      if (result.summary.hasMemoryLeaks) {
        stats.filesWithMemoryLeaks++;
      }

      // Count issues by category
      for (const issue of result.issues) {
        const currentCount = categoryCount.get(issue.category) || 0;
        categoryCount.set(issue.category, currentCount + 1);
      }
    }

    stats.averagePerformanceScore = results.length > 0 
      ? Math.round(totalScore / results.length) 
      : 0;

    stats.averageComplexityScore = results.length > 0
      ? Math.round(totalComplexityScore / results.length)
      : 0;

    // Sort categories by count
    stats.mostCommonIssues = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return stats;
  }
}

export default PerformanceAnalyzer;

// Made with Bob
