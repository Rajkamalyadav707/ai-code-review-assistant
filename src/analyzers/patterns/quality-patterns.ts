/**
 * Quality Patterns
 * Patterns for detecting code quality issues, code smells, and maintainability problems
 */

export type QualityIssueType =
  | 'complexity'
  | 'code_smell'
  | 'naming'
  | 'style'
  | 'best_practice'
  | 'documentation'
  | 'maintainability';

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'generic';

export interface QualityPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  type: QualityIssueType;
  severity: 'high' | 'medium' | 'low' | 'info';
  languages: Language[];
  fixSuggestion?: string;
  category: string;
}

/**
 * Thresholds for code quality metrics
 */
export const qualityThresholds = {
  // Complexity thresholds
  maxCyclomaticComplexity: 10,
  maxCognitiveComplexity: 15,
  maxNestingDepth: 4,
  
  // Size thresholds
  maxFunctionLength: 50,
  maxFileLength: 500,
  maxLineLength: 120,
  maxParameterCount: 5,
  
  // Class thresholds
  maxClassLength: 300,
  maxMethodsPerClass: 20,
  
  // Duplication thresholds
  minDuplicateLines: 6,
  
  // Comment thresholds
  minCommentRatio: 0.1, // 10% comments
  maxCommentRatio: 0.5, // 50% comments
  
  // Maintainability
  minMaintainabilityIndex: 65, // 0-100 scale
};

/**
 * Complexity Patterns
 * Detect overly complex code structures
 */
export const complexityPatterns: QualityPattern[] = [
  {
    id: 'deep-nesting',
    name: 'Deep Nesting',
    description: 'Code has excessive nesting levels (>4)',
    pattern: /^(\s{16,}|\t{4,})/m,
    type: 'complexity',
    severity: 'medium',
    languages: ['generic'],
    category: 'complexity',
    fixSuggestion: 'Extract nested logic into separate functions or use early returns'
  },
  {
    id: 'long-parameter-list',
    name: 'Long Parameter List',
    description: 'Function has too many parameters (>5)',
    pattern: /function\s+\w+\s*\([^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*\)/,
    type: 'complexity',
    severity: 'medium',
    languages: ['javascript', 'typescript'],
    category: 'complexity',
    fixSuggestion: 'Use an options object or split into smaller functions'
  },
  {
    id: 'long-parameter-list-python',
    name: 'Long Parameter List (Python)',
    description: 'Function has too many parameters (>5)',
    pattern: /def\s+\w+\s*\([^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*\)/,
    type: 'complexity',
    severity: 'medium',
    languages: ['python'],
    category: 'complexity',
    fixSuggestion: 'Use keyword arguments or split into smaller functions'
  },
  {
    id: 'complex-boolean-expression',
    name: 'Complex Boolean Expression',
    description: 'Boolean expression with multiple conditions',
    pattern: /if\s*\([^)]*&&[^)]*&&[^)]*\)|if\s*\([^)]*\|\|[^)]*\|\|[^)]*\)/,
    type: 'complexity',
    severity: 'low',
    languages: ['javascript', 'typescript', 'java'],
    category: 'complexity',
    fixSuggestion: 'Extract complex conditions into well-named boolean variables'
  }
];

/**
 * Code Smell Patterns
 * Detect common code smells
 */
