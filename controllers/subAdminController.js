const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Surat = require("../models/Surat");
const UsernameWhitelist = require("../models/UsernameWhitelist");

const { getAppConfig } = require("../utils/appConfig");

function getSessionUserId(req) {
  return req.session.user && (req.session.user.id || req.session.user._id)
    ? req.session.user.id || req.session.user._id
    : null;
}

function normalizeBagian(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeBagianList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item) => normalizeBagian(item))
    .filter((item) => item !== "");
}

function getValidActiveSection(req) {
  const allowedSections = [
    "dashboard",
    "buat-surat",
    "profile",
    "surat-saya",
    "akun-staf",
    "whitelist",
    "surat-bawahan",
    "sheet"
  ];

  const requestedSection = String(req.query.section || "dashboard").trim();

  return allowedSections.includes(requestedSection)
    ? requestedSection
    : "dashboard";
}

function redirectSubAdminSection(section) {
  return `/sub-admin/dashboard?section=${encodeURIComponent(section)}`;
}

async function getActiveSubAdmin(req) {
  const sessionUserId = getSessionUserId(req);

  if (!sessionUserId) {
    return null;
  }

  return User.findById(sessionUserId);
}

async function getSuratSayaList(subAdmin) {
  if (!subAdmin) {
    return [];
  }

  return Surat.find({
    $or: [
      { userId: subAdmin._id },
      { username: subAdmin.username }
    ]
  })
    .sort({ createdAt: -1 })
    .populate("userId", "nama username bagian role")
    .lean();
}

const dashboardSubAdmin = async (req, res) => {
  try {
    const activeSection = getValidActiveSection(req);
    const subAdmin = await getActiveSubAdmin(req);

    if (!subAdmin || subAdmin.role !== "sub_admin") {
      req.flash("error", "Anda tidak memiliki akses sebagai sub admin.");
      return res.redirect("/dashboard");
    }

    const bagianDibawahi = normalizeBagianList(subAdmin.bagianDibawahi);
    const appConfig = await getAppConfig();

    const users = await User.find({
      role: "user",
      bagian: {
        $in: bagianDibawahi
      }
    })
      .sort({ createdAt: -1 })
      .lean();

    const userBawahanIds = users.map((item) => item._id);

    const suratBawahanFilter = {
      $or: [
        {
          dariBagian: {
            $in: bagianDibawahi
          }
        },
        {
          userId: {
            $in: userBawahanIds
          }
        }
      ]
    };

    const suratList = await Surat.find(suratBawahanFilter)
      .sort({ createdAt: -1 })
      .populate("userId", "nama username bagian role")
      .lean();

    const suratSayaList = await getSuratSayaList(subAdmin);

    const totalSuratBawahan = await Surat.countDocuments(suratBawahanFilter);

    const totalSuratUser = await Surat.countDocuments({
      $or: [
        { userId: subAdmin._id },
        { username: subAdmin.username }
      ]
    });

    const whitelistList = await UsernameWhitelist.find({
      createdBy: subAdmin._id
    })
      .sort({ createdAt: -1 })
      .lean();

    const safeSubAdmin = subAdmin.toObject
      ? subAdmin.toObject()
      : subAdmin;

    return res.render("sub-admin-dashboard", {
      user: safeSubAdmin,
      userData: safeSubAdmin,

      activeSection: activeSection,

      appConfig: appConfig,
      dariBagianMode: appConfig.dariBagianMode || "manual",
      spreadsheetUrl: appConfig.spreadsheetUrl || "",

      users: users,
      suratList: suratList,
      suratSayaList: suratSayaList,
      whitelistList: whitelistList,
      bagianDibawahi: bagianDibawahi,

      totalSuratUser: totalSuratUser,
      totalSuratBawahan: totalSuratBawahan,

      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("Gagal memuat dashboard sub admin:", error);

    req.flash("error", "Gagal memuat dashboard sub admin.");
    return res.redirect("/dashboard");
  }
};

const resetPasswordUserBawahan = async (req, res) => {
  try {
    const { id } = req.params;

    const subAdmin = await getActiveSubAdmin(req);

    if (!subAdmin || subAdmin.role !== "sub_admin") {
      req.flash("error", "Anda tidak memiliki akses sebagai sub admin.");
      return res.redirect("/dashboard");
    }

    const bagianDibawahi = normalizeBagianList(subAdmin.bagianDibawahi);

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect(redirectSubAdminSection("akun-staf"));
    }

    if (targetUser.role !== "user") {
      req.flash("error", "Sub admin hanya boleh mereset password user biasa.");
      return res.redirect(redirectSubAdminSection("akun-staf"));
    }

    const targetBagian = normalizeBagian(targetUser.bagian);

    if (!bagianDibawahi.includes(targetBagian)) {
      req.flash("error", "User ini berada di luar bagian yang Anda bawahi.");
      return res.redirect(redirectSubAdminSection("akun-staf"));
    }

    const defaultPassword = "12345678";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    targetUser.password = hashedPassword;
    await targetUser.save();

    req.flash(
      "success",
      `Password user ${targetUser.nama} berhasil direset menjadi 12345678.`
    );

    return res.redirect(redirectSubAdminSection("akun-staf"));
  } catch (error) {
    console.error("Gagal reset password oleh sub admin:", error);

    req.flash("error", "Gagal mereset password user.");
    return res.redirect(redirectSubAdminSection("akun-staf"));
  }
};

const hapusUserBawahan = async (req, res) => {
  try {
    const { id } = req.params;

    const subAdmin = await getActiveSubAdmin(req);

    if (!subAdmin || subAdmin.role !== "sub_admin") {
      req.flash("error", "Anda tidak memiliki akses sebagai sub admin.");
      return res.redirect("/dashboard");
    }

    const bagianDibawahi = normalizeBagianList(subAdmin.bagianDibawahi);

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect(redirectSubAdminSection("akun-staf"));
    }

    if (targetUser.role !== "user") {
      req.flash("error", "Sub admin hanya boleh menghapus user biasa.");
      return res.redirect(redirectSubAdminSection("akun-staf"));
    }

    const targetBagian = normalizeBagian(targetUser.bagian);

    if (!bagianDibawahi.includes(targetBagian)) {
      req.flash("error", "User ini berada di luar bagian yang Anda bawahi.");
      return res.redirect(redirectSubAdminSection("akun-staf"));
    }

    await Surat.updateMany(
      { userId: targetUser._id },
      {
        $set: {
          userId: null,
          namaUser: targetUser.nama,
          username: targetUser.username
        }
      }
    );

    await User.findByIdAndDelete(targetUser._id);

    req.flash("success", `User ${targetUser.nama} berhasil dihapus.`);
    return res.redirect(redirectSubAdminSection("akun-staf"));
  } catch (error) {
    console.error("Gagal menghapus user bawahan:", error);

    req.flash("error", "Gagal menghapus user bawahan.");
    return res.redirect(redirectSubAdminSection("akun-staf"));
  }
};

