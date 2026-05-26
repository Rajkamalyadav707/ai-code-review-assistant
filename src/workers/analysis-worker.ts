/**
 * Analysis Worker
 * Processes analysis jobs from the queue and posts results to GitHub
 */

import { AnalysisJob, Finding, AnalysisSummary, PRData, FileChange } from '../types';
import { SecurityAnalyzer } from '../analyzers/security-analyzer';
import { QualityAnalyzer } from '../analyzers/quality-analyzer';
import { PerformanceAnalyzer } from '../analyzers/performance-analyzer';
import githubClient from '../utils/github-client';
import commentGenerator from '../reporters/comment-generator';
import icaClient from '../ai/ica-client';
import logger, { createLogger } from '../utils/logger';
import { analysisQueue } from '../webhook/handler';

export class AnalysisWorker {
  private securityAnalyzer: SecurityAnalyzer;
  private qualityAnalyzer: QualityAnalyzer;
  private performanceAnalyzer: PerformanceAnalyzer;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.securityAnalyzer = new SecurityAnalyzer();
    this.qualityAnalyzer = new QualityAnalyzer();
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  /**
   * Start processing jobs from the queue
   */
  start(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      logger.warn('Analysis worker already started');
      return;
    }

    logger.info('Starting analysis worker', { intervalMs });
    
    // Process immediately
    this.processNextJob();
    
