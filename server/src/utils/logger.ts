/**
 * Structured Logger Utility
 * Provides consistent logging with timestamps, levels, and context across all modules.
 * Integrates with Fastify's Pino logger but can also work standalone.
 */

import { FastifyBaseLogger } from 'fastify';

/** Log levels in order of severity */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/** Standard log entry structure */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  module?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/** Configuration options for the logger */
export interface LoggerConfig {
  level: LogLevel;
  module?: string;
  prettyPrint?: boolean;
  includeTimestamp?: boolean;
}

/** Default configuration */
const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  prettyPrint: process.env.NODE_ENV !== 'production',
  includeTimestamp: true,
};

/** Color codes for console output (when pretty printing) */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // cyan
  [LogLevel.INFO]: '\x1b[32m',  // green
  [LogLevel.WARN]: '\x1b[33m',  // yellow
  [LogLevel.ERROR]: '\x1b[31m', // red
  [LogLevel.FATAL]: '\x1b[35m', // magenta
};

const RESET_COLOR = '\x1b[0m';

/**
 * Check if a log level should be output based on configured level
 */
function shouldLog(configuredLevel: LogLevel, messageLevel: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
  return levels.indexOf(messageLevel) >= levels.indexOf(configuredLevel);
}

/**
 * Format a log entry for console output
 */
function formatLogEntry(entry: LogEntry, prettyPrint: boolean): string {
  const timestamp = entry.timestamp;
  const level = entry.level.toUpperCase().padEnd(5);
  const module = entry.module ? `[${entry.module}]` : '';
  const correlationId = entry.correlationId ? ` [${entry.correlationId}]` : '';
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  const error = entry.error ? ` | ${entry.error.name}: ${entry.error.message}` : '';

  if (prettyPrint) {
    const color = LEVEL_COLORS[entry.level] || '';
    return `${color}${timestamp} ${level}${RESET_COLOR} ${module}${correlationId} ${entry.message}${context}${error}`;
  }

  // JSON format for production/log aggregation
  return JSON.stringify(entry);
}

/**
 * Create a logger instance with module context
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return new Logger(finalConfig);
}

/**
 * Main Logger class
 */
export class Logger {
  private config: LoggerConfig;
  private fastifyLogger?: FastifyBaseLogger;
  private correlationId?: string;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /** Set Fastify logger instance for integration */
  setFastifyLogger(logger: FastifyBaseLogger): void {
    this.fastifyLogger = logger;
  }

  /** Set correlation ID for request tracing */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /** Clear correlation ID */
  clearCorrelationId(): void {
    this.correlationId = undefined;
  }

  /** Create a child logger with additional context */
  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.fastifyLogger = this.fastifyLogger;
    childLogger.correlationId = this.correlationId;
    // Prepend context to all log calls
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, ctx) => {
      const mergedContext = { ...context, ...ctx };
      originalLog(level, message, mergedContext);
    };
    return childLogger;
  }

  /** Core logging method */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!shouldLog(this.config.level, level)) return;

    const entry: LogEntry = {
      timestamp: this.config.includeTimestamp ? new Date().toISOString() : '',
      level,
      message,
      context,
      correlationId: this.correlationId,
      module: this.config.module,
    };

    // Log via Fastify if available (uses Pino)
    if (this.fastifyLogger) {
      const pinoLevel = level === LogLevel.FATAL ? 'fatal' : level;
      if (context || this.correlationId) {
        this.fastifyLogger[pinoLevel]({ ...context, correlationId: this.correlationId }, message);
      } else {
        this.fastifyLogger[pinoLevel](message);
      }
      return;
    }

    // Fallback to console
    const formatted = formatLogEntry(entry, this.config.prettyPrint);
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  /** Log debug message */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /** Log info message */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /** Log warning message */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /** Log error message */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error
      ? { ...context, error: { name: error.name, message: error.message, stack: error.stack } }
      : context;
    this.log(LogLevel.ERROR, message, errorContext);
  }

  /** Log fatal message */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error
      ? { ...context, error: { name: error.name, message: error.message, stack: error.stack } }
      : context;
    this.log(LogLevel.FATAL, message, errorContext);
  }

  /** Log with timing - executes fn and logs duration */
  async time<T>(label: string, fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting: ${label}`, context);
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed: ${label}`, { ...context, durationMs: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${label}`, error as Error, { ...context, durationMs: duration });
      throw error;
    }
  }

  /** Log HTTP request (for middleware integration) */
  logRequest(method: string, url: string, statusCode: number, durationMs: number, context?: Record<string, unknown>): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `${method} ${url} ${statusCode}`, { ...context, durationMs, statusCode });
  }
}

/** Default logger instance (module-agnostic) */
export const logger = createLogger();

/** Helper to create module-specific loggers */
export function getModuleLogger(moduleName: string): Logger {
  return createLogger({ module: moduleName });
}

/** Integration function to bind Fastify logger */
export function integrateFastifyLogger(fastifyLogger: FastifyBaseLogger): void {
  logger.setFastifyLogger(fastifyLogger);
  // Also integrate with module loggers if needed
}

/** Log levels for external configuration */
export const LOG_LEVELS = Object.values(LogLevel);

export default logger;