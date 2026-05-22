/**
 * TypeScript Type Definitions
 * Core types for the AI-Powered Code Review Assistant
 */

import { Request } from 'express';

// ============================================================================
// GitHub Webhook Types
// ============================================================================

export interface GitHubWebhookRequest extends Request {
  body: GitHubWebhookPayload;
  headers: {
    'x-github-event'?: string;
    'x-github-delivery'?: string;
    'x-hub-signature-256'?: string;
    'x-hub-signature'?: string;
    [key: string]: string | undefined;
  };
}

export interface GitHubWebhookPayload {
  action: string;
  pull_request?: PullRequest;
  repository: Repository;
  sender: User;
  installation?: Installation;
  number?: number;
}

export interface PullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string | null;
  user: User;
  head: GitRef;
  base: GitRef;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  draft: boolean;
  html_url: string;
  diff_url: string;
  patch_url: string;
  commits_url: string;
  comments_url: string;
  review_comments_url: string;
  statuses_url: string;
  changed_files: number;
  additions: number;
  deletions: number;
  commits: number;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: User;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  default_branch: string;
  language: string | null;
}

export interface User {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Bot' | 'Organization';
}

export interface GitRef {
  label: string;
  ref: string;
  sha: string;
  user: User;
  repo: Repository;
}

export interface Installation {
  id: number;
  account: User;
}

// ============================================================================
// Pull Request Data Types
// ============================================================================

