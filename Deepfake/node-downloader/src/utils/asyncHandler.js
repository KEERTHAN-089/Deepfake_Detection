/**
 * Async Handler Wrapper
 * Wraps async middleware/controllers to automatically catch errors
 * and pass them to the error handling middleware
 */

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};

export default asyncHandler;
