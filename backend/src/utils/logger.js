// Safe logger that strips credentials and sensitive data
export const logger = {
  info: (...args) => {
    console.log('[INFO]', new Date().toISOString(), ...sanitizeArgs(args));
  },
  warn: (...args) => {
    console.warn('[WARN]', new Date().toISOString(), ...sanitizeArgs(args));
  },
  error: (...args) => {
    console.error('[ERROR]', new Date().toISOString(), ...sanitizeArgs(args));
  },
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG]', new Date().toISOString(), ...sanitizeArgs(args));
    }
  },
};

function sanitizeArgs(args) {
  return args.map((arg) => {
    if (typeof arg === 'string') {
      return sanitizeString(arg);
    }
    if (arg && typeof arg === 'object') {
      return sanitizeObject(arg);
    }
    return arg;
  });
}

function sanitizeString(str) {
  return str
    .replace(/(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@/gi, '$1$2:***@')
    .replace(/(Bearer\s+)[A-Za-z0-9-_.]+/gi, '$1***')
    .replace(/(password|jwt_secret)=[^&\s]+/gi, '$1=***');
}

function sanitizeObject(obj) {
  try {
    const copy = JSON.parse(JSON.stringify(obj));
    const hideKeys = ['password', 'password_hash', 'token', 'authorization', 'secret', 'jwt_secret'];

    const traverse = (o) => {
      for (const key of Object.keys(o)) {
        if (hideKeys.includes(key.toLowerCase())) {
          o[key] = '***';
        } else if (o[key] && typeof o[key] === 'object') {
          traverse(o[key]);
        }
      }
    };

    traverse(copy);
    return copy;
  } catch {
    return obj;
  }
}
