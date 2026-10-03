import { ApiError } from '../utils/apiError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
  }

  if (err?.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }
  if (err?.code === '23514') {
    return res.status(400).json({ success: false, message: 'That value violates a data constraint (e.g. capacity/quantity limits).' });
  }
  if (err?.code?.startsWith?.('22') || err?.code?.startsWith?.('23')) {
    return res.status(400).json({ success: false, message: 'Invalid data submitted.' });
  }

  console.error('[unhandled error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
