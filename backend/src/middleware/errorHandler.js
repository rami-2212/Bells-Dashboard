const { validationResult } = require('express-validator');

/**
 * Validation middleware - runs express-validator checks
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Global error handler
 */
function globalErrorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  console.error('[ERROR]', err.stack || err.message);

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({ success: false, error: 'Resource already exists', detail: err.detail });
  }
  if (err.code === '23503') { // FK violation
    return res.status(400).json({ success: false, error: 'Referenced resource not found', detail: err.detail });
  }
  if (err.code === '23514') { // Check constraint
    return res.status(400).json({ success: false, error: 'Constraint violation', detail: err.detail });
  }

  const status  = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ success: false, error: message });
}

module.exports = { validateRequest, globalErrorHandler };
