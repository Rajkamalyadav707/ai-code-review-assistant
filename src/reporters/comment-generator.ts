/**
 * Comment Generator
 * Generates formatted comments for GitHub PRs
 */

import { Finding, Severity, AnalysisSummary } from '../types';

export interface Comment {
  body: string;
  path: string;
  line: number;
  side: 'LEFT' | 'RIGHT';
  commit_id: string;
}

export class CommentGenerator {
  /**
   * Generate PR review comment from a finding
   */
  generateComment(finding: Finding, commitId: string): Comment {
    const severityEmoji = this.getSeverityEmoji(finding.severity);
    const typeIcon = this.getTypeIcon(finding.type);
    
    let body = `${severityEmoji} **${finding.severity.toUpperCase()}**: ${typeIcon} ${finding.title}\n\n`;
    body += `${finding.description}\n\n`;
    
    if (finding.code) {
      body += '**Code:**\n```\n' + finding.code + '\n```\n\n';
    }
    
    if (finding.suggestion) {
      body += `💡 **Suggestion:**\n${finding.suggestion}\n\n`;
    }
    
    if (finding.references && finding.references.length > 0) {
      body += '**References:**\n';
      finding.references.forEach(ref => {
        body += `- ${ref}\n`;
      });
      body += '\n';
    }
    
    if (finding.ruleId) {
      body += `_Rule: ${finding.ruleId}_\n`;
    }
    
    return {
      body: body.trim(),
      path: finding.file,
      line: finding.line || 1,
      side: 'RIGHT',
      commit_id: commitId
    };
  }

  /**
   * Generate summary comment for PR
   */
  generateSummary(
    findings: Finding[],
    summary: AnalysisSummary,
    prNumber: number,
    repository: string
  ): string {
    let comment = `## 🤖 AI Code Review Summary\n\n`;
    comment += `**PR #${prNumber}** in \`${repository}\`\n\n`;
    
    // Overall status
    const status = this.getOverallStatus(summary);
    comment += `### ${status.emoji} Overall Status: ${status.text}\n\n`;
    
    // Statistics
    comment += `### 📊 Analysis Statistics\n\n`;
    comment += this.generateStatsTable(summary);
    comment += '\n\n';
    
    // Findings by severity
    if (findings.length > 0) {
      comment += `### 🔍 Findings by Severity\n\n`;
      comment += this.generateFindingsTable(findings);
      comment += '\n\n';
    }
    
    // Findings by type
    const findingsByType = this.groupFindingsByType(findings);
    if (Object.keys(findingsByType).length > 0) {
      comment += `### 📋 Findings by Category\n\n`;
      Object.entries(findingsByType).forEach(([type, count]) => {
        const icon = this.getTypeIcon(type as Finding['type']);
        comment += `- ${icon} **${this.capitalizeFirst(type)}**: ${count} issue(s)\n`;
      });
      comment += '\n\n';
    }
    
    // Critical/High issues detail
    const criticalAndHigh = findings.filter(f =>
      f.severity === 'critical' || f.severity === 'high'
    );
    
    if (criticalAndHigh.length > 0) {
      comment += `### ⚠️ Critical & High Priority Issues\n\n`;
      criticalAndHigh.slice(0, 10).forEach((finding, index) => {
        comment += this.formatIssue(finding, index + 1);
      });
      
      if (criticalAndHigh.length > 10) {
        comment += `\n_... and ${criticalAndHigh.length - 10} more critical/high issues. See individual file comments for details._\n\n`;
      }
    }
    
    // Recommendations
    comment += `### 💡 Recommendations\n\n`;
    comment += this.generateRecommendations(summary, findings);
    
    // Footer
    comment += `\n\n---\n`;
    comment += `_Analysis completed in ${(summary.analysisTime / 1000).toFixed(2)}s | `;
    comment += `${summary.filesAnalyzed} files | ${summary.linesAnalyzed} lines analyzed_\n`;
    comment += `_Powered by AI Code Review Assistant_`;
    
    return comment;
  }

