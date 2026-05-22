/**
 * Performance Patterns
 * Defines patterns for detecting performance issues and anti-patterns
 */

import { Severity } from '../../types';

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'generic';

export type PerformanceCategory =
  | 'algorithm'
  | 'memory'
  | 'database'
  | 'network'
  | 'rendering'
  | 'resource'
  | 'inefficient_pattern';

export type PerformanceImpact = 'low' | 'medium' | 'high';

export type BigOComplexity = 
  | 'O(1)' 
  | 'O(log n)' 
  | 'O(n)' 
  | 'O(n log n)' 
  | 'O(n²)' 
  | 'O(n³)' 
  | 'O(2ⁿ)' 
  | 'O(n!)';

export interface PerformancePattern {
  id: string;
  name: string;
  description: string;
  category: PerformanceCategory;
  pattern: string; // Regex pattern
  severity: Severity;
  impact: PerformanceImpact;
  languages: Language[];
  complexity?: BigOComplexity;
  fixSuggestion: string;
  example?: {
    before: string;
    after: string;
  };
}

/**
 * Algorithm Complexity Patterns
 * Detect inefficient algorithms and nested loops
 */
export const algorithmPatterns: PerformancePattern[] = [
  {
    id: 'nested-loops-triple',
    name: 'Triple Nested Loops',
    description: 'Three nested loops detected, resulting in O(n³) complexity',
    category: 'algorithm',
    pattern: 'for\\s*\\([^)]+\\)\\s*{[^}]*for\\s*\\([^)]+\\)\\s*{[^}]*for\\s*\\([^)]+\\)',
    severity: 'high',
    impact: 'high',
    languages: ['javascript', 'typescript', 'java', 'go', 'generic'],
    complexity: 'O(n³)',
    fixSuggestion: 'Consider using a more efficient algorithm or data structure to reduce complexity',
    example: {
      before: 'for (let i = 0; i < n; i++) {\n  for (let j = 0; j < n; j++) {\n    for (let k = 0; k < n; k++) {\n      // O(n³) operation\n    }\n  }\n}',
      after: 'Use hash maps, sets, or other data structures to reduce complexity to O(n) or O(n log n)'
    }
  },
  {
    id: 'nested-loops-double',
    name: 'Double Nested Loops',
    description: 'Two nested loops detected, resulting in O(n²) complexity',
    category: 'algorithm',
    pattern: 'for\\s*\\([^)]+\\)\\s*{[^}]*for\\s*\\([^)]+\\)',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript', 'java', 'go', 'generic'],
    complexity: 'O(n²)',
    fixSuggestion: 'Consider using hash maps, binary search, or other optimizations to reduce complexity',
    example: {
      before: 'for (let i = 0; i < arr1.length; i++) {\n  for (let j = 0; j < arr2.length; j++) {\n    if (arr1[i] === arr2[j]) found = true;\n  }\n}',
      after: 'const set = new Set(arr2);\nfor (let i = 0; i < arr1.length; i++) {\n  if (set.has(arr1[i])) found = true;\n}'
    }
  },
  {
    id: 'python-nested-loops',
    name: 'Python Nested Loops',
    description: 'Nested loops in Python can be slow for large datasets',
    category: 'algorithm',
    pattern: 'for\\s+\\w+\\s+in\\s+[^:]+:[^\\n]*\\n\\s+for\\s+\\w+\\s+in',
    severity: 'medium',
    impact: 'medium',
    languages: ['python'],
    complexity: 'O(n²)',
    fixSuggestion: 'Use list comprehensions, numpy operations, or dictionary lookups for better performance'
  },
  {
    id: 'array-in-loop',
    name: 'Array Search in Loop',
    description: 'Using array.includes() or indexOf() inside a loop results in O(n²) complexity',
    category: 'algorithm',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*(includes|indexOf)\\s*\\(',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    complexity: 'O(n²)',
    fixSuggestion: 'Convert array to Set for O(1) lookups: const set = new Set(array); if (set.has(item))',
    example: {
      before: 'for (let item of items) {\n  if (array.includes(item)) { /* ... */ }\n}',
      after: 'const set = new Set(array);\nfor (let item of items) {\n  if (set.has(item)) { /* ... */ }\n}'
    }
  }
];

/**
 * Memory Performance Patterns
 * Detect memory leaks and inefficient memory usage
 */
export const memoryPatterns: PerformancePattern[] = [
  {
    id: 'event-listener-no-cleanup',
    name: 'Event Listener Without Cleanup',
    description: 'Event listener added without corresponding removal, potential memory leak',
    category: 'memory',
    pattern: 'addEventListener\\s*\\([^)]+\\)(?![^]*removeEventListener)',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Always remove event listeners in cleanup/unmount: element.removeEventListener(event, handler)',
    example: {
      before: 'element.addEventListener("click", handler);',
      after: 'element.addEventListener("click", handler);\n// In cleanup:\nelement.removeEventListener("click", handler);'
    }
  },
  {
    id: 'setinterval-no-clear',
    name: 'setInterval Without clearInterval',
    description: 'setInterval called without corresponding clearInterval, potential memory leak',
    category: 'memory',
    pattern: 'setInterval\\s*\\([^)]+\\)(?![^]*clearInterval)',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Store interval ID and clear it: const id = setInterval(...); clearInterval(id);'
  },
  {
    id: 'large-array-concat',
    name: 'Array Concatenation in Loop',
    description: 'Using array concatenation in a loop creates many intermediate arrays',
    category: 'memory',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*(?:concat|\\+=\\s*\\[)',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Use push() or spread operator once: arr.push(...items) instead of arr = arr.concat(items)',
    example: {
      before: 'for (let item of items) {\n  result = result.concat([item]);\n}',
      after: 'for (let item of items) {\n  result.push(item);\n}\n// Or: result.push(...items);'
    }
  },
  {
    id: 'python-list-append-loop',
    name: 'Python List Concatenation in Loop',
    description: 'Using += for list concatenation in loop is inefficient',
    category: 'memory',
    pattern: 'for\\s+\\w+\\s+in\\s+[^:]+:[^\\n]*\\n\\s+\\w+\\s*\\+=\\s*\\[',
    severity: 'medium',
    impact: 'medium',
    languages: ['python'],
    fixSuggestion: 'Use list.append() or list.extend() instead of += for better performance'
  },
  {
    id: 'java-string-concat-loop',
    name: 'String Concatenation in Loop',
    description: 'String concatenation in loop creates many intermediate String objects',
    category: 'memory',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*\\w+\\s*\\+=\\s*["\']',
    severity: 'high',
    impact: 'high',
    languages: ['java'],
    fixSuggestion: 'Use StringBuilder for string concatenation in loops',
    example: {
      before: 'String result = "";\nfor (String s : list) {\n  result += s;\n}',
      after: 'StringBuilder sb = new StringBuilder();\nfor (String s : list) {\n  sb.append(s);\n}\nString result = sb.toString();'
    }
  }
];

/**
 * Database Performance Patterns
 * Detect N+1 queries and inefficient database operations
 */
export const databasePatterns: PerformancePattern[] = [
  {
    id: 'query-in-loop',
    name: 'Database Query in Loop (N+1 Problem)',
    description: 'Database query inside a loop causes N+1 query problem',
    category: 'database',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*(query|find|findOne|findById|get|select|execute)\\s*\\(',
    severity: 'high',
    impact: 'high',
    languages: ['javascript', 'typescript', 'python', 'java', 'generic'],
    fixSuggestion: 'Fetch all data in a single query using WHERE IN or JOIN, then process in memory',
    example: {
      before: 'for (let id of ids) {\n  const user = await User.findById(id);\n}',
      after: 'const users = await User.find({ _id: { $in: ids } });'
    }
  },
  {
    id: 'missing-index-hint',
    name: 'Potential Missing Index',
    description: 'Query on non-indexed field may be slow',
    category: 'database',
    pattern: '(find|where)\\s*\\([^)]*\\$ne|\\$gt|\\$lt|\\$regex',
    severity: 'medium',
    impact: 'high',
    languages: ['javascript', 'typescript', 'generic'],
    fixSuggestion: 'Ensure database indexes exist for frequently queried fields'
  },
  {
    id: 'select-all-fields',
    name: 'Selecting All Fields',
    description: 'Selecting all fields when only few are needed wastes bandwidth',
    category: 'database',
    pattern: 'SELECT\\s+\\*\\s+FROM',
    severity: 'low',
    impact: 'medium',
    languages: ['generic'],
    fixSuggestion: 'Select only required fields: SELECT id, name FROM users instead of SELECT * FROM users'
  },
  {
    id: 'no-limit-query',
    name: 'Query Without Limit',
    description: 'Database query without LIMIT can return too many results',
    category: 'database',
    pattern: '(find|query|select)\\s*\\([^)]*\\)(?![^)]*limit)',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript', 'python', 'generic'],
    fixSuggestion: 'Add LIMIT clause or pagination to prevent loading excessive data'
  }
];

/**
 * Network Performance Patterns
 * Detect synchronous operations and missing caching
 */
export const networkPatterns: PerformancePattern[] = [
  {
    id: 'sync-http-request',
    name: 'Synchronous HTTP Request',
    description: 'Synchronous HTTP request blocks the thread',
    category: 'network',
    pattern: '(XMLHttpRequest|fetch)\\s*\\([^)]*\\)(?![^)]*async|await)',
    severity: 'high',
    impact: 'high',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Use async/await or promises for HTTP requests to avoid blocking'
  },
  {
    id: 'no-request-caching',
    name: 'Missing Request Caching',
    description: 'Repeated API calls without caching',
    category: 'network',
    pattern: 'fetch\\s*\\([^)]+\\)(?![^)]*cache)',
    severity: 'low',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Implement caching for frequently accessed data to reduce network calls'
  },
  {
    id: 'large-payload',
    name: 'Large JSON Payload',
    description: 'Sending large JSON payloads can be slow',
    category: 'network',
    pattern: 'JSON\\.stringify\\s*\\([^)]{200,}\\)',
    severity: 'low',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Consider pagination, compression, or sending only required fields'
  },
  {
    id: 'sequential-requests',
    name: 'Sequential API Requests',
    description: 'Multiple API requests executed sequentially instead of in parallel',
    category: 'network',
    pattern: 'await\\s+fetch[^;]+;\\s*await\\s+fetch',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Use Promise.all() to execute independent requests in parallel',
    example: {
      before: 'const user = await fetch("/user");\nconst posts = await fetch("/posts");',
      after: 'const [user, posts] = await Promise.all([\n  fetch("/user"),\n  fetch("/posts")\n]);'
    }
  }
];

/**
 * Rendering Performance Patterns
 * Detect inefficient DOM operations and rendering issues
 */
export const renderingPatterns: PerformancePattern[] = [
  {
    id: 'dom-manipulation-loop',
    name: 'DOM Manipulation in Loop',
    description: 'Manipulating DOM inside a loop causes multiple reflows',
    category: 'rendering',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*(appendChild|innerHTML|insertBefore|createElement)',
    severity: 'high',
    impact: 'high',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Build DOM fragment outside loop, then append once: use DocumentFragment',
    example: {
      before: 'for (let item of items) {\n  element.appendChild(createNode(item));\n}',
      after: 'const fragment = document.createDocumentFragment();\nfor (let item of items) {\n  fragment.appendChild(createNode(item));\n}\nelement.appendChild(fragment);'
    }
  },
  {
    id: 'forced-reflow',
    name: 'Forced Synchronous Layout',
    description: 'Reading layout properties after writing causes forced reflow',
    category: 'rendering',
    pattern: '(style|className)\\s*=[^;]+;[^}]*(offsetHeight|offsetWidth|clientHeight|clientWidth|scrollHeight|scrollWidth)',
    severity: 'medium',
    impact: 'high',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Batch DOM reads and writes separately to avoid layout thrashing'
  },
  {
    id: 'react-inline-function',
    name: 'React Inline Function in Render',
    description: 'Inline function in render creates new function on every render',
    category: 'rendering',
    pattern: 'onClick=\\{\\(\\)\\s*=>|onChange=\\{\\(\\)\\s*=>',
    severity: 'low',
    impact: 'low',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Use useCallback hook or define function outside render to prevent unnecessary re-renders'
  },
  {
    id: 'react-missing-key',
    name: 'React List Without Keys',
    description: 'Rendering list without keys causes inefficient reconciliation',
    category: 'rendering',
    pattern: '\\.map\\s*\\([^)]+\\)\\s*=>\\s*<[^>]+>(?![^<]*key=)',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Add unique key prop to list items: <Item key={item.id} />'
  }
];

/**
 * Resource Management Patterns
 * Detect unclosed resources and missing cleanup
 */
export const resourcePatterns: PerformancePattern[] = [
  {
    id: 'file-not-closed',
    name: 'File Handle Not Closed',
    description: 'File opened but not closed, potential resource leak',
    category: 'resource',
    pattern: 'open\\s*\\([^)]+\\)(?![^}]*close\\()',
    severity: 'high',
    impact: 'high',
    languages: ['python', 'java'],
    fixSuggestion: 'Use context manager (with statement) or try-finally to ensure file is closed',
    example: {
      before: 'f = open("file.txt")\ndata = f.read()',
      after: 'with open("file.txt") as f:\n    data = f.read()'
    }
  },
  {
    id: 'connection-not-closed',
    name: 'Database Connection Not Closed',
    description: 'Database connection opened but not closed',
    category: 'resource',
    pattern: '(connect|createConnection)\\s*\\([^)]+\\)(?![^}]*close\\()',
    severity: 'high',
    impact: 'high',
    languages: ['javascript', 'typescript', 'python', 'java', 'generic'],
    fixSuggestion: 'Always close connections in finally block or use connection pooling'
  },
  {
    id: 'stream-not-closed',
    name: 'Stream Not Closed',
    description: 'Stream opened but not properly closed',
    category: 'resource',
    pattern: 'createReadStream|createWriteStream(?![^}]*close\\()',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Use stream.close() or handle stream end event properly'
  }
];

/**
 * Inefficient Pattern Detection
 * Detect common inefficient coding patterns
 */
export const inefficientPatterns: PerformancePattern[] = [
  {
    id: 'string-concat-loop',
    name: 'String Concatenation in Loop',
    description: 'String concatenation in loop is inefficient',
    category: 'inefficient_pattern',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*\\w+\\s*\\+=\\s*["\']',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Use array.join() or template literals: arr.push(str); result = arr.join("")',
    example: {
      before: 'let result = "";\nfor (let s of strings) {\n  result += s;\n}',
      after: 'const result = strings.join("");'
    }
  },
  {
    id: 'repeated-calculation',
    name: 'Repeated Calculation in Loop',
    description: 'Same calculation repeated in every loop iteration',
    category: 'inefficient_pattern',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*(length|size|count)\\s*\\(',
    severity: 'low',
    impact: 'low',
    languages: ['javascript', 'typescript', 'python', 'java', 'generic'],
    fixSuggestion: 'Cache the result before loop: const len = array.length; for (let i = 0; i < len; i++)'
  },
  {
    id: 'regex-in-loop',
    name: 'Regex Compilation in Loop',
    description: 'Regular expression compiled in every loop iteration',
    category: 'inefficient_pattern',
    pattern: 'for\\s*\\([^)]+\\)[^{]*{[^}]*new\\s+RegExp\\s*\\(',
    severity: 'medium',
    impact: 'medium',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Compile regex once before loop: const regex = new RegExp(...); for (...) { regex.test(...) }'
  },
  {
    id: 'unnecessary-array-copy',
    name: 'Unnecessary Array Copy',
    description: 'Creating array copy when not needed',
    category: 'inefficient_pattern',
    pattern: '\\[\\.\\.\\.(\\w+)\\](?![^;]*\\1\\s*\\.)',
    severity: 'low',
    impact: 'low',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Avoid unnecessary array copies if original array is not modified'
  },
  {
    id: 'inefficient-filter-map',
    name: 'Chained Filter and Map',
    description: 'Using filter().map() iterates array twice',
    category: 'inefficient_pattern',
    pattern: '\\.filter\\s*\\([^)]+\\)\\s*\\.map\\s*\\(',
    severity: 'low',
    impact: 'low',
    languages: ['javascript', 'typescript'],
    fixSuggestion: 'Use reduce() or flatMap() to iterate once instead of filter().map()',
    example: {
      before: 'arr.filter(x => x > 0).map(x => x * 2)',
      after: 'arr.reduce((acc, x) => x > 0 ? [...acc, x * 2] : acc, [])'
    }
  }
];

/**
 * Get all performance patterns
 */
export function getAllPatterns(): PerformancePattern[] {
  return [
    ...algorithmPatterns,
    ...memoryPatterns,
    ...databasePatterns,
    ...networkPatterns,
    ...renderingPatterns,
    ...resourcePatterns,
    ...inefficientPatterns
  ];
}

/**
 * Get patterns for a specific language
 */
export function getPatternsForLanguage(language: Language): PerformancePattern[] {
  return getAllPatterns().filter(
    pattern => pattern.languages.includes(language) || pattern.languages.includes('generic')
  );
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: PerformanceCategory): PerformancePattern[] {
  return getAllPatterns().filter(pattern => pattern.category === category);
}

/**
 * Performance thresholds for analysis
 */
export const performanceThresholds = {
  maxNestedLoops: 2,
  maxLoopComplexity: 10,
  maxFunctionCalls: 100,
  maxRecursionDepth: 50,
  warnOnComplexity: 'O(n²)' as BigOComplexity
};

// Made with Bob