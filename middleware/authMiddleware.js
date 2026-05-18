const isGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  if (req.session.user.role === "admin") {
    return res.redirect("/admin/dashboard");
  }

  if (req.session.user.role === "sub_admin") {
    return res.redirect("/sub-admin/dashboard");
  }

  return res.redirect("/dashboard");
};

const isLogin = (req, res, next) => {
  if (req.session.user) {
    return next();
  }

  req.flash("error", "Silakan login terlebih dahulu");
  return res.redirect("/login");
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }

  req.flash("error", "Halaman ini hanya untuk admin besar");
  return res.redirect("/dashboard");
};

const isSubAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "sub_admin") {
    return next();
  }

  req.flash("error", "Halaman ini hanya untuk sub admin");
  return res.redirect("/dashboard");
};

const isAdminOrSubAdmin = (req, res, next) => {
  if (
    req.session.user &&
    ["admin", "sub_admin"].includes(req.session.user.role)
  ) {
    return next();
  }

  req.flash("error", "Anda tidak memiliki akses ke halaman ini");
  return res.redirect("/dashboard");
};

module.exports = {
  isGuest,
  isLogin,
  isAdmin,
  isSubAdmin,
  isAdminOrSubAdmin
};