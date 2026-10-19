const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

// Rejects PUT requests that contain none of the updatable fields
function requireAnyField(fields) {
  return (req, res, next) => {
    const body = req.body || {};
    if (fields.some((f) => body[f] !== undefined)) return next();
    return res.status(400).json({
      success: false,
      message: `Provide at least one field to update: ${fields.join(', ')}`,
    });
  };
}

module.exports = validate;
module.exports.requireAnyField = requireAnyField;
