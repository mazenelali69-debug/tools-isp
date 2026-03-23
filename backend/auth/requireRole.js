function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = Array.isArray(req.session?.user?.roles) ? req.session.user.roles : [];
    const ok = allowedRoles.some((r) => roles.includes(r));
    if (ok) return next();
    return res.status(403).json({
      ok: false,
      error: "forbidden",
      needAnyOf: allowedRoles,
      got: roles,
    });
  };
}

module.exports = { requireRole };