const tambahUsernameWhitelistBawahan = async (req, res) => {
  try {
    const rawUsernames = req.body.usernames || "";

    const usernameList = rawUsernames
      .split(/[\s,;]+/)
      .map(function (item) {
        return String(item || "").trim();
      })
      .filter(Boolean);

    const uniqueUsernameList = Array.from(new Set(usernameList));

    if (uniqueUsernameList.length === 0) {
      req.flash("error", "Username/NIP whitelist wajib diisi.");
      return res.redirect("/sub-admin/dashboard?section=whitelist");
    }

    const invalidUsernames = uniqueUsernameList.filter(function (username) {
      return !/^\d{18}$/.test(username);
    });

    if (invalidUsernames.length > 0) {
      req.flash(
        "error",
        "Username/NIP berikut tidak valid karena harus 18 digit angka: " +
          invalidUsernames.join(", ")
      );

      return res.redirect("/sub-admin/dashboard?section=whitelist");
    }

    const registeredUsers = await User.find({
      username: {
        $in: uniqueUsernameList
      }
    })
      .select("username nama role")
      .lean();

    const registeredUsernameSet = new Set(
      registeredUsers.map(function (item) {
        return item.username;
      })
    );

    const registeredUsernames = uniqueUsernameList.filter(function (username) {
      return registeredUsernameSet.has(username);
    });

    const existingWhitelist = await UsernameWhitelist.find({
      username: {
        $in: uniqueUsernameList
      }
    })
      .select("username")
      .lean();

    const existingWhitelistSet = new Set(
      existingWhitelist.map(function (item) {
        return item.username;
      })
    );

    const existingWhitelistUsernames = uniqueUsernameList.filter(function (username) {
      return existingWhitelistSet.has(username);
    });

    const usernamesToInsert = uniqueUsernameList.filter(function (username) {
      return !registeredUsernameSet.has(username) && !existingWhitelistSet.has(username);
    });

    if (registeredUsernames.length > 0) {
      req.flash(
        "error",
        "Username/NIP berikut sudah terdaftar sebagai akun sehingga tidak perlu dimasukkan ke whitelist: " +
          registeredUsernames.join(", ")
      );
    }

    if (existingWhitelistUsernames.length > 0) {
      req.flash(
        "error",
        "Username/NIP berikut sudah ada di whitelist: " +
          existingWhitelistUsernames.join(", ")
      );
    }

    if (usernamesToInsert.length === 0) {
      return res.redirect("/sub-admin/dashboard?section=whitelist");
    }

    await UsernameWhitelist.insertMany(
      usernamesToInsert.map(function (username) {
        return {
          username: username
        };
      }),
      {
        ordered: false
      }
    );

    req.flash(
      "success",
      "Berhasil menambahkan " +
        usernamesToInsert.length +
        " username/NIP ke whitelist."
    );

    return res.redirect("/sub-admin/dashboard?section=whitelist");
  } catch (error) {
    console.error("Gagal menambahkan whitelist sub admin:", error);

    if (error && error.code === 11000) {
      req.flash("error", "Sebagian username/NIP sudah ada di whitelist.");
    } else {
      req.flash("error", "Gagal menambahkan username/NIP ke whitelist.");
    }

    return res.redirect("/sub-admin/dashboard?section=whitelist");
  }
};

const hapusUsernameWhitelistBawahan = async (req, res) => {
  try {
    const whitelistId = req.params.id;

    if (!whitelistId) {
      req.flash("error", "ID whitelist tidak ditemukan.");
      return res.redirect("/sub-admin/dashboard?section=whitelist");
    }

    await UsernameWhitelist.findByIdAndDelete(whitelistId);

    req.flash("success", "Username/NIP whitelist berhasil dihapus.");
    return res.redirect("/sub-admin/dashboard?section=whitelist");
  } catch (error) {
    console.error("Gagal menghapus whitelist sub admin:", error);

    req.flash("error", "Gagal menghapus username/NIP whitelist.");
    return res.redirect("/sub-admin/dashboard?section=whitelist");
  }
};
module.exports = {
  dashboardSubAdmin,
  resetPasswordUserBawahan,
  hapusUserBawahan,
  tambahUsernameWhitelistBawahan,
  hapusUsernameWhitelistBawahan
};