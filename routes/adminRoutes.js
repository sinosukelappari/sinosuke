const express = require("express");
const router = express.Router();

const {
  dashboardAdmin,
  updateBagianUser,
  tambahBagian,
  hapusBagian,
  updateLimitBagian,
  updateSettingAplikasi,
  hapusUser,
  resetPasswordUser,
  tambahUsernameWhitelist,
  hapusUsernameWhitelist,

  jadikanSubAdmin,
  cabutSubAdmin,
  updateBagianDibawahiSubAdmin,
  tambahBagianSubAdmin,
  hapusBagianSubAdmin
} = require("../controllers/adminController");

const { updateAppConfig } = require("../utils/appConfig");
const { isLogin, isAdmin } = require("../middleware/authMiddleware");

router.get("/admin/dashboard", isLogin, isAdmin, dashboardAdmin);

router.post("/admin/user/:id/bagian", isLogin, isAdmin, updateBagianUser);

router.post("/admin/user/:id/delete", isLogin, isAdmin, hapusUser);

router.post("/admin/user/:id/reset-password", isLogin, isAdmin, resetPasswordUser);

router.post("/admin/bagian", isLogin, isAdmin, tambahBagian);

router.post("/admin/bagian/:id/delete", isLogin, isAdmin, hapusBagian);

router.post("/admin/bagian/:id/limit", isLogin, isAdmin, updateLimitBagian);

router.post("/admin/settings", isLogin, isAdmin, updateSettingAplikasi);

router.post("/admin/whitelist", isLogin, isAdmin, tambahUsernameWhitelist);

router.post("/admin/whitelist/:id/delete", isLogin, isAdmin, hapusUsernameWhitelist);

router.post(
  "/admin/sub-admin",
  isLogin,
  isAdmin,
  jadikanSubAdmin
);

router.post(
  "/admin/sub-admin/:id/cabut",
  isLogin,
  isAdmin,
  cabutSubAdmin
);

router.post(
  "/admin/sub-admin/:id/update-bagian-dibawahi",
  isLogin,
  isAdmin,
  updateBagianDibawahiSubAdmin
);

router.post(
  "/admin/sub-admin/:id/bagian/tambah",
  isLogin,
  isAdmin,
  tambahBagianSubAdmin
);

router.post(
  "/admin/sub-admin/:id/bagian/hapus",
  isLogin,
  isAdmin,
  hapusBagianSubAdmin
);

router.post(
  "/admin/user/:id/jadikan-sub-admin",
  isLogin,
  isAdmin,
  jadikanSubAdmin
);

router.post(
  "/admin/user/:id/cabut-sub-admin",
  isLogin,
  isAdmin,
  cabutSubAdmin
);

router.post(
  "/admin/user/:id/update-bagian-dibawahi",
  isLogin,
  isAdmin,
  updateBagianDibawahiSubAdmin
);

router.post("/settings", isLogin, isAdmin, async function (req, res) {
  try {
    const user = req.session.user || {};
    const userId = user.id || user._id || null;

    const data = {
      dariBagianMode: req.body.dariBagianMode || "manual",
      spreadsheetUrl: req.body.spreadsheetUrl || "",
      googleScriptUrl: req.body.googleScriptUrl || "",
      kodeSatker: req.body.kodeSatker || "WP.3.PAS.4-"
    };

    await updateAppConfig(data, userId);

    req.flash("success", "Konfigurasi aplikasi berhasil disimpan.");
    return res.redirect("/admin/dashboard#configSection");
  } catch (error) {
    console.error("Gagal menyimpan konfigurasi aplikasi:", error);

    req.flash("error", "Gagal menyimpan konfigurasi aplikasi.");
    return res.redirect("/admin/dashboard#configSection");
  }
});

module.exports = router;