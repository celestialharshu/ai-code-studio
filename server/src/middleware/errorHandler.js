export function notFound(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Express only treats a function as error middleware if it declares four
 * arguments — `next` has to stay even though it's unused.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  // Once a response has started streaming, the status code is already on the
  // wire and can't be changed. The AI controller reports those errors inside
  // the stream instead.
  if (res.headersSent) return;

  res.status(err.status || 500).json({
    error: err.code || 'server_error',
    message: err.message || 'Something went wrong.',
  });
}
