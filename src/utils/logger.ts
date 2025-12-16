/**
 * Simple logger utility with different log levels
 * Hides sensitive information in production
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log level hierarchy (higher number = higher priority)
const LOG_LEVEL_PRIORITY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
} as const;

function shouldLog(level: LogLevel): boolean {
  const normalizedLogLevel = logLevel.toUpperCase() as LogLevel;
  const currentLevelPriority =
    LOG_LEVEL_PRIORITY[normalizedLogLevel] ?? LOG_LEVEL_PRIORITY[LogLevel.INFO];
  const messageLevelPriority = LOG_LEVEL_PRIORITY[level] ?? 0;
  return messageLevelPriority >= currentLevelPriority;
}

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'INFO' : 'DEBUG');

// Sensitive field names that should be hidden in production
const SENSITIVE_FIELDS = [
  'id',
  'user_id',
  'userId',
  'username',
  'email',
  'password',
  'token',
  'jwt',
  'secret',
  'key',
  'phone',
  'address',
  'ip',
  'studentId',
  'originalRole',
  'mappedRole',
  'decoded',
];

// Check if data object contains sensitive fields
function containsSensitiveData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.some((item) => containsSensitiveData(item));
  }

  // Check object keys for sensitive field names
  const keys = Object.keys(data);
  return keys.some((key) =>
    SENSITIVE_FIELDS.some((sensitiveField) =>
      key.toLowerCase().includes(sensitiveField.toLowerCase()),
    ),
  );
}

// Sanitize data by removing or masking sensitive fields
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_FIELDS.some((sensitiveField) =>
      key.toLowerCase().includes(sensitiveField.toLowerCase()),
    );

    if (isSensitive) {
      // Mask sensitive data instead of removing completely
      if (typeof value === 'string' && value.length > 4) {
        sanitized[key] = `${value.substring(0, 4)}****`;
      } else {
        sanitized[key] = '[HIDDEN]';
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function formatLog(
  level: LogLevel,
  context: string,
  message: string,
  data?: any,
): string {
  const timestamp = new Date().toISOString();
  const levelStr = `[${level}]`;
  const contextStr = `[${context}]`;

  let logMessage = `${timestamp} ${levelStr} ${contextStr} ${message}`;

  if (data) {
    if (isProduction && containsSensitiveData(data)) {
      // Sanitize sensitive data in production
      const sanitizedData = sanitizeData(data);
      logMessage += ` ${JSON.stringify(sanitizedData)}`;
    } else {
      logMessage += ` ${JSON.stringify(data)}`;
    }
  }

  return logMessage;
}

export const logger = {
  debug(context: string, message: string, data?: any) {
    if (shouldLog(LogLevel.DEBUG)) {
      const log = formatLog(LogLevel.DEBUG, context, message, data);
      console.log(log);
    }
  },

  info(context: string, message: string, data?: any) {
    if (shouldLog(LogLevel.INFO)) {
      const log = formatLog(LogLevel.INFO, context, message, data);
      console.log(log);
    }
  },

  warn(context: string, message: string, data?: any) {
    if (shouldLog(LogLevel.WARN)) {
      const log = formatLog(LogLevel.WARN, context, message, data);
      console.warn(log);
    }
  },

  error(context: string, message: string, error?: any) {
    if (shouldLog(LogLevel.ERROR)) {
      const log = formatLog(LogLevel.ERROR, context, message);
      console.error(log);
      if (error && shouldLog(LogLevel.DEBUG)) {
        console.error(error);
      }
    }
  },
};
