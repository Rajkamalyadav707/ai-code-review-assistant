/**
 * Logger Utility
 * Centralized logging using Winston with multiple transports
 */

import winston from 'winston';
import path from 'path';
import { LogContext } from '../types';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Filter out empty objects and internal winston properties
      const filteredMeta = Object.entries(meta)
        .filter(([key, value]) =>
          !['level', 'timestamp', 'message'].includes(key) &&
          value !== undefined &&
          value !== null &&
          !(typeof value === 'object' && Object.keys(value).length === 0)
        )
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      if (Object.keys(filteredMeta).length > 0) {
        log += ` ${JSON.stringify(filteredMeta)}`;
      }
    }
    
    return log;
  })
);

// Determine log level from environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL;
  
  if (configuredLevel && levels.hasOwnProperty(configuredLevel)) {
    return configuredLevel;
  }
  
  return env === 'production' ? 'info' : 'debug';
};

// Create transports array
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transport if log file path is specified
if (process.env.LOG_FILE_PATH) {
  const logDir = path.dirname(process.env.LOG_FILE_PATH);
  
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH,
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
  
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * Logger class with context support
 */
class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log error message
   */
  error(message: string, meta?: LogContext | Error): void {
    if (meta instanceof Error) {
      logger.error(message, {
        ...this.context,
        error: {
          message: meta.message,
          stack: meta.stack,
          name: meta.name,
        },
      });
    } else {
      logger.error(message, { ...this.context, ...meta });
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: LogContext): void {
    logger.warn(message, { ...this.context, ...meta });
  }

  /**
   * Log info message
   */
  info(message: string, meta?: LogContext): void {
    logger.info(message, { ...this.context, ...meta });
  }

  /**
   * Log HTTP request
   */
  http(message: string, meta?: LogContext): void {
    logger.http(message, { ...this.context, ...meta });
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: LogContext): void {
    logger.debug(message, { ...this.context, ...meta });
  }

  /**
   * Log with custom level
   */
  log(level: keyof typeof levels, message: string, meta?: LogContext): void {
    logger.log(level, message, { ...this.context, ...meta });
  }
}

// Create default logger instance
const defaultLogger = new Logger();

/**
 * Express middleware for request logging
 */
export const requestLogger = (req: any, res: any, next: any): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Attach request ID to request object
  req.requestId = requestId;
  
  // Log incoming request
  defaultLogger.http('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    
    defaultLogger.log(level, 'Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a logger with specific context
 */
export function createLogger(context: LogContext): Logger {
  return new Logger(context);
}

/**
 * Get the underlying Winston logger instance
 */
export function getWinstonLogger(): winston.Logger {
  return logger;
}

// Export default logger instance
export default defaultLogger;

// Export Logger class
export { Logger };

// Made with Bob
