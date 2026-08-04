"use strict";

import pino, { type Logger } from 'pino';
import { randomUUID } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface StructuredLog {
  timestamp: number;
  level: LogLevel;
  msg: string;
  requestId?: string;
  sessionId?: string;
  route?: string;
  errorType?: string;
  errorMessage?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: any;
}

export interface ILogger {
  debug(context: StructuredLog): void;
  info(context: StructuredLog): void;
  warn(context: StructuredLog): void;
  error(context: StructuredLog): void;
  fatal(context: StructuredLog): void;
  child(bindings: Partial<StructuredLog>): ILogger;
}

let pinoLogger: Logger;

export function initLogger(): void {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;

  // Base configuration
  const baseConfig = {
    level,
    base: {
      service: 'pricepoint-api',
      nodeEnv: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    },
    timestamp: () => `,"timestamp":${Date.now()}`,
    formatters: {
      level: (label: string) => ({ level: label }),
      log: (object: StructuredLog) => {
        // Remove internal pino fields that shouldn't appear in output
        delete object.level;
        return object;
      }
    }
  };

  // Determine if we're in a streaming environment (like Docker/Kubernetes)
  // Use pretty print for development, JSON for production
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    baseConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    };
  } else {
    baseConfig.transport = {
      target: 'pino/file',
      options: { destination: process.env.LOG_FILE_PATH || '/var/log/pricepoint/app.log' }
    };
  }

  pinoLogger = pino(baseConfig);
}

export function getLogger(): ILogger {
  if (!pinoLogger) {
    initLogger();
  }

  const logWrapper: ILogger = {
    debug: (context: StructuredLog) => {
      pinoLogger.debug(context, context.msg);
    },
    info: (context: StructuredLog) => {
      pinoLogger.info(context, context.msg);
    },
    warn: (context: StructuredLog) => {
      pinoLogger.warn(context, context.msg);
    },
    error: (context: StructuredLog) => {
      pinoLogger.error(context, context.msg);
    },
    fatal: (context: StructuredLog) => {
      pinoLogger.fatal(context, context.msg);
    },
    child: (bindings: Partial<StructuredLog>) => {
      const childLogger = pinoLogger.child(bindings) as Logger;
      return {
        debug: (context: StructuredLog) => {
          childLogger.debug({ ...context, ...bindings }, context.msg);
        },
        info: (context: StructuredLog) => {
          childLogger.info({ ...context, ...bindings }, context.msg);
        },
        warn: (context: StructuredLog) => {
          childLogger.warn({ ...context, ...bindings }, context.msg);
        },
        error: (context: StructuredLog) => {
          childLogger.error({ ...context, ...bindings }, context.msg);
        },
        fatal: (context: StructuredLog) => {
          childLogger.fatal({ ...context, ...bindings }, context.msg);
        },
        child: (additionalBindings: Partial<StructuredLog>) => {
          return logWrapper.child({ ...bindings, ...additionalBindings });
        }
      };
    }
  };

  return logWrapper;
}

export function createRequestLogger(requestId: string, sessionId?: string, route?: string): ILogger {
  const logger = getLogger();
  return logger.child({ requestId, sessionId, route });
}

export function logRequestStart(logger: ILogger, request: any, sessionId?: string): string {
  const requestId = randomUUID();
  const route = request.routerMethod + ' ' + request.url;

  logger.info({
    event: 'request.start',
    requestId,
    sessionId,
    route,
    method: request.method,
    url: request.url,
    query: request.query,
    remoteAddress: request.ip,
    userAgent: request.headers['user-agent']
  } as StructuredLog);

  return requestId;
}

export function logRequestEnd(logger: ILogger, requestId: string, statusCode: number, durationMs: number, error?: any): void {
  const logContext: StructuredLog = {
    event: 'request.end',
    requestId,
    statusCode,
    durationMs
  };

  if (error) {
    logContext.errorType = error.type || 'unknown';
    logContext.errorMessage = error.message || 'Unknown error';
    logger.error(logContext);
  } else {
    logger.info(logContext);
  }
}

export function withLogging<T = any>(
  handler: (request: any, reply: any, logger: ILogger) => Promise<T>,
  logger: ILogger
): (request: any, reply: any) => Promise<T> {
  return async (request: any, reply: any) => {
    const requestId = randomUUID();
    const sessionId = request.sessionId || request.query?.sessionId;
    const route = request.routerMethod + ' ' + request.url;
    const contextLogger = logger.child({ requestId, sessionId, route });

    contextLogger.info({
      event: 'request.start',
      requestId,
      sessionId,
      route,
      method: request.method,
      url: request.url,
      query: request.query,
      remoteAddress: request.ip,
      userAgent: request.headers['user-agent']
    } as StructuredLog);

    try {
      const startTime = Date.now();
      const result = await handler(request, reply, contextLogger);
      const durationMs = Date.now() - startTime;

      contextLogger.info({
        event: 'request.end',
        requestId,
        statusCode: reply.statusCode || 200,
        durationMs
      } as StructuredLog);

      return result;
    } catch (error) {
      const durationMs = Date.now() - Date.now();
      const logContext: StructuredLog = {
        event: 'request.error',
        requestId,
        statusCode: reply.statusCode || 500,
        durationMs,
        errorType: error.type || 'unknown',
        errorMessage: error.message || 'Unknown error'
      };

      contextLogger.error(logContext);
      return error;
    }
  };
}