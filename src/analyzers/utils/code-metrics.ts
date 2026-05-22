/**
 * Code Metrics
 * Calculate various code metrics like LOC, SLOC, comments, duplication, etc.
 */

import { Language, extractFunctions } from './code-parser';

export interface CodeMetrics {
  totalLines: number;
  linesOfCode: number; // LOC - all non-empty lines
  sourceLines: number; // SLOC - code lines excluding comments and blanks
  commentLines: number;
  blankLines: number;
  commentRatio: number; // Percentage of comments
  averageLineLength: number;
  maxLineLength: number;
  functionCount: number;
  averageFunctionLength: number;
  maxFunctionLength: number;
  maxNestingDepth: number;
  duplicateBlocks: DuplicateBlock[];
}

export interface DuplicateBlock {
  lines: string[];
  occurrences: Array<{
    startLine: number;
    endLine: number;
  }>;
  duplicateLineCount: number;
}

export interface LineLengthIssue {
  line: number;
  length: number;
  content: string;
}

export interface FunctionMetrics {
  name: string;
  startLine: number;
  endLine: number;
  length: number;
  parameterCount: number;
  nestingDepth: number;
}

/**
 * Calculate lines of code (LOC)
 * Counts all non-empty lines
 */
export function calculateLinesOfCode(code: string): number {
  const lines = code.split('\n');
  return lines.filter(line => line.trim().length > 0).length;
}

/**
 * Calculate source lines of code (SLOC)
 * Counts only code lines, excluding comments and blank lines
 */
