const express = require("express");
const router = express.Router();

const {
  dashboardSubAdmin,
  resetPasswordUserBawahan,
  hapusUserBawahan,
  tambahUsernameWhitelistBawahan,
  hapusUsernameWhitelistBawahan
} = require("../controllers/subAdminController");

const {
  isLogin,
  isSubAdmin
} = require("../middleware/authMiddleware");

router.get(
  "/sub-admin/dashboard",
  isLogin,
  isSubAdmin,
  dashboardSubAdmin
);

router.post(
  "/sub-admin/user/:id/reset-password",
  isLogin,
  isSubAdmin,
  resetPasswordUserBawahan
);

router.post(
  "/sub-admin/user/:id/delete",
  isLogin,
  isSubAdmin,
  hapusUserBawahan
);

router.post(
  "/sub-admin/whitelist",
  isLogin,
  isSubAdmin,
  tambahUsernameWhitelistBawahan
);

router.post(
  "/sub-admin/whitelist/:id/delete",
  isLogin,
  isSubAdmin,
  hapusUsernameWhitelistBawahan
);

module.exports = router;