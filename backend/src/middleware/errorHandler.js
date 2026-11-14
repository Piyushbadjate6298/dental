import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  logger.error('Unhandled server error:', err.message, err.stack);

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Malformed JSON in request body', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isPublic || process.env.NODE_ENV !== 'production'
    ? err.message
    : 'Internal Server Error';

  sendError(res, message, statusCode, process.env.NODE_ENV !== 'production' ? err.stack : null);
}

export function notFoundHandler(req, res) {
  sendError(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
}
