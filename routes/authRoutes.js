const express = require("express");
const router = express.Router();

const {
  showLogin,
  showRegister,
  register,
  login,
  logout
} = require("../controllers/authController");

const { isGuest } = require("../middleware/authMiddleware");

router.get("/", isGuest, showLogin);
router.get("/login", isGuest, showLogin);
router.post("/login", isGuest, login);

router.get("/register", isGuest, showRegister);
router.post("/register", isGuest, register);

router.get("/logout", logout);

module.exports = router;