export interface PRData {
  owner: string;
  repo: string;
  prNumber: number;
  title: string;
  body: string | null;
  author: string;
  headSha: string;
  baseSha: string;
  headRef: string;
  baseRef: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileChange {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  sha: string;
  previous_filename?: string;
}

export interface FileContent {
  filename: string;
  content: string;
  encoding: 'base64' | 'utf-8';
  size: number;
  sha: string;
  language?: string;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AnalysisJob {
  id: string;
  prData: PRData;
  files: FileChange[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AnalysisResult {
  prNumber: number;
  repository: string;
  findings: Finding[];
  summary: AnalysisSummary;
  timestamp: Date;
}

export interface Finding {
  id: string;
  type: 'security' | 'quality' | 'performance' | 'best-practice';
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line?: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  code?: string;
  suggestion?: string;
  references?: string[];
  ruleId?: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AnalysisSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  filesAnalyzed: number;
  linesAnalyzed: number;
  analysisTime: number;
}

// ============================================================================
// GitHub Review Types
// ============================================================================

export interface ReviewComment {
  path: string;
  position?: number;
  body: string;
  commit_id: string;
  line?: number;
  side?: 'LEFT' | 'RIGHT';
  start_line?: number;
  start_side?: 'LEFT' | 'RIGHT';
}

export interface Review {
  owner: string;
  repo: string;
  pull_number: number;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body?: string;
  comments?: ReviewComment[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  github: GitHubConfig;
  analysis: AnalysisConfig;
  webhook: WebhookConfig;
  rateLimit: RateLimitConfig;
}

export interface GitHubConfig {
  token: string;
  webhookSecret: string;
  appId?: string;
  privateKeyPath?: string;
  installationId?: string;
}

export interface AnalysisConfig {
  maxFileSize: number;
  timeout: number;
  maxFilesPerPR: number;
  enableSecurity: boolean;
  enableQuality: boolean;
  enablePerformance: boolean;
  severityThresholds: SeverityThresholds;
}

export interface SeverityThresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface WebhookConfig {
  path: string;
  verifySignature: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class WebhookError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'WebhookError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GitHubAPIError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export interface LogContext {
  requestId?: string;
  prNumber?: number;
  repository?: string;
  event?: string;
  [key: string]: any;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  github: {
    connected: boolean;
    rateLimit?: {
      remaining: number;
      limit: number;
      reset: Date;
    };
  };
}

// ============================================================================
// Queue Types (for future implementation)
// ============================================================================

export interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export interface QueueOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

// ============================================================================
// Security Analysis Types
// ============================================================================

export type VulnerabilityType =
  | 'sql_injection'
  | 'xss'
  | 'hardcoded_secret'
  | 'path_traversal'
  | 'command_injection'
  | 'insecure_crypto'
  | 'ssrf'
  | 'insecure_deserialization';

export interface SecurityVulnerability {
  id: string;
  type: VulnerabilityType;
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line: number;
  endLine?: number;
  column?: number;
  code: string;
  confidence: number; // 0-1, confidence score
  cwe?: string; // Common Weakness Enumeration ID
  owasp?: string; // OWASP Top 10 reference
  fixSuggestion?: string;
  context?: string; // Code context around the vulnerability
  patternId?: string; // ID of the pattern that matched
}

export interface SecurityAnalysisResult {
  file: string;
  language: string;
  vulnerabilities: SecurityVulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  analysisTime: number;
  linesAnalyzed: number;
}

export interface PatternMatch {
  patternId: string;
  line: number;
  column: number;
  matchedText: string;
  confidence: number;
}

export interface CodeContext {
  filename: string;
  language: string;
  content: string;
  functions: Array<{
    name: string;
    startLine: number;
    endLine: number;
  }>;
  imports: Array<{
    module: string;
    line: number;
  }>;
}

// ============================================================================
// Quality Analysis Types
// ============================================================================

export type QualityIssueType =
  | 'complexity'
  | 'code_smell'
  | 'naming'
  | 'style'
  | 'best_practice'
  | 'documentation'
  | 'maintainability';

export interface QualityIssue {
  id: string;
  type: QualityIssueType;
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line: number;
  endLine?: number;
  column?: number;
  code?: string;
  suggestion?: string;
  category: string;
  patternId?: string;
  context?: string;
}

export interface QualityAnalysisResult {
  file: string;
  language: string;
  issues: QualityIssue[];
  metrics: CodeMetrics;
  complexity: ComplexityMetrics;
  functionComplexities: FunctionComplexity[];
  summary: QualitySummary;
  grade: QualityGrade;
  analysisTime: number;
  linesAnalyzed: number;
}

export interface QualitySummary {
  totalIssues: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  issuesByType: Record<QualityIssueType, number>;
  issuesByCategory: Record<string, number>;
}

export interface QualityGrade {
  overall: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  complexity: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  maintainability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  score: number; // 0-100
}

export interface CodeMetrics {
  totalLines: number;
  linesOfCode: number;
  sourceLines: number;
  commentLines: number;
  blankLines: number;
  commentRatio: number;
  averageLineLength: number;
  maxLineLength: number;
  functionCount: number;
  averageFunctionLength: number;
  maxFunctionLength: number;
  maxNestingDepth: number;
  duplicateBlocks: DuplicateBlock[];
}

export interface DuplicateBlock {
  lines: string[];
  occurrences: Array<{
    startLine: number;
    endLine: number;
  }>;
  duplicateLineCount: number;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  halsteadMetrics: HalsteadMetrics;
  technicalDebt: TechnicalDebt;
}

export interface HalsteadMetrics {
  vocabulary: number;
  length: number;
  volume: number;
  difficulty: number;
  effort: number;
  timeToProgram: number; // in minutes
  bugsDelivered: number;
}

export interface TechnicalDebt {
  minutes: number;
  hours: number;
  days: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  length: number;
}

// ============================================================================
// Performance Analysis Types
// ============================================================================

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

export interface PerformanceIssue {
  id: string;
  category: PerformanceCategory;
  severity: Severity;
  impact: PerformanceImpact;
  title: string;
  description: string;
  file: string;
  line: number;
  endLine?: number;
  column?: number;
  code?: string;
  suggestion?: string;
  complexity?: BigOComplexity;
  patternId?: string;
  context?: string;
  example?: {
    before: string;
    after: string;
  };
}

export interface PerformanceAnalysisResult {
  file: string;
  language: string;
  issues: PerformanceIssue[];
  algorithmAnalysis: AlgorithmComplexityAnalysis;
  summary: PerformanceSummary;
  recommendations: string[];
  performanceScore: number; // 0-100, higher is better
  analysisTime: number;
  linesAnalyzed: number;
}

export interface PerformanceSummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issuesByCategory: Record<PerformanceCategory, number>;
  issuesByImpact: Record<PerformanceImpact, number>;
  overallComplexity: BigOComplexity;
  hasNestedLoops: boolean;
  hasRecursion: boolean;
  hasMemoryLeaks: boolean;
}

export interface AlgorithmComplexityAnalysis {
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

// ============================================================================
// IBM ICA (IBM Consulting Advantage) AI Integration Types
// ============================================================================

export interface CodeSuggestion {
  id: string;
  type: 'fix' | 'improvement' | 'alternative' | 'refactor';
  title: string;
  description: string;
  code?: string;
  diff?: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  references?: string[];
  tags?: string[];
}

export interface SeverityAssessment {
  originalSeverity: Severity;
  suggestedSeverity: Severity;
  confidence: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
}

export interface ContextAnalysis {
  intent: string;
  codePattern: string;
  relatedConcepts: string[];
  potentialIssues: string[];
  bestPractices: string[];
  securityImplications?: string[];
}

export interface LearnedPattern {
  id: string;
  pattern: string;
  frequency: number;
  context: string;
  recommendation: string;
  confidence: number;
}

// Made with Bob