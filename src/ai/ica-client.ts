/**
 * IBM ICA (IBM Consulting Advantage) AI Client
 * Handles integration with IBM ICA using OpenAI-compatible API for AI-powered code analysis
 */

import OpenAI from 'openai';
import { Finding, Severity, CodeSuggestion } from '../types';
import logger from '../utils/logger';

export interface ICAAnalysisResult {
  sentiment?: {
    score: number;
    label: string;
  };
  suggestions?: string[];
  explanation?: string;
  confidence?: number;
}

export class ICAClient {
  private client: OpenAI | null = null;
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private enabled: boolean;

  constructor(apiKey?: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey || process.env.ICA_API_KEY || '';
    this.baseUrl = baseUrl || process.env.ICA_BASE_URL || '';
    this.model = model || process.env.ICA_MODEL || 'global/anthropic.claude-sonnet-4-5-20250929-v1:0';
    this.enabled = !!this.apiKey && !!this.baseUrl;

    if (this.enabled) {
      try {
        this.client = new OpenAI({
          apiKey: this.apiKey,
          baseURL: this.baseUrl,
        });
        logger.info('IBM ICA client initialized successfully', { model: this.model });
      } catch (error) {
        logger.error('Failed to initialize IBM ICA client', error as Error);
        this.enabled = false;
      }
    } else {
      logger.warn('IBM ICA AI features disabled - missing API credentials');
      logger.info('Set ICA_API_KEY, ICA_BASE_URL, and ICA_MODEL in .env to enable AI features');
    }
  }

  /**
   * Check if ICA is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Analyze code using IBM ICA
   */
  async analyzeCode(code: string, language: string): Promise<ICAAnalysisResult> {
    if (!this.isEnabled()) {
      logger.debug('ICA analysis skipped - service not enabled');
      return {};
    }

    try {
      const prompt = `Analyze the following ${language} code for potential issues, security vulnerabilities, and improvements. Provide a brief analysis:

\`\`\`${language}
${code}
\`\`\`

Focus on:
1. Security vulnerabilities
2. Code quality issues
3. Performance concerns
4. Best practice violations

Provide a concise analysis.`;

      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '';
      
      return {
        explanation: content,
        confidence: 0.8,
      };
    } catch (error: any) {
      logger.error('ICA code analysis failed', {
        error: error.message,
        code: error.code,
      });
      return {};
    }
  }

  /**
   * Get AI-powered suggestions for code improvements
   */
  async getSuggestions(
    code: string,
    findings: Finding[],
    language: string
  ): Promise<CodeSuggestion[]> {
    if (!this.isEnabled()) {
      return this.getFallbackSuggestions(findings);
    }

    try {
      const findingsText = findings.slice(0, 3).map(f => 
        `- ${f.severity.toUpperCase()}: ${f.title} (${f.file}:${f.line})`
      ).join('\n');

      const prompt = `Given these code issues in ${language}:

${findingsText}

Code context:
\`\`\`${language}
${code.substring(0, 500)}...
\`\`\`

Provide 2-3 specific, actionable suggestions to fix these issues. Format each suggestion as:
TITLE: [brief title]
DESCRIPTION: [detailed explanation]
IMPACT: [low/medium/high]`;

      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Parse the response into suggestions
      const suggestions: CodeSuggestion[] = [];
      const sections = content.split('TITLE:').filter(s => s.trim());
      
      sections.forEach((section, index) => {
        const titleMatch = section.match(/^([^\n]+)/);
        const descMatch = section.match(/DESCRIPTION:\s*([^\n]+(?:\n(?!IMPACT:)[^\n]+)*)/);
        const impactMatch = section.match(/IMPACT:\s*(low|medium|high)/i);
        
        if (titleMatch && titleMatch[1]) {
          suggestions.push({
            id: `ica-${Date.now()}-${index}`,
            type: 'improvement',
            title: titleMatch[1].trim(),
            description: descMatch && descMatch[1] ? descMatch[1].trim() : '',
            confidence: 0.75,
            impact: (impactMatch?.[1]?.toLowerCase() as 'low' | 'medium' | 'high') || 'medium',
            effort: 'medium',
            tags: [language, 'ai-suggested'],
          });
        }
      });

      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(findings);
    } catch (error) {
      logger.error('Failed to generate ICA suggestions', error as Error);
      return this.getFallbackSuggestions(findings);
    }
  }

