const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Bagian = require("../models/Bagian");
const UsernameWhitelist = require("../models/UsernameWhitelist");

async function getBagianRegisterOptions() {
  const bagianList = await Bagian.find({ aktif: true })
    .sort({ nama: 1 })
    .lean();

  const bagianUsage = await User.aggregate([
    {
      $match: {
        role: { $ne: "admin" },
        bagian: { $ne: "" }
      }
    },
    {
      $group: {
        _id: "$bagian",
        total: { $sum: 1 }
      }
    }
  ]);

  const bagianUsageMap = {};

  bagianUsage.forEach((item) => {
    bagianUsageMap[item._id] = item.total;
  });

  const bagianOptions = bagianList.map((bagian) => {
    const usedCount = bagianUsageMap[bagian.nama] || 0;
    const isUnlimited =
      bagian.limitUser === null || typeof bagian.limitUser === "undefined";

    const limitUser = isUnlimited ? null : Number(bagian.limitUser);
    const remaining = isUnlimited ? null : Math.max(limitUser - usedCount, 0);
    const isFull = !isUnlimited && remaining <= 0;

    return {
      nama: bagian.nama,
      usedCount,
      limitUser,
      remaining,
      isUnlimited,
      isFull
    };
  });

  return bagianOptions;
}

const showLogin = (req, res) => {
  return res.render("login", {
    error: req.flash("error"),
    success: req.flash("success")
  });
};

const showRegister = async (req, res) => {
  try {
    const bagianOptions = await getBagianRegisterOptions();

    return res.render("register", {
      error: req.flash("error"),
      success: req.flash("success"),
      bagianOptions
    });
  } catch (error) {
    console.error("Gagal memuat halaman register:", error);

    return res.render("register", {
      error: ["Gagal memuat data bagian."],
      success: [],
      bagianOptions: []
    });
  }
};

const register = async (req, res) => {
  try {
    const { nama, username, password, bagian } = req.body;

    const cleanNama = String(nama || "").trim();
    const cleanUsername = String(username || "").trim();
    const cleanBagian = String(bagian || "").trim().toUpperCase();

    if (!cleanNama || !cleanUsername || !password || !cleanBagian) {
      req.flash("error", "Semua field wajib diisi, termasuk bagian/jabatan.");
      return res.redirect("/register");
    }

    if (!/^\d{18}$/.test(cleanUsername)) {
      req.flash("error", "NIP harus berupa 18 digit angka.");
      return res.redirect("/register");
    }

    const whitelist = await UsernameWhitelist.findOne({
      username: cleanUsername
    });

    if (!whitelist) {
      req.flash("error", "NIP belum terdaftar di database. Silakan hubungi admin.");
      return res.redirect("/register");
    }

    const existingUser = await User.findOne({
      username: cleanUsername
    });

    if (existingUser) {
      /*
        Kalau user sudah terdaftar tetapi NIP masih ada di whitelist,
        berarti whitelist itu sudah tidak relevan. Bersihkan saja.
        Tidak perlu dijadikan koleksi peninggalan sejarah.
      */
      await UsernameWhitelist.deleteMany({
        username: cleanUsername
      });

      req.flash("error", "Username sudah digunakan.");
      return res.redirect("/register");
    }

    const bagianData = await Bagian.findOne({
      nama: cleanBagian,
      aktif: true
    });

    if (!bagianData) {
      req.flash("error", "Jabatan/Bagian yang dipilih tidak valid atau sudah tidak aktif.");
      return res.redirect("/register");
    }

    if (
      bagianData.limitUser !== null &&
      typeof bagianData.limitUser !== "undefined"
    ) {
      const jumlahPemakaiBagian = await User.countDocuments({
        role: { $ne: "admin" },
        bagian: bagianData.nama
      });

      if (jumlahPemakaiBagian >= bagianData.limitUser) {
        req.flash(
          "error",
          `Bagian ${bagianData.nama} sudah penuh. Silakan pilih bagian lain.`
        );

        return res.redirect("/register");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      nama: cleanNama,
      username: cleanUsername,
      password: hashedPassword,
      role: "user",
      bagian: bagianData.nama
    });

    /*
      Setelah akun berhasil dibuat, hapus NIP dari whitelist.
      Whitelist hanya izin untuk mendaftar, bukan daftar nama abadi.
    */
    await UsernameWhitelist.deleteMany({
      username: cleanUsername
    });

    req.flash("success", "Akun berhasil dibuat. Silakan login.");
    return res.redirect("/login");
  } catch (error) {
    console.error("Gagal register:", error);
    req.flash("error", "Gagal membuat akun.");
    return res.redirect("/register");
  }
};

const login = async (req, res) => {
  try {
    const cleanUsername = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!cleanUsername || !password) {
      req.flash("error", "NIP dan password wajib diisi.");
      return res.redirect("/login");
    }

    const user = await User.findOne({
      username: cleanUsername
    });

    if (!user) {
      req.flash("error", "Login Gagal, NIP tidak ditemukan.");
      return res.redirect("/login");
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      req.flash("error", "Password salah.");
      return res.redirect("/login");
    }

    req.session.user = {
      id: user._id,
      _id: user._id,
      nama: user.nama,
      username: user.username,
      role: user.role,
      bagian: user.bagian,
      subAdminGroup: user.subAdminGroup || "",
      bagianDibawahi: user.bagianDibawahi || []
    };

    return req.session.save(() => {
      if (user.role === "admin") {
        return res.redirect("/admin/dashboard");
      }

      if (user.role === "sub_admin") {
        return res.redirect("/sub-admin/dashboard");
      }

      return res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Login gagal:", error);
    req.flash("error", "Login gagal.");
    return res.redirect("/login");
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    return res.redirect("/login");
  });
};

module.exports = {
  showLogin,
  showRegister,
  register,
  login,
  logout
};
