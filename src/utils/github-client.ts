/**
 * GitHub Client Utility
 * Wrapper around Octokit for GitHub API interactions
 */

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import {
  PRData,
  FileChange,
  FileContent,
  Review,
  ReviewComment,
  GitHubAPIError,
} from '../types';
import logger from './logger';

/**
 * GitHub Client class
 */
export class GitHubClient {
  private octokit: Octokit;
  private rateLimitWarningThreshold = 100;

  constructor() {
    this.octokit = this.initializeOctokit();
  }

  /**
   * Initialize Octokit client with authentication
   */
  private initializeOctokit(): Octokit {
    const token = process.env.GITHUB_TOKEN;
    const appId = process.env.GITHUB_APP_ID;
    const privateKeyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
    const installationId = process.env.GITHUB_INSTALLATION_ID;

    // Use GitHub App authentication if configured
    if (appId && privateKeyPath && installationId) {
      logger.info('Initializing GitHub client with App authentication');
      
      return new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId,
          privateKey: this.loadPrivateKey(privateKeyPath),
          installationId,
        },
      });
    }

    // Fall back to personal access token
    if (token) {
      logger.info('Initializing GitHub client with token authentication');
      return new Octokit({ auth: token });
    }

    logger.warn('No GitHub authentication configured');
    return new Octokit();
  }

  /**
   * Load private key from file
   */
  private loadPrivateKey(path: string): string {
    try {
      const fs = require('fs');
      return fs.readFileSync(path, 'utf8');
    } catch (error) {
      logger.error('Failed to load GitHub App private key', error as Error);
      throw new GitHubAPIError('Failed to load private key');
    }
  }

  /**
   * Check rate limit and log warning if low
   */
  private async checkRateLimit(): Promise<void> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      const remaining = data.rate.remaining;
      const limit = data.rate.limit;
      const resetDate = new Date(data.rate.reset * 1000);

      if (remaining < this.rateLimitWarningThreshold) {
        logger.warn('GitHub API rate limit running low', {
          remaining,
          limit,
          resetAt: resetDate.toISOString(),
        });
      }

      logger.debug('GitHub API rate limit status', {
        remaining,
        limit,
        resetAt: resetDate.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to check rate limit', error as Error);
    }
  }

  /**
   * Fetch pull request details
   */
  async getPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<PRData> {
    try {
      logger.info('Fetching PR details', { owner, repo, prNumber });

      const { data: pr } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      await this.checkRateLimit();

      return {
        owner,
        repo,
        prNumber,
        title: pr.title,
        body: pr.body,
        author: pr.user?.login || 'unknown',
        headSha: pr.head.sha,
        baseSha: pr.base.sha,
        headRef: pr.head.ref,
        baseRef: pr.base.ref,
        changedFiles: pr.changed_files,
        additions: pr.additions,
        deletions: pr.deletions,
        htmlUrl: pr.html_url,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
      };
    } catch (error: any) {
      logger.error('Failed to fetch PR details', {
        owner,
        repo,
        prNumber,
        error: error.message,
      });
      throw new GitHubAPIError(
        `Failed to fetch PR #${prNumber}`,
        error.status,
        error.response
      );
    }
  }

  /**
   * Get list of changed files in a pull request
   */
  async getChangedFiles(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<FileChange[]> {
    try {
      logger.info('Fetching changed files', { owner, repo, prNumber });

      const files: FileChange[] = [];
      let page = 1;
      const perPage = 100;

      // Paginate through all files
      while (true) {
        const { data } = await this.octokit.pulls.listFiles({
          owner,
          repo,
          pull_number: prNumber,
          per_page: perPage,
          page,
        });

        if (data.length === 0) break;

        files.push(...data.map(file => ({
          filename: file.filename,
          status: file.status as FileChange['status'],
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch,
          blob_url: file.blob_url,
          raw_url: file.raw_url,
          contents_url: file.contents_url,
          sha: file.sha,
          previous_filename: file.previous_filename,
        })));

        if (data.length < perPage) break;
        page++;
      }

      await this.checkRateLimit();

      logger.info('Fetched changed files', {
        owner,
        repo,
        prNumber,
        fileCount: files.length,
      });

      return files;
    } catch (error: any) {
      logger.error('Failed to fetch changed files', {
        owner,
        repo,
        prNumber,
        error: error.message,
      });
      throw new GitHubAPIError(
        `Failed to fetch changed files for PR #${prNumber}`,
        error.status,
        error.response
      );
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref: string
  ): Promise<FileContent> {
    try {
      logger.debug('Fetching file content', { owner, repo, path, ref });

      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // Ensure we got a file, not a directory
      if (Array.isArray(data) || data.type !== 'file') {
        throw new GitHubAPIError(`Path ${path} is not a file`);
      }

      await this.checkRateLimit();

      // Decode base64 content
      const content = data.encoding === 'base64'
        ? Buffer.from(data.content, 'base64').toString('utf-8')
        : data.content;

      return {
        filename: path,
        content,
        encoding: data.encoding as 'base64' | 'utf-8',
        size: data.size,
        sha: data.sha,
      };
    } catch (error: any) {
      logger.error('Failed to fetch file content', {
        owner,
        repo,
        path,
        ref,
        error: error.message,
      });
      throw new GitHubAPIError(
        `Failed to fetch content for ${path}`,
        error.status,
        error.response
      );
    }
  }

  /**
   * Post a review comment on a pull request
   */
  async postReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    comment: ReviewComment
  ): Promise<void> {
    try {
      logger.info('Posting review comment', {
        owner,
        repo,
        prNumber,
        path: comment.path,
        line: comment.line,
      });

      await this.octokit.pulls.createReviewComment({
        owner,
        repo,
        pull_number: prNumber,
        body: comment.body,
        commit_id: comment.commit_id,
        path: comment.path,
        line: comment.line,
        side: comment.side,
        start_line: comment.start_line,
        start_side: comment.start_side,
      });

      await this.checkRateLimit();

      logger.info('Review comment posted successfully', {
        owner,
        repo,
        prNumber,
        path: comment.path,
      });
    } catch (error: any) {
      logger.error('Failed to post review comment', {
        owner,
        repo,
        prNumber,
        path: comment.path,
        error: error.message,
      });
      throw new GitHubAPIError(
        `Failed to post review comment on PR #${prNumber}`,
        error.status,
        error.response
      );
    }
  }

  /**
   * Create a pull request review with multiple comments
   */
  async createReview(review: Review): Promise<void> {
    try {
      logger.info('Creating PR review', {
        owner: review.owner,
        repo: review.repo,
        prNumber: review.pull_number,
        event: review.event,
        commentCount: review.comments?.length || 0,
      });

      await this.octokit.pulls.createReview({
        owner: review.owner,
        repo: review.repo,
        pull_number: review.pull_number,
        event: review.event,
        body: review.body,
        comments: review.comments?.map(comment => ({
          path: comment.path,
          body: comment.body,
          line: comment.line,
          side: comment.side,
          start_line: comment.start_line,
          start_side: comment.start_side,
        })),
      });

      await this.checkRateLimit();

      logger.info('PR review created successfully', {
        owner: review.owner,
        repo: review.repo,
        prNumber: review.pull_number,
      });
    } catch (error: any) {
      logger.error('Failed to create PR review', {
        owner: review.owner,
        repo: review.repo,
        prNumber: review.pull_number,
        error: error.message,
      });
      throw new GitHubAPIError(
        `Failed to create review for PR #${review.pull_number}`,
        error.status,
        error.response
      );
    }
  }

  /**
   * Post a comment on a pull request (not a review comment)
   */
  async postComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string
  ): Promise<void> {
    try {
      logger.info('Posting PR comment', { owner, repo, prNumber });

      await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });

      await this.checkRateLimit();

      logger.info('PR comment posted successfully', { owner, repo, prNumber });
    } catch (error: any) {
      logger.error('Failed to post PR comment', {
        owner,
        repo,
        prNumber,
        error: error.message,
      });
      throw new GitHubAPIError(
        `Failed to post comment on PR #${prNumber}`,
        error.status,
        error.response
      );
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<{
    remaining: number;
    limit: number;
    reset: Date;
  }> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        reset: new Date(data.rate.reset * 1000),
      };
    } catch (error: any) {
      logger.error('Failed to get rate limit', error);
      throw new GitHubAPIError('Failed to get rate limit', error.status);
    }
  }

  /**
   * Verify GitHub connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      logger.info('GitHub connection verified');
      return true;
    } catch (error) {
      logger.error('GitHub connection verification failed', error as Error);
      return false;
    }
  }
}

// Create and export singleton instance
const githubClient = new GitHubClient();
export default githubClient;

// Made with Bob