/**
 * Complexity Calculator
 * Calculates cyclomatic complexity, cognitive complexity, and maintainability index
 */

import { Language, extractFunctions, ParsedFunction } from './code-parser';

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  halsteadMetrics: HalsteadMetrics;
  technicalDebt: TechnicalDebt;
}

export interface HalsteadMetrics {
  vocabulary: number;
  length: number;
  volume: number;
  difficulty: number;
  effort: number;
  timeToProgram: number; // in minutes
  bugsDelivered: number;
}

export interface TechnicalDebt {
  minutes: number;
  hours: number;
  days: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  length: number;
}

/**
 * Calculate cyclomatic complexity for code
 * Counts decision points: if, else, for, while, case, catch, &&, ||, ?
 */
export function calculateCyclomaticComplexity(code: string, language: Language): number {
  let complexity = 1; // Base complexity
  
  // Decision keywords that increase complexity
  const decisionKeywords = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\bexcept\b/g, // Python
    /&&/g,
    /\|\|/g,
    /\?/g, // Ternary operator
  ];
  
  // Count each decision point
  for (const pattern of decisionKeywords) {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return complexity;
}

/**
 * Calculate cognitive complexity
 * More sophisticated than cyclomatic - considers nesting and structural complexity
 */
export function calculateCognitiveComplexity(code: string, language: Language): number {
  let complexity = 0;
  let nestingLevel = 0;
  const lines = code.split('\n');
  
  // Track nesting structures
  const nestingIncreasers = [
    /\bif\s*\(/,
    /\bfor\s*\(/,
    /\bwhile\s*\(/,
    /\bswitch\s*\(/,
    /\btry\s*\{/,
    /\bcatch\s*\(/,
    /\bfunction\s*\w*\s*\(/,
    /=>\s*\{/, // Arrow functions
  ];
  
  const logicalOperators = [/&&/, /\|\|/];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Check for nesting increasers
    for (const pattern of nestingIncreasers) {
      if (pattern.test(trimmedLine)) {
        complexity += 1 + nestingLevel; // Add nesting penalty
        nestingLevel++;
        break;
      }
    }
    
    // Check for logical operators (add complexity but don't increase nesting)
    for (const pattern of logicalOperators) {
      const matches = trimmedLine.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    // Check for closing braces (decrease nesting)
    const openBraces = (trimmedLine.match(/\{/g) || []).length;
    const closeBraces = (trimmedLine.match(/\}/g) || []).length;
    nestingLevel = Math.max(0, nestingLevel + openBraces - closeBraces);
    
    // Special cases that add complexity
    if (/\belse\s+if\b/.test(trimmedLine)) {
      complexity += 1;
    }
    if (/\bbreak\b|\bcontinue\b|\breturn\b/.test(trimmedLine) && nestingLevel > 0) {
      complexity += 1;
    }
  }
  
  return complexity;
}

/**
 * Calculate Halstead metrics
 * Measures program complexity based on operators and operands
 */
export function calculateHalsteadMetrics(code: string, language: Language): HalsteadMetrics {
  // Remove comments and strings to avoid counting them
  let cleanCode = code;
  if (language === 'javascript' || language === 'typescript' || language === 'java') {
    cleanCode = cleanCode.replace(/\/\/.*$/gm, '');
    cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');
    cleanCode = cleanCode.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '');
  } else if (language === 'python') {
    cleanCode = cleanCode.replace(/#.*$/gm, '');
    cleanCode = cleanCode.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, '');
    cleanCode = cleanCode.replace(/"[^"]*"|'[^']*'/g, '');
  }
  
  // Define operators based on language
  const operators = [
    '+', '-', '*', '/', '%', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=',
    '&&', '||', '!', '&', '|', '^', '~', '<<', '>>', '++', '--',
    '?', ':', '.', ',', ';', '(', ')', '{', '}', '[', ']',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'return', 'function', 'class', 'new', 'this', 'throw', 'try', 'catch', 'finally'
  ];
  
  // Count unique operators (n1) and total operators (N1)
  const operatorCounts = new Map<string, number>();
  let totalOperators = 0;
  
  for (const op of operators) {
    const regex = new RegExp(`\\b${op}\\b|${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    const matches = cleanCode.match(regex);
    if (matches) {
      operatorCounts.set(op, matches.length);
      totalOperators += matches.length;
    }
  }
  
  // Count unique operands (n2) and total operands (N2)
  // Simplified: count identifiers (variables, function names, etc.)
  const identifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  const identifiers = cleanCode.match(identifierRegex) || [];
  const operandCounts = new Map<string, number>();
  
  for (const id of identifiers) {
    // Skip keywords that are operators
    if (!operators.includes(id)) {
      operandCounts.set(id, (operandCounts.get(id) || 0) + 1);
    }
  }
  
  const n1 = operatorCounts.size; // Unique operators
  const N1 = totalOperators; // Total operators
  const n2 = operandCounts.size; // Unique operands
  const N2 = Array.from(operandCounts.values()).reduce((sum, count) => sum + count, 0); // Total operands
  
  // Calculate Halstead metrics
  const vocabulary = n1 + n2;
  const length = N1 + N2;
  const volume = length * Math.log2(vocabulary || 1);
  const difficulty = (n1 / 2) * (N2 / (n2 || 1));
  const effort = difficulty * volume;
  const timeToProgram = effort / 18; // seconds, then convert to minutes
  const bugsDelivered = volume / 3000;
  
  return {
    vocabulary,
    length,
    volume: Math.round(volume * 100) / 100,
    difficulty: Math.round(difficulty * 100) / 100,
    effort: Math.round(effort * 100) / 100,
    timeToProgram: Math.round((timeToProgram / 60) * 100) / 100, // minutes
    bugsDelivered: Math.round(bugsDelivered * 1000) / 1000
  };
}

/**
 * Calculate Maintainability Index
 * Formula: 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
 * Normalized to 0-100 scale
 */
export function calculateMaintainabilityIndex(
  code: string,
  language: Language,
  linesOfCode: number,
  commentRatio: number
): number {
  const cyclomaticComplexity = calculateCyclomaticComplexity(code, language);
  const halsteadMetrics = calculateHalsteadMetrics(code, language);
  
  // Avoid log of 0
  const volume = Math.max(halsteadMetrics.volume, 1);
  const loc = Math.max(linesOfCode, 1);
  
  // Original formula
  let mi = 171 
    - 5.2 * Math.log(volume)
    - 0.23 * cyclomaticComplexity
    - 16.2 * Math.log(loc);
  
  // Add comment bonus (up to 10 points)
  mi += commentRatio * 10;
  
  // Normalize to 0-100 scale
  mi = Math.max(0, Math.min(100, mi));
  
  return Math.round(mi * 100) / 100;
}

/**
 * Calculate technical debt
 * Estimates time needed to fix quality issues
 */
export function calculateTechnicalDebt(
  cyclomaticComplexity: number,
  cognitiveComplexity: number,
  maintainabilityIndex: number,
  linesOfCode: number,
  issueCount: number
): TechnicalDebt {
  let minutes = 0;
  
  // Complexity debt (higher complexity = more time to refactor)
  if (cyclomaticComplexity > 10) {
    minutes += (cyclomaticComplexity - 10) * 5;
  }
  if (cognitiveComplexity > 15) {
    minutes += (cognitiveComplexity - 15) * 7;
  }
  
  // Maintainability debt
  if (maintainabilityIndex < 65) {
    minutes += (65 - maintainabilityIndex) * 2;
  }
  
  // Size debt (large files take longer to refactor)
  if (linesOfCode > 500) {
    minutes += (linesOfCode - 500) * 0.1;
  }
  
  // Issue debt (each issue takes time to fix)
  minutes += issueCount * 10;
  
  const hours = minutes / 60;
  const days = hours / 8;
  
  // Calculate rating based on debt
  let rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  if (minutes <= 30) rating = 'A';
  else if (minutes <= 120) rating = 'B';
  else if (minutes <= 480) rating = 'C';
  else if (minutes <= 960) rating = 'D';
  else if (minutes <= 1920) rating = 'E';
  else rating = 'F';
  
  return {
    minutes: Math.round(minutes),
    hours: Math.round(hours * 10) / 10,
    days: Math.round(days * 10) / 10,
    rating
  };
}

/**
 * Calculate complexity for all functions in code
 */
export function calculateFunctionComplexities(code: string, language: Language): FunctionComplexity[] {
  const functions = extractFunctions(code, language);
  const lines = code.split('\n');
  const complexities: FunctionComplexity[] = [];
  
  for (const func of functions) {
    const functionCode = lines.slice(func.startLine - 1, func.endLine).join('\n');
    const cyclomaticComplexity = calculateCyclomaticComplexity(functionCode, language);
    const cognitiveComplexity = calculateCognitiveComplexity(functionCode, language);
    const length = func.endLine - func.startLine + 1;
    
    complexities.push({
      name: func.name,
      startLine: func.startLine,
      endLine: func.endLine,
      cyclomaticComplexity,
      cognitiveComplexity,
      length
    });
  }
  
  return complexities;
}

/**
 * Calculate overall complexity metrics for code
 */
export function calculateComplexityMetrics(
  code: string,
  language: Language,
  linesOfCode: number,
  commentRatio: number,
  issueCount: number = 0
): ComplexityMetrics {
  const cyclomaticComplexity = calculateCyclomaticComplexity(code, language);
  const cognitiveComplexity = calculateCognitiveComplexity(code, language);
  const halsteadMetrics = calculateHalsteadMetrics(code, language);
  const maintainabilityIndex = calculateMaintainabilityIndex(code, language, linesOfCode, commentRatio);
  const technicalDebt = calculateTechnicalDebt(
    cyclomaticComplexity,
    cognitiveComplexity,
    maintainabilityIndex,
    linesOfCode,
    issueCount
  );
  
  return {
    cyclomaticComplexity,
    cognitiveComplexity,
    maintainabilityIndex,
    halsteadMetrics,
    technicalDebt
  };
}

/**
 * Get complexity grade (A-F) based on cyclomatic complexity
 */
export function getComplexityGrade(complexity: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  if (complexity <= 5) return 'A';
  if (complexity <= 10) return 'B';
  if (complexity <= 20) return 'C';
  if (complexity <= 30) return 'D';
  if (complexity <= 40) return 'E';
  return 'F';
}

/**
 * Get maintainability grade based on maintainability index
 */
export function getMaintainabilityGrade(index: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  if (index >= 85) return 'A';
  if (index >= 70) return 'B';
  if (index >= 55) return 'C';
  if (index >= 40) return 'D';
  if (index >= 25) return 'E';
  return 'F';
}

// Made with Bob