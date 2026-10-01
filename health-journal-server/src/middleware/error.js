const { ZodError } = require('zod');

exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That record already exists' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
};