export function calculateSourceLines(code: string, language: Language): number {
  const lines = code.split('\n');
  let sourceLines = 0;
  let inMultiLineComment = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip blank lines
    if (trimmedLine.length === 0) {
      continue;
    }
    
    // Handle multi-line comments
    if (language === 'javascript' || language === 'typescript' || language === 'java') {
      if (trimmedLine.includes('/*')) {
        inMultiLineComment = true;
      }
      if (inMultiLineComment) {
        if (trimmedLine.includes('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }
      // Skip single-line comments
      if (trimmedLine.startsWith('//')) {
        continue;
      }
    } else if (language === 'python') {
      // Skip single-line comments
      if (trimmedLine.startsWith('#')) {
        continue;
      }
      // Handle docstrings (simplified)
      if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
        continue;
      }
    }
    
    sourceLines++;
  }
  
  return sourceLines;
}

/**
 * Count comment lines
 */
export function countCommentLines(code: string, language: Language): number {
  const lines = code.split('\n');
  let commentLines = 0;
  let inMultiLineComment = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (language === 'javascript' || language === 'typescript' || language === 'java') {
      // Multi-line comments
      if (trimmedLine.includes('/*')) {
        inMultiLineComment = true;
        commentLines++;
        if (trimmedLine.includes('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }
      if (inMultiLineComment) {
        commentLines++;
        if (trimmedLine.includes('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }
      // Single-line comments
      if (trimmedLine.startsWith('//')) {
        commentLines++;
      }
    } else if (language === 'python') {
      // Single-line comments
      if (trimmedLine.startsWith('#')) {
        commentLines++;
      }
      // Docstrings
      if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
        commentLines++;
      }
    } else if (language === 'go') {
      // Single-line comments
      if (trimmedLine.startsWith('//')) {
        commentLines++;
      }
      // Multi-line comments
      if (trimmedLine.includes('/*')) {
        inMultiLineComment = true;
        commentLines++;
        if (trimmedLine.includes('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }
      if (inMultiLineComment) {
        commentLines++;
        if (trimmedLine.includes('*/')) {
          inMultiLineComment = false;
        }
      }
    }
  }
  
  return commentLines;
}

/**
 * Count blank lines
 */
export function countBlankLines(code: string): number {
  const lines = code.split('\n');
  return lines.filter(line => line.trim().length === 0).length;
}

/**
 * Calculate comment ratio
 */
export function calculateCommentRatio(commentLines: number, totalLines: number): number {
  if (totalLines === 0) return 0;
  return Math.round((commentLines / totalLines) * 1000) / 1000;
}

/**
 * Calculate average line length
 */
export function calculateAverageLineLength(code: string): number {
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return 0;
  
  const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
  return Math.round((totalLength / lines.length) * 10) / 10;
}

/**
 * Find maximum line length
 */
export function findMaxLineLength(code: string): number {
  const lines = code.split('\n');
  return Math.max(...lines.map(line => line.length), 0);
}

/**
 * Find lines exceeding maximum length
 */
export function findLongLines(code: string, maxLength: number = 120): LineLengthIssue[] {
  const lines = code.split('\n');
  const issues: LineLengthIssue[] = [];
  
  lines.forEach((line, index) => {
    if (line.length > maxLength) {
      issues.push({
        line: index + 1,
        length: line.length,
        content: line.substring(0, 100) + (line.length > 100 ? '...' : '')
      });
    }
  });
  
  return issues;
}

/**
 * Calculate maximum nesting depth
 */
export function calculateMaxNestingDepth(code: string, language: Language): number {
  const lines = code.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Count opening braces/blocks
    if (language === 'python') {
      // Python uses indentation
      const indent = line.match(/^\s*/)?.[0].length || 0;
      const indentLevel = Math.floor(indent / 4); // Assuming 4-space indentation
      currentDepth = indentLevel;
    } else {
      // Other languages use braces
      const openBraces = (trimmedLine.match(/\{/g) || []).length;
      const closeBraces = (trimmedLine.match(/\}/g) || []).length;
      currentDepth += openBraces - closeBraces;
    }
    
    maxDepth = Math.max(maxDepth, currentDepth);
  }
  
  return maxDepth;
}

/**
 * Calculate function metrics
 */
export function calculateFunctionMetrics(code: string, language: Language): FunctionMetrics[] {
  const functions = extractFunctions(code, language);
  const lines = code.split('\n');
  const metrics: FunctionMetrics[] = [];
  
  for (const func of functions) {
    const functionCode = lines.slice(func.startLine - 1, func.endLine).join('\n');
    const nestingDepth = calculateMaxNestingDepth(functionCode, language);
    
    metrics.push({
      name: func.name,
      startLine: func.startLine,
      endLine: func.endLine,
      length: func.endLine - func.startLine + 1,
      parameterCount: func.params.length,
      nestingDepth
    });
  }
  
  return metrics;
}

/**
 * Detect duplicate code blocks
 * Finds sequences of identical lines that appear multiple times
 */
export function detectDuplicateCode(code: string, minLines: number = 6): DuplicateBlock[] {
  const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const duplicates: DuplicateBlock[] = [];
  const seen = new Map<string, Array<{ startLine: number; endLine: number }>>();
  
  // Look for duplicate sequences
  for (let i = 0; i < lines.length - minLines + 1; i++) {
    const sequence = lines.slice(i, i + minLines).join('\n');
    
    // Skip if sequence is too short or contains only simple statements
    if (sequence.length < 50) continue;
    
    const occurrences = seen.get(sequence) || [];
    occurrences.push({
      startLine: i + 1,
      endLine: i + minLines
    });
    seen.set(sequence, occurrences);
  }
  
  // Filter to only sequences that appear more than once
  for (const [sequence, occurrences] of seen.entries()) {
    if (occurrences.length > 1) {
      duplicates.push({
        lines: sequence.split('\n'),
        occurrences,
        duplicateLineCount: minLines * (occurrences.length - 1)
      });
    }
  }
  
  // Sort by duplicate line count (most duplicated first)
  duplicates.sort((a, b) => b.duplicateLineCount - a.duplicateLineCount);
  
  return duplicates;
}

/**
 * Calculate comprehensive code metrics
 */
export function calculateCodeMetrics(code: string, language: Language): CodeMetrics {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const linesOfCode = calculateLinesOfCode(code);
  const sourceLines = calculateSourceLines(code, language);
  const commentLines = countCommentLines(code, language);
  const blankLines = countBlankLines(code);
  const commentRatio = calculateCommentRatio(commentLines, totalLines);
  const averageLineLength = calculateAverageLineLength(code);
  const maxLineLength = findMaxLineLength(code);
  const maxNestingDepth = calculateMaxNestingDepth(code, language);
  const duplicateBlocks = detectDuplicateCode(code);
  
  const functionMetrics = calculateFunctionMetrics(code, language);
  const functionCount = functionMetrics.length;
  const averageFunctionLength = functionCount > 0
    ? Math.round(functionMetrics.reduce((sum, f) => sum + f.length, 0) / functionCount)
    : 0;
  const maxFunctionLength = functionCount > 0
    ? Math.max(...functionMetrics.map(f => f.length))
    : 0;
  
  return {
    totalLines,
    linesOfCode,
    sourceLines,
    commentLines,
    blankLines,
    commentRatio,
    averageLineLength,
    maxLineLength,
    functionCount,
    averageFunctionLength,
    maxFunctionLength,
    maxNestingDepth,
    duplicateBlocks
  };
}

/**
 * Check if metrics exceed thresholds
 */
export interface MetricThresholdViolation {
  metric: string;
  value: number;
  threshold: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export function checkMetricThresholds(metrics: CodeMetrics): MetricThresholdViolation[] {
  const violations: MetricThresholdViolation[] = [];
  
  // Check function length
  if (metrics.maxFunctionLength > 50) {
    violations.push({
      metric: 'maxFunctionLength',
      value: metrics.maxFunctionLength,
      threshold: 50,
      severity: metrics.maxFunctionLength > 100 ? 'high' : 'medium',
      message: `Function length (${metrics.maxFunctionLength} lines) exceeds recommended maximum (50 lines)`
    });
  }
  
  // Check file length
  if (metrics.totalLines > 500) {
    violations.push({
      metric: 'totalLines',
      value: metrics.totalLines,
      threshold: 500,
      severity: metrics.totalLines > 1000 ? 'high' : 'medium',
      message: `File length (${metrics.totalLines} lines) exceeds recommended maximum (500 lines)`
    });
  }
  
  // Check nesting depth
  if (metrics.maxNestingDepth > 4) {
    violations.push({
      metric: 'maxNestingDepth',
      value: metrics.maxNestingDepth,
      threshold: 4,
      severity: metrics.maxNestingDepth > 6 ? 'high' : 'medium',
      message: `Nesting depth (${metrics.maxNestingDepth}) exceeds recommended maximum (4)`
    });
  }
  
  // Check line length
  if (metrics.maxLineLength > 120) {
    violations.push({
      metric: 'maxLineLength',
      value: metrics.maxLineLength,
      threshold: 120,
      severity: 'low',
      message: `Line length (${metrics.maxLineLength} characters) exceeds recommended maximum (120 characters)`
    });
  }
  
  // Check comment ratio
  if (metrics.commentRatio < 0.1) {
    violations.push({
      metric: 'commentRatio',
      value: metrics.commentRatio,
      threshold: 0.1,
      severity: 'low',
      message: `Comment ratio (${Math.round(metrics.commentRatio * 100)}%) is below recommended minimum (10%)`
    });
  }
  
  // Check for duplicates
  if (metrics.duplicateBlocks.length > 0) {
    const totalDuplicateLines = metrics.duplicateBlocks.reduce(
      (sum, block) => sum + block.duplicateLineCount,
      0
    );
    violations.push({
      metric: 'duplicateBlocks',
      value: totalDuplicateLines,
      threshold: 0,
      severity: totalDuplicateLines > 50 ? 'high' : 'medium',
      message: `Found ${metrics.duplicateBlocks.length} duplicate code blocks (${totalDuplicateLines} duplicate lines)`
    });
  }
  
  return violations;
}

/**
 * Calculate code density (ratio of source lines to total lines)
 */
export function calculateCodeDensity(sourceLines: number, totalLines: number): number {
  if (totalLines === 0) return 0;
  return Math.round((sourceLines / totalLines) * 1000) / 1000;
}

/**
 * Get metrics summary as a readable string
 */
export function getMetricsSummary(metrics: CodeMetrics): string {
  return `
Code Metrics Summary:
- Total Lines: ${metrics.totalLines}
- Lines of Code: ${metrics.linesOfCode}
- Source Lines: ${metrics.sourceLines}
- Comment Lines: ${metrics.commentLines} (${Math.round(metrics.commentRatio * 100)}%)
- Blank Lines: ${metrics.blankLines}
- Average Line Length: ${metrics.averageLineLength} characters
- Max Line Length: ${metrics.maxLineLength} characters
- Function Count: ${metrics.functionCount}
- Average Function Length: ${metrics.averageFunctionLength} lines
- Max Function Length: ${metrics.maxFunctionLength} lines
- Max Nesting Depth: ${metrics.maxNestingDepth}
- Duplicate Blocks: ${metrics.duplicateBlocks.length}
  `.trim();
}

// Made with Bob