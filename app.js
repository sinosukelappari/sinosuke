require("dotenv").config();

const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");

const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const suratRoutes = require("./routes/surat.routes");
const subAdminRoutes = require("./routes/subAdminRoutes");
const app = express();

connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*
  Folder public tetap dipakai untuk CSS, gambar, font, dan asset biasa.
  Jangan taruh logic sensitif di public.
*/
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_ubah_di_env",
    resave: false,
    saveUninitialized: false
  })
);

app.use(flash());

function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  return res.redirect("/login");
}

/*
  JS dashboard tidak lagi berada di public.
  File JS disimpan di private-js/dashboard dan hanya bisa dibuka jika sudah login.
*/
app.use(
  "/secure-js/dashboard",
  requireLogin,
  express.static(path.join(__dirname, "private-js/dashboard"), {
    index: false,
    extensions: ["js"],
    maxAge: 0
  })
);

/*
  API surat juga diproteksi session login.
*/
app.use("/api/surat", requireLogin, suratRoutes);

app.use(authRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use(subAdminRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});


//199801072007010001