export const codeSmellPatterns: QualityPattern[] = [
  {
    id: 'magic-number',
    name: 'Magic Number',
    description: 'Unexplained numeric literal in code',
    pattern: /(?<![\w.])\d{2,}(?![\w.])/,
    type: 'code_smell',
    severity: 'low',
    languages: ['generic'],
    category: 'code_smell',
    fixSuggestion: 'Replace magic numbers with named constants'
  },
  {
    id: 'duplicate-code-comment',
    name: 'Commented Out Code',
    description: 'Code that has been commented out',
    pattern: /\/\/\s*(?:function|const|let|var|class|if|for|while)\s+\w+/,
    type: 'code_smell',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'code_smell',
    fixSuggestion: 'Remove commented code; use version control instead'
  },
  {
    id: 'duplicate-code-comment-python',
    name: 'Commented Out Code (Python)',
    description: 'Code that has been commented out',
    pattern: /#\s*(?:def|class|if|for|while)\s+\w+/,
    type: 'code_smell',
    severity: 'low',
    languages: ['python'],
    category: 'code_smell',
    fixSuggestion: 'Remove commented code; use version control instead'
  },
  {
    id: 'console-log',
    name: 'Console Log Statement',
    description: 'Debug console.log statement left in code',
    pattern: /console\.(?:log|debug|info|warn|error)\s*\(/,
    type: 'code_smell',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'code_smell',
    fixSuggestion: 'Remove debug statements or use a proper logging library'
  },
  {
    id: 'print-statement-python',
    name: 'Print Statement',
    description: 'Debug print statement left in code',
    pattern: /\bprint\s*\(/,
    type: 'code_smell',
    severity: 'low',
    languages: ['python'],
    category: 'code_smell',
    fixSuggestion: 'Remove debug statements or use a proper logging library'
  },
  {
    id: 'empty-catch-block',
    name: 'Empty Catch Block',
    description: 'Exception caught but not handled',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
    type: 'code_smell',
    severity: 'high',
    languages: ['javascript', 'typescript', 'java'],
    category: 'code_smell',
    fixSuggestion: 'Handle exceptions properly or at least log them'
  },
  {
    id: 'empty-except-block-python',
    name: 'Empty Except Block (Python)',
    description: 'Exception caught but not handled',
    pattern: /except[^:]*:\s*pass\s*$/m,
    type: 'code_smell',
    severity: 'high',
    languages: ['python'],
    category: 'code_smell',
    fixSuggestion: 'Handle exceptions properly or at least log them'
  },
  {
    id: 'god-object',
    name: 'Large Class',
    description: 'Class with too many responsibilities',
    pattern: /class\s+\w+/,
    type: 'code_smell',
    severity: 'medium',
    languages: ['generic'],
    category: 'code_smell',
    fixSuggestion: 'Split large classes into smaller, focused classes'
  }
];

/**
 * Naming Convention Patterns
 * Detect naming standard violations
 */
export const namingPatterns: QualityPattern[] = [
  {
    id: 'non-descriptive-name',
    name: 'Non-Descriptive Variable Name',
    description: 'Variable name is too short or non-descriptive',
    pattern: /(?:const|let|var)\s+[a-z]\s*=/,
    type: 'naming',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'naming',
    fixSuggestion: 'Use descriptive variable names (at least 2 characters)'
  },
  {
    id: 'snake-case-js',
    name: 'Snake Case in JavaScript',
    description: 'Using snake_case instead of camelCase',
    pattern: /(?:const|let|var)\s+[a-z]+_[a-z_]+\s*=/,
    type: 'naming',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'naming',
    fixSuggestion: 'Use camelCase for JavaScript/TypeScript variables'
  },
  {
    id: 'camel-case-python',
    name: 'Camel Case in Python',
    description: 'Using camelCase instead of snake_case',
    pattern: /(?:def|class)\s+[a-z]+[A-Z][a-zA-Z]*/,
    type: 'naming',
    severity: 'low',
    languages: ['python'],
    category: 'naming',
    fixSuggestion: 'Use snake_case for Python functions and variables'
  },
  {
    id: 'uppercase-constant',
    name: 'Constant Not Uppercase',
    description: 'Constant should be in UPPER_CASE',
    pattern: /const\s+[a-z][a-z0-9]*\s*=\s*(?:['"`]|[\d]|true|false)/,
    type: 'naming',
    severity: 'info',
    languages: ['javascript', 'typescript'],
    category: 'naming',
    fixSuggestion: 'Use UPPER_CASE for constants'
  }
];

/**
 * Code Style Patterns
 * Detect style and formatting issues
 */
export const stylePatterns: QualityPattern[] = [
  {
    id: 'missing-semicolon',
    name: 'Missing Semicolon',
    description: 'Statement missing semicolon',
    pattern: /[^;\s]\s*$/m,
    type: 'style',
    severity: 'info',
    languages: ['javascript', 'typescript'],
    category: 'style',
    fixSuggestion: 'Add semicolons at end of statements'
  },
  {
    id: 'trailing-whitespace',
    name: 'Trailing Whitespace',
    description: 'Line has trailing whitespace',
    pattern: /\s+$/m,
    type: 'style',
    severity: 'info',
    languages: ['generic'],
    category: 'style',
    fixSuggestion: 'Remove trailing whitespace'
  },
  {
    id: 'multiple-empty-lines',
    name: 'Multiple Empty Lines',
    description: 'Multiple consecutive empty lines',
    pattern: /\n\s*\n\s*\n/,
    type: 'style',
    severity: 'info',
    languages: ['generic'],
    category: 'style',
    fixSuggestion: 'Use single empty line for separation'
  },
  {
    id: 'inconsistent-indentation',
    name: 'Mixed Tabs and Spaces',
    description: 'File uses both tabs and spaces for indentation',
    pattern: /^\t.*\n^ /m,
    type: 'style',
    severity: 'low',
    languages: ['generic'],
    category: 'style',
    fixSuggestion: 'Use consistent indentation (either tabs or spaces)'
  }
];

/**
 * Best Practice Patterns
 * Detect violations of best practices
 */
export const bestPracticePatterns: QualityPattern[] = [
  {
    id: 'no-error-handling',
    name: 'Missing Error Handling',
    description: 'Async operation without error handling',
    pattern: /(?:fetch|axios|request)\s*\([^)]*\)(?!\s*\.catch|\s*\.then\([^)]*,)/,
    type: 'best_practice',
    severity: 'medium',
    languages: ['javascript', 'typescript'],
    category: 'best_practice',
    fixSuggestion: 'Add .catch() or try-catch for error handling'
  },
  {
    id: 'var-instead-of-const-let',
    name: 'Using var Instead of const/let',
    description: 'Using var instead of const or let',
    pattern: /\bvar\s+\w+/,
    type: 'best_practice',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'best_practice',
    fixSuggestion: 'Use const or let instead of var'
  },
  {
    id: 'equality-without-type-check',
    name: 'Loose Equality Comparison',
    description: 'Using == instead of ===',
    pattern: /[^=!<>]==[^=]/,
    type: 'best_practice',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'best_practice',
    fixSuggestion: 'Use === for strict equality comparison'
  },
  {
    id: 'unused-variable',
    name: 'Potentially Unused Variable',
    description: 'Variable declared but may not be used',
    pattern: /(?:const|let|var)\s+(\w+)\s*=.*\n(?!.*\1)/,
    type: 'best_practice',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'best_practice',
    fixSuggestion: 'Remove unused variables'
  },
  {
    id: 'callback-hell',
    name: 'Callback Hell',
    description: 'Deeply nested callbacks',
    pattern: /\)\s*\{\s*\w+\([^)]*,\s*function\s*\([^)]*\)\s*\{[^}]*function\s*\(/,
    type: 'best_practice',
    severity: 'medium',
    languages: ['javascript', 'typescript'],
    category: 'best_practice',
    fixSuggestion: 'Use Promises or async/await instead of nested callbacks'
  },
  {
    id: 'mutable-default-argument-python',
    name: 'Mutable Default Argument (Python)',
    description: 'Using mutable object as default argument',
    pattern: /def\s+\w+\s*\([^)]*=\s*(?:\[\]|\{\})/,
    type: 'best_practice',
    severity: 'medium',
    languages: ['python'],
    category: 'best_practice',
    fixSuggestion: 'Use None as default and create mutable object inside function'
  }
];

/**
 * Documentation Patterns
 * Detect missing or inadequate documentation
 */
export const documentationPatterns: QualityPattern[] = [
  {
    id: 'missing-function-doc',
    name: 'Missing Function Documentation',
    description: 'Public function without documentation',
    pattern: /^(?:export\s+)?(?:async\s+)?function\s+\w+/m,
    type: 'documentation',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    category: 'documentation',
    fixSuggestion: 'Add JSDoc comment describing function purpose and parameters'
  },
  {
    id: 'missing-class-doc',
    name: 'Missing Class Documentation',
    description: 'Class without documentation',
    pattern: /^(?:export\s+)?class\s+\w+/m,
    type: 'documentation',
    severity: 'low',
    languages: ['javascript', 'typescript', 'python', 'java'],
    category: 'documentation',
    fixSuggestion: 'Add documentation describing class purpose and usage'
  },
  {
    id: 'todo-comment',
    name: 'TODO Comment',
    description: 'TODO comment indicating incomplete work',
    pattern: /\/\/\s*TODO|#\s*TODO/i,
    type: 'documentation',
    severity: 'info',
    languages: ['generic'],
    category: 'documentation',
    fixSuggestion: 'Complete TODO items or create proper issue tracker entries'
  },
  {
    id: 'fixme-comment',
    name: 'FIXME Comment',
    description: 'FIXME comment indicating known issue',
    pattern: /\/\/\s*FIXME|#\s*FIXME/i,
    type: 'documentation',
    severity: 'low',
    languages: ['generic'],
    category: 'documentation',
    fixSuggestion: 'Fix the issue or create proper issue tracker entry'
  }
];

/**
 * All quality patterns organized by type
 */
export const qualityPatterns: Record<QualityIssueType, QualityPattern[]> = {
  complexity: complexityPatterns,
  code_smell: codeSmellPatterns,
  naming: namingPatterns,
  style: stylePatterns,
  best_practice: bestPracticePatterns,
  documentation: documentationPatterns,
  maintainability: [] // Calculated dynamically based on metrics
};

/**
 * Get patterns for a specific language
 */
export function getPatternsForLanguage(language: Language): QualityPattern[] {
  const allPatterns: QualityPattern[] = [];
  
  Object.values(qualityPatterns).forEach(patterns => {
    patterns.forEach(pattern => {
      if (pattern.languages.includes(language) || pattern.languages.includes('generic')) {
        allPatterns.push(pattern);
      }
    });
  });
  
  return allPatterns;
}

/**
 * Get patterns by issue type
 */
export function getPatternsByType(type: QualityIssueType): QualityPattern[] {
  return qualityPatterns[type] || [];
}

/**
 * Get all patterns
 */
export function getAllPatterns(): QualityPattern[] {
  const allPatterns: QualityPattern[] = [];
  Object.values(qualityPatterns).forEach(patterns => {
    allPatterns.push(...patterns);
  });
  return allPatterns;
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: string): QualityPattern[] {
  const allPatterns = getAllPatterns();
  return allPatterns.filter(p => p.category === category);
}

// Made with Bob