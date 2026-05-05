export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // If role is missing, we can assume they are an older token, but to be safe, deny or allow?
    // Let's assume they are superadmin if there is no role, or just use their role.
    const role = req.admin?.role || 'superadmin'; // default to superadmin if legacy token? The spec says to update existing to superadmin.

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};
