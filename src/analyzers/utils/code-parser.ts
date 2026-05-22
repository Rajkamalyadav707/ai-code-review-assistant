/**
 * Code Parser Utilities
 * Basic code parsing utilities for extracting functions, imports, and variables
 */

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'unknown';

export interface ParsedFunction {
  name: string;
  startLine: number;
  endLine: number;
  params: string[];
  isAsync: boolean;
  isExported: boolean;
}

export interface ParsedImport {
  module: string;
  imports: string[];
  line: number;
  isDefault: boolean;
}

export interface ParsedVariable {
  name: string;
  line: number;
  type: 'const' | 'let' | 'var' | 'unknown';
  isExported: boolean;
}

export interface CodeBlock {
  content: string;
  startLine: number;
  endLine: number;
  type: 'function' | 'class' | 'block';
}

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filename: string): Language {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, Language> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go'
  };
  
  return languageMap[ext || ''] || 'unknown';
}

/**
 * Split code into lines with line numbers
 */
export function getCodeLines(code: string): Array<{ line: number; content: string }> {
  return code.split('\n').map((content, index) => ({
    line: index + 1,
    content
  }));
}

/**
 * Extract functions from code
 */
export function extractFunctions(code: string, language: Language): ParsedFunction[] {
  const functions: ParsedFunction[] = [];
  const lines = code.split('\n');
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      return extractJavaScriptFunctions(lines);
    case 'python':
      return extractPythonFunctions(lines);
    case 'java':
      return extractJavaFunctions(lines);
    case 'go':
      return extractGoFunctions(lines);
    default:
      return [];
  }
}

/**
 * Extract JavaScript/TypeScript functions
 */
function extractJavaScriptFunctions(lines: string[]): ParsedFunction[] {
  const functions: ParsedFunction[] = [];
  
  // Patterns for different function declarations
  const patterns = [
    // function declaration: function name(params) { }
    /^\s*(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
    // arrow function: const name = (params) => { }
    /^\s*(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/,
    // method: name(params) { }
    /^\s*(async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const isExported = line.includes('export');
        const isAsync = line.includes('async');
        const name = match[3] || match[2] || '';
        const params = (match[4] || match[3] || '').split(',').map(p => p.trim()).filter(Boolean);
        
        // Find end of function by counting braces
        let braceCount = 0;
        let endLine = i;
        let foundStart = false;
        
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          if (!currentLine) continue;
          
          for (const char of currentLine) {
            if (char === '{') {
              braceCount++;
              foundStart = true;
            } else if (char === '}') {
              braceCount--;
            }
          }
          
          if (foundStart && braceCount === 0) {
            endLine = j;
            break;
          }
        }
        
        functions.push({
          name,
          startLine: i + 1,
          endLine: endLine + 1,
          params,
          isAsync,
          isExported
        });
        
        break;
      }
    }
  }
  
  return functions;
}

/**
 * Extract Python functions
 */
function extractPythonFunctions(lines: string[]): ParsedFunction[] {
  const functions: ParsedFunction[] = [];
  const pattern = /^\s*(async\s+)?def\s+(\w+)\s*\(([^)]*)\)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const match = line.match(pattern);
    
    if (match) {
      const isAsync = !!match[1];
      const name = match[2] || '';
      const params = (match[3] || '').split(',')
        .map(p => {
          const parts = p.trim().split(':');
          return parts[0]?.split('=')[0]?.trim() || '';
        })
        .filter(Boolean);
      
      // Find end of function by indentation
      const indent = line.match(/^\s*/)?.[0].length || 0;
      let endLine = i;
      
      for (let j = i + 1; j < lines.length; j++) {
        const currentLine = lines[j];
        if (!currentLine || currentLine.trim() === '') continue;
        
        const currentIndent = currentLine.match(/^\s*/)?.[0].length || 0;
        if (currentIndent <= indent) {
          endLine = j - 1;
          break;
        }
        endLine = j;
      }
      
      functions.push({
        name,
        startLine: i + 1,
        endLine: endLine + 1,
        params,
        isAsync,
        isExported: false // Python doesn't have explicit exports
      });
    }
  }
  
  return functions;
}

/**
 * Extract Java functions (methods)
 */
function extractJavaFunctions(lines: string[]): ParsedFunction[] {
  const functions: ParsedFunction[] = [];
  const pattern = /^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:\w+)\s+(\w+)\s*\(([^)]*)\)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const match = line.match(pattern);
    
    if (match && !line.includes('class ')) {
      const name = match[1] || '';
      const params = (match[2] || '').split(',')
        .map(p => {
          const parts = p.trim().split(/\s+/);
          return parts[parts.length - 1] || '';
        })
        .filter(Boolean);
      
      // Find end of method by counting braces
      let braceCount = 0;
      let endLine = i;
      let foundStart = false;
      
      for (let j = i; j < lines.length; j++) {
        const currentLine = lines[j];
        if (!currentLine) continue;
        
        for (const char of currentLine) {
          if (char === '{') {
            braceCount++;
            foundStart = true;
          } else if (char === '}') {
            braceCount--;
          }
        }
        
        if (foundStart && braceCount === 0) {
          endLine = j;
          break;
        }
      }
      
      functions.push({
        name,
        startLine: i + 1,
        endLine: endLine + 1,
        params,
        isAsync: false,
        isExported: line.includes('public')
      });
    }
  }
  
  return functions;
}