    // Then process at intervals
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, intervalMs);
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Analysis worker stopped');
    }
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing a job
    }

    const job = analysisQueue.shift();
    if (!job) {
      return; // No jobs in queue
    }

    this.isProcessing = true;
    const jobLogger = createLogger({ jobId: job.id, prNumber: job.prData.prNumber });

    try {
      jobLogger.info('Starting job processing');
      job.status = 'processing';
      job.startedAt = new Date();

      // Process the job
      await this.processJob(job, jobLogger);

      job.status = 'completed';
      job.completedAt = new Date();
      jobLogger.info('Job completed successfully', {
        duration: job.completedAt.getTime() - job.startedAt.getTime(),
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      jobLogger.error('Job processing failed', error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single analysis job
   */
  private async processJob(job: AnalysisJob, jobLogger: any): Promise<void> {
    const { prData, files } = job;
    const allFindings: Finding[] = [];
    let totalLinesAnalyzed = 0;
    const startTime = Date.now();

    jobLogger.info('Analyzing files', { fileCount: files.length });

    // Check if AI review is enabled
    const useAIReview = icaClient.isEnabled() && process.env.ENABLE_AI_REVIEW !== 'false';
    const usePatternAnalyzers = process.env.USE_PATTERN_ANALYZERS !== 'false';

    // Analyze each file
    for (const file of files) {
      try {
        jobLogger.debug('Analyzing file', { filename: file.filename });

        // Fetch file content
        const fileContent = await githubClient.getFileContent(
          prData.owner,
          prData.repo,
          file.filename,
          prData.headSha
        );

        const code = fileContent.content;
        const language = this.detectLanguage(file.filename);
        totalLinesAnalyzed += code.split('\n').length;

        // PRIMARY: AI-Powered Code Review (if enabled)
        if (useAIReview) {
          jobLogger.info('Running AI-powered code review', { filename: file.filename });
          try {
            const aiFindings = await icaClient.reviewCode(code, file.filename, language);
            if (aiFindings.length > 0) {
              jobLogger.info('AI review found issues', {
                filename: file.filename,
                count: aiFindings.length
              });
              allFindings.push(...aiFindings);
            }
          } catch (error) {
            jobLogger.warn('AI review failed, falling back to pattern analyzers', {
              filename: file.filename,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // SECONDARY: Pattern-Based Analyzers (as backup or supplement)
        if (usePatternAnalyzers) {
          const enableSecurity = process.env.ENABLE_SECURITY_SCAN !== 'false';
          const enableQuality = process.env.ENABLE_QUALITY_SCAN !== 'false';
          const enablePerformance = process.env.ENABLE_PERFORMANCE_SCAN !== 'false';

          // Security analysis
          if (enableSecurity) {
            const securityResult = await this.securityAnalyzer.analyze(
              code,
              file.filename
            );
            allFindings.push(...this.convertToFindings(securityResult.vulnerabilities, 'security'));
          }

          // Quality analysis
          if (enableQuality) {
            const qualityResult = await this.qualityAnalyzer.analyze(
              code,
              file.filename
            );
            allFindings.push(...this.convertToFindings(qualityResult.issues, 'quality'));
          }

          // Performance analysis
          if (enablePerformance) {
            const performanceResult = await this.performanceAnalyzer.analyze(
              code,
              file.filename
            );
            allFindings.push(...this.convertToFindings(performanceResult.issues, 'performance'));
          }
        }

        jobLogger.debug('File analysis complete', {
          filename: file.filename,
          findingsCount: allFindings.length,
        });
      } catch (error) {
        jobLogger.error('Failed to analyze file', {
          filename: file.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue with other files
      }
    }

    const analysisTime = Date.now() - startTime;

    // Create summary
    const summary: AnalysisSummary = {
      totalFindings: allFindings.length,
      criticalCount: allFindings.filter(f => f.severity === 'critical').length,
      highCount: allFindings.filter(f => f.severity === 'high').length,
      mediumCount: allFindings.filter(f => f.severity === 'medium').length,
      lowCount: allFindings.filter(f => f.severity === 'low').length,
      infoCount: allFindings.filter(f => f.severity === 'info').length,
      filesAnalyzed: files.length,
      linesAnalyzed: totalLinesAnalyzed,
      analysisTime,
    };

    jobLogger.info('Analysis complete', summary);

    // Enhance critical findings with detailed AI explanations (if not already AI-reviewed)
    if (icaClient.isEnabled() && !useAIReview && allFindings.length > 0) {
      jobLogger.info('Enhancing findings with IBM ICA AI');
      try {
        await this.enhanceFindingsWithAI(allFindings, prData, jobLogger);
      } catch (error) {
        jobLogger.warn('ICA AI enhancement failed', error as Error);
        // Continue without AI enhancement
      }
    }

    // Post results to GitHub
    await this.postResultsToGitHub(prData, allFindings, summary, jobLogger);
  }

  /**
   * Enhance findings with Watson AI insights
   */
  private async enhanceFindingsWithAI(
    findings: Finding[],
    prData: PRData,
    jobLogger: any
  ): Promise<void> {
    // Enhance top critical/high findings
    const criticalFindings = findings
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .slice(0, 5);

    for (const finding of criticalFindings) {
      try {
        if (finding.code) {
          const explanation = await icaClient.explainIssue(finding, finding.code);
          finding.description = explanation;
        }
      } catch (error) {
        jobLogger.debug('Failed to enhance finding with AI', {
          findingId: finding.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Post analysis results to GitHub
   */
  private async postResultsToGitHub(
    prData: PRData,
    findings: Finding[],
    summary: AnalysisSummary,
    jobLogger: any
  ): Promise<void> {
    try {
      // Post summary comment
      const summaryComment = commentGenerator.generateSummary(
        findings,
        summary,
        prData.prNumber,
        `${prData.owner}/${prData.repo}`
      );

      await githubClient.postComment(
        prData.owner,
        prData.repo,
        prData.prNumber,
        summaryComment
      );

      jobLogger.info('Posted summary comment to PR');

      // Post individual review comments for critical/high issues
      const criticalAndHigh = findings.filter(
        f => (f.severity === 'critical' || f.severity === 'high') && f.line
      );

      const maxComments = parseInt(process.env.MAX_REVIEW_COMMENTS || '10', 10);
      const commentsToPost = criticalAndHigh.slice(0, maxComments);

      for (const finding of commentsToPost) {
        try {
          const comment = commentGenerator.generateComment(finding, prData.headSha);
          
          await githubClient.postReviewComment(
            prData.owner,
            prData.repo,
            prData.prNumber,
            comment
          );

          jobLogger.debug('Posted review comment', {
            file: finding.file,
            line: finding.line,
          });
        } catch (error) {
          jobLogger.warn('Failed to post review comment', {
            findingId: finding.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue with other comments
        }
      }

      if (commentsToPost.length > 0) {
        jobLogger.info('Posted review comments', { count: commentsToPost.length });
      }

      // Determine review event based on findings
      const reviewEvent = this.determineReviewEvent(summary);
      
      jobLogger.info('Analysis results posted to GitHub', {
        summaryPosted: true,
        reviewCommentsPosted: commentsToPost.length,
        reviewEvent,
      });
    } catch (error) {
      jobLogger.error('Failed to post results to GitHub', error as Error);
      throw error;
    }
  }

  /**
   * Determine review event based on findings
   */
  private determineReviewEvent(
    summary: AnalysisSummary
  ): 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' {
    if (summary.criticalCount > 0) {
      return 'REQUEST_CHANGES';
    }
    if (summary.highCount > 3) {
      return 'REQUEST_CHANGES';
    }
    if (summary.totalFindings === 0) {
      return 'APPROVE';
    }
    return 'COMMENT';
  }

  /**
   * Convert analyzer-specific results to Finding format
   */
  private convertToFindings(issues: any[], type: Finding['type']): Finding[] {
    return issues.map(issue => ({
      id: issue.id || this.generateFindingId(),
      type,
      severity: issue.severity || 'medium',
      title: issue.title,
      description: issue.description,
      file: issue.file,
      line: issue.line,
      endLine: issue.endLine,
      column: issue.column,
      endColumn: issue.endColumn,
      code: issue.code,
      suggestion: issue.suggestion || issue.fixSuggestion,
      references: issue.references,
      ruleId: issue.ruleId || issue.patternId,
    }));
  }

  /**
   * Detect programming language from filename
   */
  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      go: 'go',
      rb: 'ruby',
      php: 'php',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      swift: 'swift',
      kt: 'kotlin',
      rs: 'rust',
      scala: 'scala',
    };
    return languageMap[ext || ''] || 'unknown';
  }

  /**
   * Generate unique finding ID
   */
  private generateFindingId(): string {
    return `finding-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    queueSize: number;
  } {
    return {
      isRunning: this.processingInterval !== null,
      isProcessing: this.isProcessing,
      queueSize: analysisQueue.length,
    };
  }
}

// Export singleton instance
export default new AnalysisWorker();

// Made with Bob