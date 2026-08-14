/**
 * Middleware ensuring MUNICIPALITY_ADMIN users can only operate within their assigned municipality.
 * SUPER_ADMIN bypasses this check with global authority.
 */
export const authorizeMunicipalityAccess = (getMunicipalityIdFromReq) => {
  return (req, res, next) => {
    // SUPER_ADMIN has global system access
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user && req.user.role === 'MUNICIPALITY_ADMIN') {
      const assignedId = req.user.municipalityId ? req.user.municipalityId.toString() : null;
      const targetId = getMunicipalityIdFromReq(req) ? getMunicipalityIdFromReq(req).toString() : null;

      if (!assignedId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Municipality admin account is not assigned to a municipality.',
        });
      }

      if (targetId && assignedId !== targetId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are authorized to manage your assigned municipality only.',
        });
      }

      return next();
    }

    // Default reject for unhandled roles trying to perform municipality admin actions
    res.status(403).json({
      success: false,
      message: 'Access denied: Insufficient privileges for this municipality operation.',
    });
  };
};
