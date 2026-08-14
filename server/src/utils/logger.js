/**
 * Structured application logger for FixMyRoad.
 * Masks sensitive fields (passwords, JWTs, credentials) before printing.
 */
const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'cookie', 'smtp_password', 'secret', 'key'];

const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = maskSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export const logger = {
  info: (message, meta = {}) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        ...maskSensitiveData(meta),
      })
    );
  },
  warn: (message, meta = {}) => {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message,
        ...maskSensitiveData(meta),
      })
    );
  },
  error: (message, meta = {}) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        ...maskSensitiveData(meta),
      })
    );
  },
};
