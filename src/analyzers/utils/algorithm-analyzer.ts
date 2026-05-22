/**
 * Algorithm Analyzer Utility
 * Analyzes code for algorithmic complexity and inefficient patterns
 */

import { BigOComplexity } from '../patterns/performance-patterns';

export interface LoopInfo {
  type: 'for' | 'while' | 'forEach' | 'map' | 'filter' | 'reduce';
  startLine: number;
  endLine: number;
  nestingLevel: number;
  iteratesOver?: string;
  bodyComplexity: number;
}

export interface RecursionInfo {
  functionName: string;
  line: number;
  callsItself: boolean;
  potentialStackOverflow: boolean;
  estimatedDepth?: number;
}

export interface ComplexityAnalysis {
  timeComplexity: BigOComplexity;
  spaceComplexity: BigOComplexity;
  nestedLoops: LoopInfo[];
  maxNestingLevel: number;
  recursiveCalls: RecursionInfo[];
  inefficientOperations: Array<{
    operation: string;
    line: number;
    reason: string;
    suggestion?: string;
  }>;
}

/**
 * Detect nested loops in code
 */
export function detectNestedLoops(code: string, language: string): LoopInfo[] {
  const loops: LoopInfo[] = [];
  const lines = code.split('\n');
  const stack: Array<{ type: string; line: number; indent: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const indent = line.search(/\S/);
    
    // Remove completed loops from stack based on indentation
    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    // Detect different loop types
    const forMatch = line.match(/\bfor\s*\(/);
    const whileMatch = line.match(/\bwhile\s*\(/);
    const forEachMatch = line.match(/\.forEach\s*\(/);
    const mapMatch = line.match(/\.map\s*\(/);
    const filterMatch = line.match(/\.filter\s*\(/);
    const reduceMatch = line.match(/\.reduce\s*\(/);
    const pythonForMatch = language === 'python' && line.match(/\bfor\s+\w+\s+in\s+/);

    let loopType: LoopInfo['type'] | null = null;
    let iteratesOver: string | undefined;

    if (forMatch || pythonForMatch) {
      loopType = 'for';
      const iterMatch = line.match(/for\s*\([^;]*;\s*([^;]+);/) ||
                       line.match(/for\s+\w+\s+in\s+(\w+)/);
      iteratesOver = iterMatch && iterMatch[1] ? iterMatch[1].trim() : undefined;
    } else if (whileMatch) {
      loopType = 'while';
    } else if (forEachMatch) {
      loopType = 'forEach';
      const iterMatch = line.match(/(\w+)\.forEach/);
      iteratesOver = iterMatch ? iterMatch[1] : undefined;
    } else if (mapMatch) {
      loopType = 'map';
    } else if (filterMatch) {
      loopType = 'filter';
    } else if (reduceMatch) {
      loopType = 'reduce';
    }

    if (loopType) {
      const nestingLevel = stack.length;
      
      loops.push({
        type: loopType,
        startLine: i + 1,
        endLine: i + 1, // Will be updated when we find the end
        nestingLevel,
        iteratesOver,
        bodyComplexity: 1
      });

      stack.push({ type: loopType, line: i + 1, indent });
    }
  }

  return loops;
}

/**
 * Calculate time complexity based on nested loops
 */
export function calculateTimeComplexity(loops: LoopInfo[]): BigOComplexity {
  if (loops.length === 0) {
    return 'O(1)';
  }

  const maxNesting = Math.max(...loops.map(l => l.nestingLevel));

  // Check for nested loops at same level
  const nestingCounts = new Map<number, number>();
  for (const loop of loops) {
    nestingCounts.set(loop.nestingLevel, (nestingCounts.get(loop.nestingLevel) || 0) + 1);
  }

  // Find maximum nesting depth
  let maxDepth = 0;
  for (const loop of loops) {
    if (loop.nestingLevel > maxDepth) {
      maxDepth = loop.nestingLevel;
    }
  }

  // Estimate complexity based on nesting
  if (maxDepth >= 3) {
    return 'O(n³)';
  } else if (maxDepth === 2) {
    return 'O(n²)';
  } else if (maxDepth === 1) {
    // Check if there's sorting or binary search
    return 'O(n)';
  }

  return 'O(n)';
}

/**
 * Detect recursive function calls
 */
export function detectRecursion(code: string, language: string): RecursionInfo[] {
  const recursions: RecursionInfo[] = [];
  const lines = code.split('\n');
  
  // Extract function names
  const functionPattern = language === 'python' 
    ? /def\s+(\w+)\s*\(/g
    : /function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(\w+)\s*:\s*\([^)]*\)\s*=>/g;

  const functions = new Set<string>();
  let match;
  
  while ((match = functionPattern.exec(code)) !== null) {
    const funcName = match[1] || match[2] || match[3];
    if (funcName) {
      functions.add(funcName);
    }
  }

  // Check for recursive calls
  for (const funcName of functions) {
    const funcDefPattern = language === 'python'
      ? new RegExp(`def\\s+${funcName}\\s*\\(`, 'g')
      : new RegExp(`(?:function\\s+${funcName}|const\\s+${funcName}\\s*=)`, 'g');
    
    const defMatch = funcDefPattern.exec(code);
    if (!defMatch) continue;

    const defLine = code.substring(0, defMatch.index).split('\n').length;
    
    // Look for calls to itself
    const callPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    let callMatch;
    let callsItself = false;
    
    while ((callMatch = callPattern.exec(code)) !== null) {
      const callLine = code.substring(0, callMatch.index).split('\n').length;
      
      // If call is after definition, it might be recursive
      if (callLine > defLine) {
        callsItself = true;
        
        recursions.push({
          functionName: funcName,
          line: callLine,
          callsItself: true,
          potentialStackOverflow: !hasBaseCase(code, funcName, language),
          estimatedDepth: estimateRecursionDepth(code, funcName)
        });
        break;
      }
    }
  }

  return recursions;
}

/**
 * Check if recursive function has a base case
 */
function hasBaseCase(code: string, functionName: string, language: string): boolean {
  // Look for return statements that don't call the function
  const funcPattern = language === 'python'
    ? new RegExp(`def\\s+${functionName}[^:]+:([\\s\\S]*?)(?=\\ndef\\s|$)`)
    : new RegExp(`(?:function\\s+${functionName}|const\\s+${functionName}\\s*=)[^{]*{([^}]*)}`, 's');
  
  const match = funcPattern.exec(code);
  if (!match) return false;

  const funcBody = match[1];
  if (!funcBody) return false;
  
  // Check for return statements without recursive call
  const returnPattern = /return\s+(?!.*\b${functionName}\s*\()/;
  return returnPattern.test(funcBody);
}

/**
 * Estimate recursion depth
 */
function estimateRecursionDepth(code: string, functionName: string): number {
  // This is a heuristic - look for patterns that suggest depth
  const dividePattern = /\/\s*2|>>|\/\/\s*2/;
  const decrementPattern = /-\s*1|--/;
  
  if (dividePattern.test(code)) {
    return 10; // Log depth (like binary search)
  } else if (decrementPattern.test(code)) {
    return 100; // Linear depth
  }
  
  return 50; // Unknown, assume moderate
}

/**
 * Detect inefficient array/string operations
 */
export function detectInefficientOperations(code: string, language: string): Array<{
  operation: string;
  line: number;
  reason: string;
  suggestion?: string;
}> {
  const inefficiencies: Array<{
    operation: string;
    line: number;
    reason: string;
    suggestion?: string;
  }> = [];
  
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // String concatenation in loop
    if (/for\s*\(/.test(line) || /while\s*\(/.test(line)) {
      // Check next few lines for string concatenation
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const nextLine = lines[j];
        if (nextLine && /\w+\s*\+=\s*["']/.test(nextLine)) {
          inefficiencies.push({
            operation: 'string_concat_loop',
            line: j + 1,
            reason: 'String concatenation in loop creates many intermediate strings',
            suggestion: 'Use array.join() or StringBuilder for better performance'
          });
        }
      }
    }

    // Array.includes in loop
    if (/for\s*\(/.test(line)) {
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const nextLine = lines[j];
        if (nextLine && /\.includes\s*\(|\.indexOf\s*\(/.test(nextLine)) {
          inefficiencies.push({
            operation: 'array_search_loop',
            line: j + 1,
            reason: 'Array search in loop results in O(n²) complexity',
            suggestion: 'Convert array to Set for O(1) lookups'
          });
        }
      }
    }

    // Repeated array length calculation
    if (/for\s*\([^;]*;\s*\w+\s*<\s*\w+\.length/.test(line)) {
      inefficiencies.push({
        operation: 'repeated_length_calc',
        line: i + 1,
        reason: 'Array length calculated on every iteration',
        suggestion: 'Cache length before loop: const len = array.length'
      });
    }

    // Object creation in loop
    if (/for\s*\(/.test(line)) {
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const nextLine = lines[j];
        if (nextLine && /new\s+\w+\s*\(|{\s*\w+:/.test(nextLine) && !/\/\//.test(nextLine)) {
          inefficiencies.push({
            operation: 'object_creation_loop',
            line: j + 1,
            reason: 'Creating objects in loop can cause memory pressure',
            suggestion: 'Consider object pooling or reusing objects'
          });
          break;
        }
      }
    }

    // Nested array methods
    if (/\.filter\s*\([^)]+\)\s*\.map\s*\(/.test(line)) {
      inefficiencies.push({
        operation: 'chained_array_methods',
        line: i + 1,
        reason: 'Chained filter().map() iterates array twice',
        suggestion: 'Use reduce() or flatMap() to iterate once'
      });
    }

    // Synchronous file operations in Node.js
    if (/fs\.(readFileSync|writeFileSync|existsSync)/.test(line)) {
      inefficiencies.push({
        operation: 'sync_file_operation',
        line: i + 1,
        reason: 'Synchronous file operations block the event loop',
        suggestion: 'Use async versions: fs.promises.readFile() or fs.readFile() with callback'
      });
    }
  }

  return inefficiencies;
}

/**
 * Suggest algorithmic improvements
 */
export function suggestAlgorithmicImprovements(
  complexity: BigOComplexity,
  loops: LoopInfo[],
  code: string
): string[] {
  const suggestions: string[] = [];

  if (complexity === 'O(n³)' || complexity === 'O(n²)') {
    suggestions.push(
      'Consider using hash maps (Map/Set) to reduce lookup time from O(n) to O(1)'
    );
    suggestions.push(
      'Look for opportunities to use binary search if data is sorted'
    );
    suggestions.push(
      'Consider using dynamic programming to avoid redundant calculations'
    );
  }

  // Check for nested loops that could be optimized
  const nestedLoops = loops.filter(l => l.nestingLevel > 0);
  if (nestedLoops.length > 0) {
    suggestions.push(
      'Break down nested loops by preprocessing data into hash maps or indexes'
    );
    suggestions.push(
      'Consider using early termination (break) when result is found'
    );
  }

  // Check for array operations
  if (code.includes('.filter') && code.includes('.map')) {
    suggestions.push(
      'Combine filter() and map() into a single reduce() operation'
    );
  }

  if (code.includes('.sort()')) {
    suggestions.push(
      'If sorting is not necessary, consider using a Set or Map for O(1) lookups'
    );
  }

  return suggestions;
}

/**
 * Analyze overall algorithm complexity
 */
export function analyzeAlgorithmComplexity(
  code: string,
  language: string
): ComplexityAnalysis {
  const loops = detectNestedLoops(code, language);
  const timeComplexity = calculateTimeComplexity(loops);
  const recursions = detectRecursion(code, language);
  const inefficientOps = detectInefficientOperations(code, language);

  // Calculate space complexity (simplified)
  let spaceComplexity: BigOComplexity = 'O(1)';
  if (recursions.length > 0) {
    spaceComplexity = 'O(n)'; // Recursion uses stack space
  } else if (code.includes('new Array') || code.includes('[]')) {
    spaceComplexity = 'O(n)'; // Array allocation
  }

  const maxNestingLevel = loops.length > 0 
    ? Math.max(...loops.map(l => l.nestingLevel))
    : 0;

  return {
    timeComplexity,
    spaceComplexity,
    nestedLoops: loops,
    maxNestingLevel,
    recursiveCalls: recursions,
    inefficientOperations: inefficientOps
  };
}

/**
 * Check if complexity is acceptable
 */
export function isComplexityAcceptable(
  complexity: BigOComplexity,
  codeSize: number
): boolean {
  // For small code, higher complexity is acceptable
  if (codeSize < 50) {
    return true;
  }

  // For larger code, be more strict
  const unacceptable: BigOComplexity[] = ['O(n³)', 'O(2ⁿ)', 'O(n!)'];
  return !unacceptable.includes(complexity);
}

/**
 * Get complexity score (0-100, higher is better)
 */
export function getComplexityScore(complexity: BigOComplexity): number {
  const scores: Record<BigOComplexity, number> = {
    'O(1)': 100,
    'O(log n)': 95,
    'O(n)': 85,
    'O(n log n)': 75,
    'O(n²)': 50,
    'O(n³)': 25,
    'O(2ⁿ)': 10,
    'O(n!)': 0
  };
  
  return scores[complexity] || 50;
}

// Made with Bob