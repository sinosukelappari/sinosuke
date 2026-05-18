const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Surat = require("../models/Surat");

const { getAppConfig } = require("../utils/appConfig");

function getSessionUser(req) {
  return req.session.user || {};
}

function getSessionUserId(req) {
  const sessionUser = getSessionUser(req);

  return sessionUser.id || sessionUser._id || null;
}

function getHomeDashboardPath(sessionUser) {
  if (sessionUser && sessionUser.role === "admin") {
    return "/admin/dashboard";
  }

  if (sessionUser && sessionUser.role === "sub_admin") {
    return "/sub-admin/dashboard";
  }

  return "/dashboard";
}

/*
  Untuk kebutuhan tampilan.
  Jika user adalah sub_admin, maka bagian/jabatan yang ditampilkan
  memakai subAdminGroup, contoh: KASUBBAG TU.

  Ini tidak mengubah database.
  Ini hanya object yang dikirim ke EJS.
*/
function buildViewUser(sessionUser, dbUser) {
  const sourceUser = dbUser || sessionUser || {};

  const viewUser = {
    id: sourceUser.id || sourceUser._id || sessionUser.id || sessionUser._id,
    _id: sourceUser._id || sourceUser.id || sessionUser._id || sessionUser.id,
    nama: sourceUser.nama || sessionUser.nama || "",
    username: sourceUser.username || sessionUser.username || "",
    role: sourceUser.role || sessionUser.role || "user",
    bagian: sourceUser.bagian || sessionUser.bagian || "",
    subAdminGroup: sourceUser.subAdminGroup || sessionUser.subAdminGroup || "",
    bagianDibawahi: sourceUser.bagianDibawahi || sessionUser.bagianDibawahi || []
  };

  if (viewUser.role === "sub_admin") {
    viewUser.bagianAsli = viewUser.bagian;
    viewUser.bagian = viewUser.subAdminGroup || viewUser.bagian || "SUB ADMIN";
  }

  return viewUser;
}

function buildSuratUserFilter(sessionUser) {
  const userId = sessionUser.id || sessionUser._id || null;
  const username = sessionUser.username || "";

  const queryOr = [];

  if (userId) {
    queryOr.push({ userId: userId });
  }

  if (username) {
    queryOr.push({ username: username });
  }

  return queryOr.length > 0 ? { $or: queryOr } : { _id: null };
}

const dashboardUser = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    /*
      Sub admin tidak boleh masuk dashboard user biasa.
      Dia tetap bisa membuat surat, tapi lewat dashboard sub admin.
    */
    if (sessionUser.role === "sub_admin") {
      return res.redirect("/sub-admin/dashboard");
    }

    const appConfig = await getAppConfig();

    const filter = buildSuratUserFilter(sessionUser);

    const totalSuratUser = await Surat.countDocuments(filter);

    return res.render("user-dashboard", {
      user: buildViewUser(sessionUser),
      dariBagianMode: appConfig.dariBagianMode || "manual",
      spreadsheetUrl: appConfig.spreadsheetUrl || "",
      totalSuratUser,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("Gagal memuat dashboard user:", error);
    req.flash("error", "Gagal memuat dashboard.");
    return res.redirect("/login");
  }
};

const suratSaya = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    const filter = buildSuratUserFilter(sessionUser);

    const suratList = await Surat.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.render("user-surat", {
      user: buildViewUser(sessionUser),
      suratList,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("Gagal memuat data surat user:", error);
    req.flash("error", "Gagal memuat data surat.");
    return res.redirect(getHomeDashboardPath(getSessionUser(req)));
  }
};

const profileUser = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    const userId = getSessionUserId(req);

    if (!userId) {
      req.flash("error", "Session user tidak valid. Silakan login ulang.");
      return res.redirect("/login");
    }

    const userData = await User.findById(userId).lean();

    if (!userData) {
      req.flash("error", "Data user tidak ditemukan. Silakan login ulang.");

      return req.session.destroy(function () {
        return res.redirect("/login");
      });
    }

    const viewUser = buildViewUser(sessionUser, userData);

    return res.render("user-profile", {
      user: viewUser,
      userData,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("Gagal memuat profil:", error);
    req.flash("error", "Gagal memuat profil.");
    return res.redirect(getHomeDashboardPath(getSessionUser(req)));
  }
};

const updatePasswordUser = async (req, res) => {
  try {
    const { passwordLama, passwordBaru, konfirmasiPassword } = req.body;

    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      req.flash("error", "Semua field password wajib diisi.");
      return res.redirect("/profile");
    }

    if (passwordBaru !== konfirmasiPassword) {
      req.flash("error", "Konfirmasi password tidak sama.");
      return res.redirect("/profile");
    }

    if (passwordBaru.length < 6) {
      req.flash("error", "Password baru minimal 6 karakter.");
      return res.redirect("/profile");
    }

    const userId = getSessionUserId(req);

    if (!userId) {
      req.flash("error", "Session user tidak valid. Silakan login ulang.");
      return res.redirect("/login");
    }

    const user = await User.findById(userId);

    if (!user) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect("/profile");
    }

    const valid = await bcrypt.compare(passwordLama, user.password);

    if (!valid) {
      req.flash("error", "Password lama salah.");
      return res.redirect("/profile");
    }

    user.password = await bcrypt.hash(passwordBaru, 10);
    await user.save();

    req.flash("success", "Password berhasil diperbarui.");
    return res.redirect("/profile");
  } catch (error) {
    console.error("Gagal memperbarui password:", error);
    req.flash("error", "Gagal memperbarui password.");
    return res.redirect("/profile");
  }
};

const updateNameUser = async (req, res) => {
  try {
    const { nama } = req.body;

    if (!nama || nama.trim() === "") {
      req.flash("error", "Nama tidak boleh kosong.");
      return res.redirect("/profile");
    }

    const userId = getSessionUserId(req);

    if (!userId) {
      req.flash("error", "Session user tidak valid. Silakan login ulang.");
      return res.redirect("/login");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          nama: nama.trim()
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect("/profile");
    }

    /*
      Update nama di session.
      Jangan hapus role, bagian, subAdminGroup, dan bagianDibawahi.
      Kalau tidak, session sub admin bisa berubah jadi amnesia administratif.
    */
    req.session.user = {
      ...req.session.user,
      id: updatedUser._id,
      _id: updatedUser._id,
      nama: updatedUser.nama,
      username: updatedUser.username,
      role: updatedUser.role,
      bagian: updatedUser.bagian,
      subAdminGroup: updatedUser.subAdminGroup || "",
      bagianDibawahi: updatedUser.bagianDibawahi || []
    };

    req.flash("success", "Nama berhasil diperbarui.");
    return res.redirect("/profile");
  } catch (error) {
    console.error("Gagal memperbarui nama:", error);
    req.flash("error", "Gagal memperbarui nama.");
    return res.redirect("/profile");
  }
};

module.exports = {
  dashboardUser,
  suratSaya,
  profileUser,
  updatePasswordUser,
  updateNameUser
};