  /**
   * Format a single issue
   */
  private formatIssue(finding: Finding, index: number): string {
    const emoji = this.getSeverityEmoji(finding.severity);
    const typeIcon = this.getTypeIcon(finding.type);
    
    let issue = `${index}. ${emoji} **${finding.title}**\n`;
    issue += `   - ${typeIcon} Type: ${this.capitalizeFirst(finding.type)}\n`;
    issue += `   - 📁 File: \`${finding.file}\``;
    
    if (finding.line) {
      issue += ` (Line ${finding.line}`;
      if (finding.endLine && finding.endLine !== finding.line) {
        issue += `-${finding.endLine}`;
      }
      issue += ')';
    }
    issue += '\n';
    
    issue += `   - 📝 ${finding.description}\n`;
    
    if (finding.suggestion) {
      issue += `   - 💡 Suggestion: ${finding.suggestion}\n`;
    }
    
    issue += '\n';
    return issue;
  }

  /**
   * Generate statistics table
   */
  private generateStatsTable(summary: AnalysisSummary): string {
    return `| Metric | Value |
|--------|-------|
| Total Findings | ${summary.totalFindings} |
| 🔴 Critical | ${summary.criticalCount} |
| 🟠 High | ${summary.highCount} |
| 🟡 Medium | ${summary.mediumCount} |
| 🟢 Low | ${summary.lowCount} |
| ℹ️ Info | ${summary.infoCount} |
| Files Analyzed | ${summary.filesAnalyzed} |
| Lines Analyzed | ${summary.linesAnalyzed.toLocaleString()} |`;
  }

  /**
   * Generate findings table
   */
  private generateFindingsTable(findings: Finding[]): string {
    const severityCounts = findings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {} as Record<Severity, number>);
    
    let table = '| Severity | Count | Percentage |\n';
    table += '|----------|-------|------------|\n';
    
    const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    severities.forEach(severity => {
      const count = severityCounts[severity] || 0;
      if (count > 0) {
        const percentage = ((count / findings.length) * 100).toFixed(1);
        const emoji = this.getSeverityEmoji(severity);
        table += `| ${emoji} ${this.capitalizeFirst(severity)} | ${count} | ${percentage}% |\n`;
      }
    });
    
    return table;
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(summary: AnalysisSummary, findings: Finding[]): string {
    let recommendations = '';
    
    if (summary.criticalCount > 0) {
      recommendations += `- 🔴 **Address ${summary.criticalCount} critical issue(s) immediately** - These may pose security risks or cause system failures.\n`;
    }
    
    if (summary.highCount > 0) {
      recommendations += `- 🟠 **Review ${summary.highCount} high-priority issue(s)** - These should be fixed before merging.\n`;
    }
    
    if (summary.mediumCount > 5) {
      recommendations += `- 🟡 **Consider addressing ${summary.mediumCount} medium-priority issues** - These affect code quality and maintainability.\n`;
    }
    
    // Type-specific recommendations
    const securityIssues = findings.filter(f => f.type === 'security').length;
    if (securityIssues > 0) {
      recommendations += `- 🔒 **Security**: Found ${securityIssues} potential security issue(s). Review carefully.\n`;
    }
    
    const performanceIssues = findings.filter(f => f.type === 'performance').length;
    if (performanceIssues > 3) {
      recommendations += `- ⚡ **Performance**: Consider optimizing ${performanceIssues} performance-related issue(s).\n`;
    }
    
    if (recommendations === '') {
      recommendations = '- ✅ **Great job!** No critical issues found. Consider addressing minor issues for code quality improvement.\n';
    }
    
    return recommendations;
  }

  /**
   * Get overall status based on summary
   */
  private getOverallStatus(summary: AnalysisSummary): { emoji: string; text: string } {
    if (summary.criticalCount > 0) {
      return { emoji: '🔴', text: 'Critical Issues Found' };
    }
    if (summary.highCount > 0) {
      return { emoji: '🟠', text: 'High Priority Issues Found' };
    }
    if (summary.mediumCount > 5) {
      return { emoji: '🟡', text: 'Multiple Medium Priority Issues' };
    }
    if (summary.totalFindings > 0) {
      return { emoji: '🟢', text: 'Minor Issues Found' };
    }
    return { emoji: '✅', text: 'No Issues Found' };
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: Severity): string {
    const emojiMap: Record<Severity, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      info: 'ℹ️'
    };
    return emojiMap[severity] || 'ℹ️';
  }

  /**
   * Get type icon
   */
  private getTypeIcon(type: Finding['type']): string {
    const iconMap: Record<Finding['type'], string> = {
      security: '🔒',
      quality: '✨',
      performance: '⚡',
      'best-practice': '📚'
    };
    return iconMap[type] || '📝';
  }

  /**
   * Group findings by type
   */
  private groupFindingsByType(findings: Finding[]): Record<string, number> {
    return findings.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }
}

export default new CommentGenerator();

// Made with Bob
