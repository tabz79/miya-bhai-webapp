
const MAX_MENU_LIMIT = process.env.MAX_MENU_LIMIT || 5000;

export const validatePaginationQuery = (req, res, next) => {
  let { page = '1', limit } = req.query;

  page = parseInt(page, 10);
  limit = limit ? parseInt(limit, 10) : MAX_MENU_LIMIT;

  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > MAX_MENU_LIMIT) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid pagination parameters. Page and limit must be positive integers, and limit cannot exceed ${MAX_MENU_LIMIT}.`
    });
  }

  req.query.page = page;
  req.query.limit = limit;
  next();
};
