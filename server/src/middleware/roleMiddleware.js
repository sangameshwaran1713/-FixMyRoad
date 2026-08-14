/**
 * Middleware for Role-Based Access Control (RBAC)
 * @param  {...string} roles Allowed roles (e.g. 'CITIZEN', 'MUNICIPALITY_ADMIN', 'SUPER_ADMIN')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};
