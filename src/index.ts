/**
 * AI-Powered Code Review Assistant
 * Main entry point for the application
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import { GitHubWebhookRequest, HealthCheckResponse } from './types';
import webhookHandler from './webhook/handler';
import githubClient from './utils/github-client';
import logger, { requestLogger } from './utils/logger';
import analysisWorker from './workers/analysis-worker';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// Middleware Configuration
// ============================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-GitHub-Event', 'X-GitHub-Delivery', 'X-Hub-Signature-256', 'X-Hub-Signature'],
}));

// Body parser middleware
// Use raw body for webhook signature verification
app.use('/webhook', bodyParser.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

// Regular JSON parser for other routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// ============================================================================
// Routes
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const githubConnected = await githubClient.verifyConnection();
    
    let rateLimit;
    if (githubConnected) {
      try {
        rateLimit = await githubClient.getRateLimit();
      } catch (error) {
        logger.warn('Failed to get rate limit for health check', error as Error);
      }
    }

    const response: HealthCheckResponse = {
      status: githubConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: process.env.npm_package_version || '1.0.0',
      github: {
        connected: githubConnected,
        rateLimit,
      },
    };

    const statusCode = githubConnected ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check failed', error as Error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'AI-Powered Code Review Assistant',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      webhook: '/webhook',
      queue: '/queue/status',
    },
  });
});

/**
 * Webhook endpoint
 */
app.post('/webhook', async (req, res) => {
  await webhookHandler.handle(req as GitHubWebhookRequest, res);
});

/**
 * Queue status endpoint (for monitoring)
 */
app.get('/queue/status', (req: Request, res: Response) => {
  try {
    const queueStatus = webhookHandler.getQueueStatus();
    const workerStatus = analysisWorker.getStatus();
    res.json({
      queue: queueStatus,
      worker: workerStatus,
    });
  } catch (error) {
    logger.error('Failed to get queue status', error as Error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

/**
 * Global error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// ============================================================================
// Server Lifecycle
// ============================================================================

let server: any;

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Verify GitHub connection on startup
    logger.info('Verifying GitHub connection...');
    const githubConnected = await githubClient.verifyConnection();
    
    if (!githubConnected) {
      logger.warn('GitHub connection could not be verified. Check your credentials.');
    } else {
      logger.info('GitHub connection verified successfully');
      
      // Log rate limit info
      try {
        const rateLimit = await githubClient.getRateLimit();
        logger.info('GitHub API rate limit', {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          resetAt: rateLimit.reset.toISOString(),
        });
      } catch (error) {
        logger.warn('Could not fetch rate limit', error as Error);
      }
    }

    // Start the analysis worker
    const workerInterval = parseInt(process.env.WORKER_INTERVAL_MS || '5000', 10);
    analysisWorker.start(workerInterval);
    logger.info('Analysis worker started', { intervalMs: workerInterval });

    // Start listening
    server = app.listen(PORT, () => {
      logger.info('AI Code Review Assistant started', {
        port: PORT,
        nodeEnv: NODE_ENV,
        webhookPath: process.env.WEBHOOK_PATH || '/webhook',
        signatureVerification: process.env.WEBHOOK_VERIFY_SIGNATURE !== 'false',
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop the analysis worker
  analysisWorker.stop();
  logger.info('Analysis worker stopped');

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Close other connections (database, redis, etc.) here
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000); // 10 second timeout
  } else {
    process.exit(0);
  }
}

// ============================================================================
// Process Event Handlers
// ============================================================================

// Handle graceful shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  shutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled promise rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  shutdown('unhandledRejection');
});

// ============================================================================
// Start Application
// ============================================================================

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  startServer();
}

// Export app for testing
export default app;

// Made with Bob
