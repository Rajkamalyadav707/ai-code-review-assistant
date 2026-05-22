/**
 * GitHub Webhook Handler
 * Processes incoming webhook events from GitHub
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import {
  GitHubWebhookRequest,
  GitHubWebhookPayload,
  PRData,
  FileChange,
  WebhookError,
  ValidationError,
  AnalysisJob,
} from '../types';
import githubClient from '../utils/github-client';
import logger, { createLogger } from '../utils/logger';

/**
 * Supported webhook events
 */
const SUPPORTED_EVENTS = ['pull_request'];
const SUPPORTED_PR_ACTIONS = ['opened', 'synchronize', 'reopened'];

/**
 * In-memory queue for analysis jobs (will be replaced with proper queue in production)
 */
const analysisQueue: AnalysisJob[] = [];

/**
 * GitHub Webhook Handler Class
 */
export class WebhookHandler {
  private webhookSecret: string;
  private verifySignature: boolean;

  constructor() {
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
    this.verifySignature = process.env.WEBHOOK_VERIFY_SIGNATURE !== 'false';

    if (this.verifySignature && !this.webhookSecret) {
      logger.warn('Webhook signature verification enabled but no secret configured');
    }
  }

  /**
   * Main webhook handler
   */
  async handle(req: GitHubWebhookRequest, res: Response): Promise<void> {
    const requestLogger = createLogger({
      requestId: (req as any).requestId,
      event: req.headers['x-github-event'],
      delivery: req.headers['x-github-delivery'],
    });

    try {
      requestLogger.info('Received webhook event');

      // Verify webhook signature
      if (this.verifySignature) {
        const signature = req.headers['x-hub-signature-256'] || req.headers['x-hub-signature'];
        if (!signature) {
          throw new WebhookError('Missing webhook signature', 401, 'MISSING_SIGNATURE');
        }

        const payload = JSON.stringify(req.body);
        if (!this.verifyWebhookSignature(payload, signature)) {
          requestLogger.warn('Invalid webhook signature');
          throw new WebhookError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
        }
      }

      // Get event type
      const event = req.headers['x-github-event'];
      if (!event) {
        throw new WebhookError('Missing event type header', 400, 'MISSING_EVENT_TYPE');
      }

      // Check if event is supported
      if (!SUPPORTED_EVENTS.includes(event)) {
        requestLogger.info('Unsupported event type, ignoring', { event });
        res.status(200).json({
          message: 'Event type not supported',
          event,
        });
        return;
      }

      // Route to appropriate handler
      const payload = req.body;
      
      switch (event) {
        case 'pull_request':
          await this.handlePullRequest(payload, requestLogger);
          break;
        default:
          requestLogger.info('Event not handled', { event });
      }

      res.status(200).json({
        message: 'Webhook processed successfully',
        event,
        action: payload.action,
      });

    } catch (error) {
      requestLogger.error('Webhook processing failed', error as Error);

      if (error instanceof WebhookError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          error: error.message,
          field: error.field,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  }

  /**
   * Handle pull request events
   */
  async handlePullRequest(payload: GitHubWebhookPayload, requestLogger: any): Promise<void> {
    const { action, pull_request, repository } = payload;

    if (!action || !pull_request || !repository) {
      throw new ValidationError('Invalid pull request payload');
    }

    requestLogger.info('Processing pull request event', {
      action,
      prNumber: pull_request.number,
      repository: repository.full_name,
    });

    // Check if action is supported
    if (!SUPPORTED_PR_ACTIONS.includes(action)) {
      requestLogger.info('PR action not supported, ignoring', { action });
      return;
    }

    // Skip draft PRs
    if (pull_request.draft) {
      requestLogger.info('Skipping draft PR', { prNumber: pull_request.number });
      return;
    }

    // Extract PR data
    const prData = this.extractPRData(payload);
    requestLogger.info('Extracted PR data', {
      prNumber: prData.prNumber,
      changedFiles: prData.changedFiles,
      additions: prData.additions,
      deletions: prData.deletions,
    });

    // Validate PR data
    this.validatePRData(prData);

    // Fetch changed files
    const files = await this.fetchChangedFiles(prData, requestLogger);
    requestLogger.info('Fetched changed files', { fileCount: files.length });

    // Filter files based on configuration
    const filteredFiles = this.filterFiles(files, requestLogger);
    requestLogger.info('Filtered files for analysis', {
      originalCount: files.length,
      filteredCount: filteredFiles.length,
    });

    if (filteredFiles.length === 0) {
      requestLogger.info('No files to analyze after filtering');
      return;
    }

    // Queue analysis job
    await this.queueAnalysisJob(prData, filteredFiles, requestLogger);
  }

  /**
   * Extract PR data from webhook payload
   */
  private extractPRData(payload: GitHubWebhookPayload): PRData {
    const { pull_request, repository } = payload;

    if (!pull_request || !repository) {
      throw new ValidationError('Missing pull request or repository data');
    }

    return {
      owner: repository.owner.login,
      repo: repository.name,
      prNumber: pull_request.number,
      title: pull_request.title,
      body: pull_request.body,
      author: pull_request.user.login,
      headSha: pull_request.head.sha,
      baseSha: pull_request.base.sha,
      headRef: pull_request.head.ref,
      baseRef: pull_request.base.ref,
      changedFiles: pull_request.changed_files,
      additions: pull_request.additions,
      deletions: pull_request.deletions,
      htmlUrl: pull_request.html_url,
      createdAt: pull_request.created_at,
      updatedAt: pull_request.updated_at,
    };
  }

  /**
   * Validate PR data
   */
  private validatePRData(prData: PRData): void {
    const maxFilesPerPR = parseInt(process.env.MAX_FILES_PER_PR || '100', 10);

    if (prData.changedFiles > maxFilesPerPR) {
      throw new ValidationError(
        `PR has too many changed files (${prData.changedFiles} > ${maxFilesPerPR})`,
        'changedFiles'
      );
    }

    if (!prData.owner || !prData.repo || !prData.prNumber) {
      throw new ValidationError('Missing required PR data fields');
    }
  }

  /**
   * Fetch changed files from GitHub
   */
  private async fetchChangedFiles(prData: PRData, requestLogger: any): Promise<FileChange[]> {
    try {
      return await githubClient.getChangedFiles(
        prData.owner,
        prData.repo,
        prData.prNumber
      );
    } catch (error) {
      requestLogger.error('Failed to fetch changed files', error as Error);
      throw new WebhookError('Failed to fetch changed files from GitHub', 500);
    }
  }

  /**
   * Filter files based on configuration and file types
   */
  private filterFiles(files: FileChange[], requestLogger: any): FileChange[] {
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '1048576', 10); // 1MB default

    // File extensions to analyze
    const analyzableExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.go', '.rb',
      '.php', '.c', '.cpp', '.cs',
      '.swift', '.kt', '.rs', '.scala',
    ];

    // Paths to ignore
    const ignorePaths = [
      'node_modules/',
      'vendor/',
      'dist/',
      'build/',
      '.git/',
      'coverage/',
      '__pycache__/',
      '.next/',
      '.nuxt/',
    ];

    return files.filter(file => {
      // Skip deleted files
      if (file.status === 'removed') {
        requestLogger.debug('Skipping deleted file', { filename: file.filename });
        return false;
      }

      // Skip files in ignored paths
      if (ignorePaths.some(path => file.filename.startsWith(path))) {
        requestLogger.debug('Skipping ignored path', { filename: file.filename });
        return false;
      }

      // Check file extension
      const hasAnalyzableExtension = analyzableExtensions.some(ext =>
        file.filename.endsWith(ext)
      );

      if (!hasAnalyzableExtension) {
        requestLogger.debug('Skipping non-analyzable file type', { filename: file.filename });
        return false;
      }

      // Check file size (approximate from changes)
      const estimatedSize = (file.additions + file.deletions) * 50; // Rough estimate
      if (estimatedSize > maxFileSize) {
        requestLogger.debug('Skipping large file', {
          filename: file.filename,
          estimatedSize,
        });
        return false;
      }

      return true;
    });
  }

