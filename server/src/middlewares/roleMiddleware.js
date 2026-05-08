export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.admin?.role;

    // ✅ Kalau tidak ada role di token — tolak, jangan default ke superadmin
    if (!role) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid token payload.",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};
