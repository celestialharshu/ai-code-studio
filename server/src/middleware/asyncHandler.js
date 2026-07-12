/**
 * Express 4 does not catch a rejected promise from an async route handler — the
 * request just hangs forever with no error anywhere. Wrapping every async route
 * in this hands the rejection to the error middleware instead.
 *
 * (Express 5 fixes this natively. Until then, this three-line function is the
 * difference between a clear 500 and a mystery timeout.)
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