  /**
   * Queue analysis job for processing
   */
  private async queueAnalysisJob(
    prData: PRData,
    files: FileChange[],
    requestLogger: any
  ): Promise<void> {
    const jobId = this.generateJobId(prData);

    const job: AnalysisJob = {
      id: jobId,
      prData,
      files,
      status: 'queued',
      createdAt: new Date(),
    };

    // Add to queue (in-memory for now)
    analysisQueue.push(job);

    requestLogger.info('Analysis job queued', {
      jobId,
      prNumber: prData.prNumber,
      fileCount: files.length,
      queueSize: analysisQueue.length,
    });

    // TODO: In production, this should:
    // 1. Add job to a proper message queue (Redis, RabbitMQ, etc.)
    // 2. Trigger background worker to process the job
    // 3. Store job metadata in database
    
    // For now, just log that the job would be processed
    requestLogger.info('Job ready for processing by analysis worker', { jobId });
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(prData: PRData): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prData.owner}-${prData.repo}-${prData.prNumber}-${timestamp}-${random}`;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      logger.warn('Cannot verify signature: webhook secret not configured');
      return false;
    }

    try {
      // Support both SHA-256 and SHA-1 signatures
      let algorithm: string;
      let providedSignature: string;

      if (signature.startsWith('sha256=')) {
        algorithm = 'sha256';
        providedSignature = signature.substring(7);
      } else if (signature.startsWith('sha1=')) {
        algorithm = 'sha1';
        providedSignature = signature.substring(5);
      } else {
        logger.warn('Unknown signature algorithm', { signature: signature.substring(0, 10) });
        return false;
      }

      // Calculate expected signature
      const hmac = crypto.createHmac(algorithm, this.webhookSecret);
      hmac.update(payload, 'utf8');
      const expectedSignature = hmac.digest('hex');

      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(providedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying webhook signature', error as Error);
      return false;
    }
  }

  /**
   * Get analysis queue status (for monitoring)
   */
  getQueueStatus(): { size: number; jobs: AnalysisJob[] } {
    return {
      size: analysisQueue.length,
      jobs: analysisQueue.map(job => ({
        ...job,
        // Don't expose full file content in status
        files: job.files.map(f => ({ filename: f.filename, status: f.status })),
      })) as AnalysisJob[],
    };
  }
}

// Create and export singleton instance
const webhookHandler = new WebhookHandler();
export default webhookHandler;

// Export queue for testing/monitoring
export { analysisQueue };

// Made with Bob