/**
 * Extract Go functions
 */
function extractGoFunctions(lines: string[]): ParsedFunction[] {
  const functions: ParsedFunction[] = [];
  const pattern = /^\s*func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(([^)]*)\)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const match = line.match(pattern);
    
    if (match) {
      const name = match[1] || '';
      const params = (match[2] || '').split(',')
        .map(p => {
          const parts = p.trim().split(/\s+/);
          return parts[0] || '';
        })
        .filter(Boolean);
      const isExported = name.length > 0 && name[0] === name[0]?.toUpperCase();
      
      // Find end of function by counting braces
      let braceCount = 0;
      let endLine = i;
      let foundStart = false;
      
      for (let j = i; j < lines.length; j++) {
        const currentLine = lines[j];
        if (!currentLine) continue;
        
        for (const char of currentLine) {
          if (char === '{') {
            braceCount++;
            foundStart = true;
          } else if (char === '}') {
            braceCount--;
          }
        }
        
        if (foundStart && braceCount === 0) {
          endLine = j;
          break;
        }
      }
      
      functions.push({
        name,
        startLine: i + 1,
        endLine: endLine + 1,
        params,
        isAsync: false,
        isExported
      });
    }
  }
  
  return functions;
}

/**
 * Extract imports from code
 */
export function extractImports(code: string, language: Language): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const lines = code.split('\n');
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      return extractJavaScriptImports(lines);
    case 'python':
      return extractPythonImports(lines);
    case 'java':
      return extractJavaImports(lines);
    case 'go':
      return extractGoImports(lines);
    default:
      return [];
  }
}

/**
 * Extract JavaScript/TypeScript imports
 */
function extractJavaScriptImports(lines: string[]): ParsedImport[] {
  const imports: ParsedImport[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const trimmedLine = line.trim();
    
    // import ... from '...'
    const importMatch = trimmedLine.match(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const importClause = importMatch[1];
      const module = importMatch[2];
      if (!importClause || !module) continue;
      
      const isDefault = !importClause.includes('{');
      
      let importNames: string[] = [];
      if (isDefault) {
        importNames = [importClause.trim()];
      } else {
        const namedImports = importClause.match(/\{([^}]+)\}/);
        if (namedImports && namedImports[1]) {
          importNames = namedImports[1].split(',')
            .map(i => {
              const parts = i.trim().split(/\s+as\s+/);
              return parts[0] || '';
            })
            .filter(Boolean);
        }
      }
      
      imports.push({
        module,
        imports: importNames,
        line: i + 1,
        isDefault
      });
    }
    
    // require('...')
    const requireMatch = trimmedLine.match(/(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(['"]([^'"]+)['"]\)/);
    if (requireMatch) {
      const module = requireMatch[3];
      if (!module) continue;
      
      const isDefault = !!requireMatch[2];
      const importNames = isDefault 
        ? [requireMatch[2] || '']
        : (requireMatch[1] || '').split(',').map(i => i.trim()).filter(Boolean);
      
      imports.push({
        module,
        imports: importNames,
        line: i + 1,
        isDefault
      });
    }
  }
  
  return imports;
}

/**
 * Extract Python imports
 */
function extractPythonImports(lines: string[]): ParsedImport[] {
  const imports: ParsedImport[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const trimmedLine = line.trim();
    
    // from ... import ...
    const fromImportMatch = trimmedLine.match(/^from\s+([^\s]+)\s+import\s+(.+)/);
    if (fromImportMatch) {
      const module = fromImportMatch[1];
      const importList = fromImportMatch[2];
      if (!module || !importList) continue;
      
      const importNames = importList.split(',')
        .map(i => {
          const parts = i.trim().split(/\s+as\s+/);
          return parts[0] || '';
        })
        .filter(Boolean);
      
      imports.push({
        module,
        imports: importNames,
        line: i + 1,
        isDefault: false
      });
    }
    
    // import ...
    const importMatch = trimmedLine.match(/^import\s+(.+)/);
    if (importMatch && !trimmedLine.includes('from')) {
      const importList = importMatch[1];
      if (!importList) continue;
      
      const modules = importList.split(',')
        .map(m => {
          const parts = m.trim().split(/\s+as\s+/);
          return parts[0] || '';
        })
        .filter(Boolean);
      
      modules.forEach(module => {
        imports.push({
          module,
          imports: [module],
          line: i + 1,
          isDefault: true
        });
      });
    }
  }
  
  return imports;
}

/**
 * Extract Java imports
 */
