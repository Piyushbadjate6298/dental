import { sendError } from '../utils/response.js';

export function validate(schemaFn) {
  return (req, res, next) => {
    const errors = schemaFn(req.body);
    if (errors && errors.length > 0) {
      return sendError(res, errors.join(', '), 400, errors);
    }
    next();
  };
}
