const requireAdmin = (req, res, next) => {
  // req.user should be populated by requireAuth middleware
  if (!req.user) {
    // This case should ideally be caught by requireAuth, but as a safeguard
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Check if the user has the 'admin' role
  if (req.user.user_metadata && req.user.user_metadata.role === 'admin') {
    next(); // User is an admin, proceed to the next middleware/route handler
  } else {
    // User is authenticated but not an admin
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
};

export default requireAdmin;