  /**
   * Explain a code issue in natural language using AI
   */
  async explainIssue(finding: Finding, code: string): Promise<string> {
    if (!this.isEnabled()) {
      return this.getFallbackExplanation(finding);
    }

    try {
      const context = this.extractCodeContext(code, finding.line || 0, 3);
      
      const prompt = `Explain this code issue in simple terms:

Issue: ${finding.title}
Severity: ${finding.severity}
File: ${finding.file}
Line: ${finding.line}

Code context:
\`\`\`
${context}
\`\`\`

Provide:
1. What the issue is
2. Why it's a problem
3. How to fix it

Keep it concise and actionable.`;

      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.4,
      });

      const explanation = response.choices[0]?.message?.content || '';
      
      return `**${finding.title}**\n\n${explanation}\n\n${this.getSeverityExplanation(finding.severity)}`;
    } catch (error) {
      logger.error('Failed to explain issue with ICA', error as Error);
      return this.getFallbackExplanation(finding);
    }
  }

  /**
   * Assess the severity of a finding using AI
   */
  async assessSeverity(
    finding: Finding,
    code: string,
    context: string
  ): Promise<{ severity: Severity; confidence: number; reasoning: string }> {
    if (!this.isEnabled()) {
      return {
        severity: finding.severity,
        confidence: 0.5,
        reasoning: 'Default severity assessment (ICA not available)',
      };
    }

    try {
      const prompt = `Assess the severity of this code issue:

Issue: ${finding.title}
Current Severity: ${finding.severity}
Type: ${finding.type}

Context:
${context.substring(0, 300)}

Rate the severity as: critical, high, medium, low, or info
Provide brief reasoning.

Format:
SEVERITY: [level]
REASONING: [explanation]`;

      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '';
      const severityMatch = content.match(/SEVERITY:\s*(critical|high|medium|low|info)/i);
      const reasoningMatch = content.match(/REASONING:\s*(.+)/i);

      return {
        severity: (severityMatch?.[1]?.toLowerCase() as Severity) || finding.severity,
        confidence: 0.8,
        reasoning: reasoningMatch?.[1]?.trim() || 'AI-based severity assessment',
      };
    } catch (error) {
      logger.error('Failed to assess severity with ICA', error as Error);
      return {
        severity: finding.severity,
        confidence: 0.5,
        reasoning: 'Error during AI assessment',
      };
    }
  }

  /**
   * Extract code context around a specific line
   */
  private extractCodeContext(code: string, line: number, contextLines: number): string {
    const lines = code.split('\n');
    const start = Math.max(0, line - contextLines - 1);
    const end = Math.min(lines.length, line + contextLines);
    return lines.slice(start, end).join('\n');
  }

  /**
   * Get fallback suggestions when ICA is not available
   */
  private getFallbackSuggestions(findings: Finding[]): CodeSuggestion[] {
    return findings.slice(0, 3).map(finding => ({
      id: `fallback-${finding.id}`,
      type: 'fix',
      title: finding.title,
      description: finding.suggestion || finding.description,
      confidence: 0.6,
      impact: this.mapSeverityToImpact(finding.severity),
      effort: 'medium',
      tags: [finding.type],
    }));
  }

  /**
   * Get fallback explanation when ICA is not available
   */
  private getFallbackExplanation(finding: Finding): string {
    let explanation = `**${finding.title}**\n\n`;
    explanation += `${finding.description}\n\n`;
    
    if (finding.suggestion) {
      explanation += `**Suggestion**: ${finding.suggestion}\n\n`;
    }
    
    explanation += this.getSeverityExplanation(finding.severity);
    
    return explanation;
  }

  /**
   * Get severity explanation
   */
  private getSeverityExplanation(severity: Severity): string {
    const explanations: Record<Severity, string> = {
      critical: '**Priority**: 🔴 Critical - Requires immediate attention. May cause security vulnerabilities or system failures.',
      high: '**Priority**: 🟠 High - Should be addressed before merging. Affects security, performance, or reliability.',
      medium: '**Priority**: 🟡 Medium - Should be fixed to improve code quality and maintainability.',
      low: '**Priority**: 🟢 Low - Minor issue that can be addressed in future iterations.',
      info: '**Priority**: ℹ️ Info - Informational finding for awareness.',
    };
    return explanations[severity];
  }

  /**
   * Map severity to impact level
   */
  private mapSeverityToImpact(severity: Severity): 'low' | 'medium' | 'high' {
    if (severity === 'critical' || severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }
}

// Export singleton instance
export default new ICAClient();

// Made with Bob