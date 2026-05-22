/**
 * Performance Analyzer Tests
 * Tests for the performance analysis module
 */

import { PerformanceAnalyzer } from '../src/analyzers/performance-analyzer';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  describe('Nested Loops Detection', () => {
    it('should detect double nested loops', async () => {
      const code = `
        function findDuplicates(arr1, arr2) {
          for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
              if (arr1[i] === arr2[j]) {
                console.log('Found duplicate');
              }
            }
          }
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.algorithmAnalysis.maxNestingLevel).toBeGreaterThanOrEqual(1);
      expect(result.summary.issuesByCategory.algorithm).toBeGreaterThan(0);
    });

    it('should detect triple nested loops', async () => {
      const code = `
        function tripleLoop(n) {
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              for (let k = 0; k < n; k++) {
                console.log(i, j, k);
              }
            }
          }
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      expect(result.algorithmAnalysis.maxNestingLevel).toBeGreaterThanOrEqual(2);
      expect(result.algorithmAnalysis.timeComplexity).toBe('O(n³)');
      expect(result.performanceScore).toBeLessThan(70);
    });
  });

  describe('Memory Issues Detection', () => {
    it('should detect event listener without cleanup', async () => {
      const code = `
        function setupListener() {
          const button = document.getElementById('btn');
          button.addEventListener('click', handleClick);
          // Missing removeEventListener
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      const memoryIssues = result.issues.filter(i => i.category === 'memory');
      expect(memoryIssues.length).toBeGreaterThan(0);
    });

    it('should detect setInterval without clearInterval', async () => {
      const code = `
        function startTimer() {
          setInterval(() => {
            console.log('tick');
          }, 1000);
          // Missing clearInterval
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      const memoryIssues = result.issues.filter(i => i.category === 'memory');
      expect(memoryIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Database Performance', () => {
    it('should detect N+1 query problem', async () => {
      const code = `
        async function getUsers(ids) {
          for (let id of ids) {
            const user = await User.findById(id);
            console.log(user);
          }
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      const dbIssues = result.issues.filter(i => i.category === 'database');
      expect(dbIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Network Performance', () => {
    it('should detect sequential API requests', async () => {
      const code = `
        async function fetchData() {
          const user = await fetch('/api/user');
          const posts = await fetch('/api/posts');
          return { user, posts };
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      const networkIssues = result.issues.filter(i => i.category === 'network');
      expect(networkIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering Performance', () => {
    it('should detect DOM manipulation in loop', async () => {
      const code = `
        function renderItems(items) {
          for (let item of items) {
            const div = document.createElement('div');
            div.textContent = item;
            document.body.appendChild(div);
          }
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      const renderingIssues = result.issues.filter(i => i.category === 'rendering');
      expect(renderingIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Inefficient Patterns', () => {
    it('should detect string concatenation in loop', async () => {
      const code = `
        function buildString(items) {
          let result = '';
          for (let item of items) {
            result += item;
          }
          return result;
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      const inefficientIssues = result.issues.filter(
        i => i.category === 'inefficient_pattern'
      );
      expect(inefficientIssues.length).toBeGreaterThan(0);
    });

    it('should detect chained filter and map', async () => {
      const code = `
        const result = items
          .filter(x => x > 0)
          .map(x => x * 2);
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      const inefficientIssues = result.issues.filter(
        i => i.category === 'inefficient_pattern'
      );
      expect(inefficientIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Score', () => {
    it('should give high score for efficient code', async () => {
      const code = `
        function efficientSearch(arr, target) {
          const set = new Set(arr);
          return set.has(target);
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      expect(result.performanceScore).toBeGreaterThan(80);
      expect(result.issues.length).toBe(0);
    });

    it('should give low score for inefficient code', async () => {
      const code = `
        function inefficientSearch(arr1, arr2, arr3) {
          for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
              for (let k = 0; k < arr3.length; k++) {
                if (arr1[i] === arr2[j] && arr2[j] === arr3[k]) {
                  return true;
                }
              }
            }
          }
          return false;
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      expect(result.performanceScore).toBeLessThan(50);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations for nested loops', async () => {
      const code = `
        function search(arr1, arr2) {
          for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
              if (arr1[i] === arr2[j]) return true;
            }
          }
          return false;
        }
      `;

      const result = await analyzer.analyze(code, 'test.js');
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => 
        r.toLowerCase().includes('hash') || r.toLowerCase().includes('set')
      )).toBe(true);
    });
  });

  describe('Multiple Files Analysis', () => {
    it('should analyze multiple files', async () => {
      const files = [
        {
          filename: 'file1.js',
          content: 'for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) {} }'
        },
        {
          filename: 'file2.js',
          content: 'const result = items.filter(x => x > 0).map(x => x * 2);'
        }
      ];

      const results = await analyzer.analyzeFiles(files);
      
      expect(results.length).toBe(2);
      expect(results[0].issues.length).toBeGreaterThan(0);
      expect(results[1].issues.length).toBeGreaterThan(0);
    });

    it('should provide overall statistics', async () => {
      const files = [
        {
          filename: 'file1.js',
          content: 'for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) {} }'
        },
        {
          filename: 'file2.js',
          content: 'for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { for (let k = 0; k < n; k++) {} } }'
        }
      ];

      const results = await analyzer.analyzeFiles(files);
      const stats = analyzer.getOverallStatistics(results);
      
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalIssues).toBeGreaterThan(0);
      expect(stats.filesWithHighComplexity).toBeGreaterThan(0);
    });
  });

  describe('Language Support', () => {
    it('should analyze Python code', async () => {
      const code = `
def nested_loop(arr1, arr2):
    for i in arr1:
        for j in arr2:
            if i == j:
                print("match")
      `;

      const result = await analyzer.analyze(code, 'test.py');
      
      expect(result.language).toBe('python');
      expect(result.algorithmAnalysis.nestedLoops.length).toBeGreaterThan(0);
    });

    it('should analyze Java code', async () => {
      const code = `
public class Test {
    public void concat(String[] items) {
        String result = "";
        for (String item : items) {
            result += item;
        }
    }
}
      `;

      const result = await analyzer.analyze(code, 'Test.java');
      
      expect(result.language).toBe('java');
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
});

// Made with Bob