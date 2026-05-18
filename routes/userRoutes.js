const express = require("express");
const router = express.Router();

const {
  dashboardUser,
  suratSaya,
  profileUser,
  updatePasswordUser,
  updateNameUser
} = require("../controllers/userController");

const { isLogin } = require("../middleware/authMiddleware");

router.get("/dashboard", isLogin, dashboardUser);

router.get("/surat-saya", isLogin, suratSaya);

router.get("/profile", isLogin, profileUser);

router.post("/profile/password", isLogin, updatePasswordUser);

router.post("/profile/nama", isLogin, updateNameUser);
router.post("/profile/name", isLogin, updateNameUser);

module.exports = router;