function extractJavaImports(lines: string[]): ParsedImport[] {
  const imports: ParsedImport[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const trimmedLine = line.trim();
    const match = trimmedLine.match(/^import\s+(?:static\s+)?([^;]+);/);
    
    if (match) {
      const fullPath = match[1];
      if (!fullPath) continue;
      
      const parts = fullPath.split('.');
      const className = parts[parts.length - 1] || '';
      
      imports.push({
        module: fullPath,
        imports: [className],
        line: i + 1,
        isDefault: true
      });
    }
  }
  
  return imports;
}

/**
 * Extract Go imports
 */
function extractGoImports(lines: string[]): ParsedImport[] {
  const imports: ParsedImport[] = [];
  let inImportBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const trimmedLine = line.trim();
    
    // Single import
    const singleMatch = trimmedLine.match(/^import\s+"([^"]+)"/);
    if (singleMatch) {
      const module = singleMatch[1];
      if (!module) continue;
      
      const packageName = module.split('/').pop() || module;
      
      imports.push({
        module,
        imports: [packageName],
        line: i + 1,
        isDefault: true
      });
    }
    
    // Import block start
    if (trimmedLine === 'import (') {
      inImportBlock = true;
      continue;
    }
    
    // Import block end
    if (inImportBlock && trimmedLine === ')') {
      inImportBlock = false;
      continue;
    }
    
    // Inside import block
    if (inImportBlock) {
      const blockMatch = trimmedLine.match(/"([^"]+)"/);
      if (blockMatch) {
        const module = blockMatch[1];
        if (!module) continue;
        
        const packageName = module.split('/').pop() || module;
        
        imports.push({
          module,
          imports: [packageName],
          line: i + 1,
          isDefault: true
        });
      }
    }
  }
  
  return imports;
}

/**
 * Extract variable declarations
 */
export function extractVariables(code: string, language: Language): ParsedVariable[] {
  const variables: ParsedVariable[] = [];
  const lines = code.split('\n');
  
  if (language === 'javascript' || language === 'typescript') {
    const pattern = /^\s*(export\s+)?(const|let|var)\s+(\w+)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const match = line.match(pattern);
      
      if (match) {
        const varType = match[2];
        const varName = match[3];
        if (!varType || !varName) continue;
        
        variables.push({
          name: varName,
          line: i + 1,
          type: varType as 'const' | 'let' | 'var',
          isExported: !!match[1]
        });
      }
    }
  }
  
  return variables;
}

/**
 * Extract code blocks (functions, classes, etc.)
 */
export function extractCodeBlocks(code: string, language: Language): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = code.split('\n');
  
  // Extract functions as blocks
  const functions = extractFunctions(code, language);
  functions.forEach(func => {
    blocks.push({
      content: lines.slice(func.startLine - 1, func.endLine).join('\n'),
      startLine: func.startLine,
      endLine: func.endLine,
      type: 'function'
    });
  });
  
  return blocks;
}

/**
 * Get context around a specific line
 */
export function getLineContext(code: string, lineNumber: number, contextLines: number = 3): string {
  const lines = code.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);
  
  return lines.slice(start, end)
    .map((line, index) => {
      const actualLine = start + index + 1;
      const marker = actualLine === lineNumber ? '> ' : '  ';
      return `${marker}${actualLine}: ${line}`;
    })
    .join('\n');
}

/**
 * Check if a line is inside a comment
 */
export function isInComment(code: string, lineNumber: number, language: Language): boolean {
  const lines = code.split('\n');
  if (lineNumber < 1 || lineNumber > lines.length) return false;
  
  const line = lines[lineNumber - 1];
  if (!line) return false;
  
  const trimmedLine = line.trim();
  
  // Single-line comments
  if (language === 'javascript' || language === 'typescript' || language === 'java' || language === 'go') {
    if (trimmedLine.startsWith('//')) return true;
  }
  
  if (language === 'python') {
    if (trimmedLine.startsWith('#')) return true;
  }
  
  // Multi-line comments (simplified check)
  const beforeLine = lines.slice(0, lineNumber).join('\n');
  
  if (language === 'javascript' || language === 'typescript' || language === 'java') {
    const openComments = (beforeLine.match(/\/\*/g) || []).length;
    const closeComments = (beforeLine.match(/\*\//g) || []).length;
    return openComments > closeComments;
  }
  
  if (language === 'python') {
    const tripleQuotes = (beforeLine.match(/"""|'''/g) || []).length;
    return tripleQuotes % 2 === 1;
  }
  
  return false;
}

/**
 * Remove comments from code
 */
export function removeComments(code: string, language: Language): string {
  let result = code;
  
  if (language === 'javascript' || language === 'typescript' || language === 'java') {
    // Remove single-line comments
    result = result.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  } else if (language === 'python') {
    // Remove single-line comments
    result = result.replace(/#.*$/gm, '');
    // Remove docstrings (simplified)
    result = result.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, '');
  }
  
  return result;
}

// Made with Bob