
export const validatePaginationQuery = (req, res, next) => {
  let { page = '1', limit = '10' } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid pagination parameters. Page and limit must be positive integers, and limit cannot exceed 100.'
    });
  }

  req.query.page = page;
  req.query.limit = limit;
  next();
};
