import { captureException, setContext } from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private serviceName = process.env.SERVICE_NAME || 'habit-tracker-web';

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    // Add service metadata
    entry.service = this.serviceName;
    entry.environment = process.env.NODE_ENV || 'development';

    // Extract error if present
    if (context?.error) {
      const error = context.error;
      if (error instanceof Error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        };
      } else if (typeof error === 'string') {
        entry.error = { message: error };
      } else {
        entry.error = { message: JSON.stringify(error) };
      }
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print in development
      const { timestamp, level, message, error, ...rest } = entry;
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
      if (Object.keys(rest).length > 0) {
        console.log('Context:', rest);
      }
      if (error) {
        console.error('Error:', error);
      }
    } else {
      // JSON output in production
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const entry = this.formatLogEntry('debug', message, context);
      this.output(entry);
    }
  }

  info(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry('info', message, context);
    this.output(entry);
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry('warn', message, context);
    this.output(entry);
    
    // Send warnings to Sentry with context
    if (context) {
      setContext('warning_context', context);
    }
  }

  error(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry('error', message, context);
    this.output(entry);
    
    // Send to Sentry
    if (context?.error) {
      captureException(context.error, {
        contexts: {
          logger: {
            message,
            ...context,
          },
        },
      });
    } else {
      captureException(new Error(message), {
        contexts: {
          logger: context || {},
        },
      });
    }
  }

  // Create a child logger with persistent context
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
    };

    childLogger.debug = (message: string, additionalContext?: LogContext) => {
      originalMethods.debug(message, { ...context, ...additionalContext });
    };

    childLogger.info = (message: string, additionalContext?: LogContext) => {
      originalMethods.info(message, { ...context, ...additionalContext });
    };

    childLogger.warn = (message: string, additionalContext?: LogContext) => {
      originalMethods.warn(message, { ...context, ...additionalContext });
    };

    childLogger.error = (message: string, additionalContext?: LogContext) => {
      originalMethods.error(message, { ...context, ...additionalContext });
    };

    return childLogger;
  }

  // Log API request/response
  logRequest(
    method: string,
    url: string,
    options: {
      requestId: string;
      userId?: string;
      duration?: number;
      status?: number;
      error?: any;
    }
  ): void {
    const { requestId, userId, duration, status, error } = options;

    const context: LogContext = {
      requestId,
      userId,
      method,
      url,
      duration,
      status,
    };

    if (error) {
      this.error(`${method} ${url} failed`, { ...context, error });
    } else {
      this.info(`${method} ${url}`, context);
    }
  }

  // Log database query
  logQuery(
    operation: string,
    model: string,
    options: {
      requestId?: string;
      userId?: string;
      duration?: number;
      error?: any;
    }
  ): void {
    const { requestId, userId, duration, error } = options;

    const context: LogContext = {
      requestId,
      userId,
      operation,
      model,
      duration,
    };

    if (error) {
      this.error(`Database query failed: ${operation} ${model}`, { ...context, error });
    } else {
      this.debug(`Database query: ${operation} ${model}`, context);
    }
  }

  // Performance logging
  logPerformance(
    metric: string,
    value: number,
    context?: LogContext
  ): void {
    this.info(`Performance metric: ${metric}`, {
      metric,
      value,
      unit: 'ms',
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Middleware to add request ID to all logs
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({ requestId, userId });
}

// Express/Next.js middleware for request logging
export function requestLoggingMiddleware(
  req: any,
  res: any,
  next: any
): void {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const startTime = Date.now();

  // Add request ID to headers
  res.setHeader('x-request-id', requestId);

  // Log request
  const requestLogger = createRequestLogger(requestId, req.userId);
  requestLogger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    requestLogger.logRequest(req.method, req.url, {
      requestId,
      userId: req.userId,
      duration,
      status: res.statusCode,
    });

    return originalJson.call(this, body);
  };

  // Log errors
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - startTime;
      requestLogger.logRequest(req.method, req.url, {
        requestId,
        userId: req.userId,
        duration,
        status: res.statusCode,
        error: res.statusMessage,
      });
    }
  });

  next();
}