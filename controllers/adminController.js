const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Bagian = require("../models/Bagian");
const Surat = require("../models/Surat");
const UsernameWhitelist = require("../models/UsernameWhitelist");

const {
  getAppConfig,
  updateAppConfig
} = require("../utils/appConfig");

function parseLimitUser(rawValue) {
  const value = String(rawValue || "").trim();

  if (!value) {
    return {
      valid: true,
      value: null
    };
  }

  if (!/^\d+$/.test(value)) {
    return {
      valid: false,
      message: "Limit user harus berupa angka atau dikosongkan untuk unlimited."
    };
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    return {
      valid: false,
      message: "Limit user minimal 1 atau dikosongkan untuk unlimited."
    };
  }

  return {
    valid: true,
    value: numberValue
  };
}

const dashboardAdmin = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .lean();
    const subAdminList = await User.find({
      role: "sub_admin",
      isSubAdminActive: true
    })
      .sort({ tanggalDitunjuk: -1, createdAt: -1 })
      .populate("ditunjukOleh", "nama username")
      .lean();
    const bagianList = await Bagian.find({ aktif: true })
      .sort({ nama: 1 })
      .lean();

    const appConfig = await getAppConfig();

    const suratList = await Surat.find({})
      .sort({ createdAt: -1 })
      .populate("userId", "nama username bagian role")
      .lean();

    const totalSurat = await Surat.countDocuments();

    const whitelistList = await UsernameWhitelist.find({})
      .sort({ createdAt: -1 })
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

    return res.render("admin-dashboard", {
      user: req.session.user,
      users,
      bagianList,
      bagianUsageMap,
      appConfig,
      suratList,
      totalSurat,
      subAdminList,
      whitelistList,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("Gagal memuat dashboard admin:", error);
    req.flash("error", "Gagal memuat dashboard admin.");
    return res.redirect("/dashboard");
  }
};

const updateBagianUser = async (req, res) => {
  try {
    const { id } = req.params;
    const bagian = String(req.body.bagian || "").trim().toUpperCase();

    if (!bagian) {
      req.flash("error", "Bagian tidak boleh kosong.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    const bagianData = await Bagian.findOne({
      nama: bagian,
      aktif: true
    });

    if (!bagianData) {
      req.flash("error", "Bagian tidak valid atau belum terdaftar.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    const userTarget = await User.findById(id);

    if (!userTarget) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    if (userTarget.role === "admin") {
      req.flash("error", "Bagian akun admin tidak dapat diubah.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    if (bagianData.limitUser !== null && bagianData.limitUser !== undefined) {
      const jumlahPemakaiBagian = await User.countDocuments({
        _id: { $ne: userTarget._id },
        role: { $ne: "admin" },
        bagian: bagianData.nama
      });

      if (jumlahPemakaiBagian >= bagianData.limitUser) {
        req.flash(
          "error",
          `Bagian ${bagianData.nama} sudah mencapai limit ${bagianData.limitUser} user.`
        );

        return res.redirect("/admin/dashboard#akunSection");
      }
    }

    userTarget.bagian = bagianData.nama;
    await userTarget.save();

    req.flash(
      "success",
      `Bagian user ${userTarget.nama} berhasil diubah menjadi ${userTarget.bagian}.`
    );

    return res.redirect("/admin/dashboard#akunSection");
  } catch (error) {
    console.error("Gagal update bagian:", error);
    req.flash("error", "Gagal memperbarui bagian user.");
    return res.redirect("/admin/dashboard#akunSection");
  }
};

const tambahBagian = async (req, res) => {
  try {
    const nama = String(req.body.nama || "").trim().toUpperCase();
    const parsedLimit = parseLimitUser(req.body.limitUser);

    if (!nama) {
      req.flash("error", "Nama bagian wajib diisi.");
      return res.redirect("/admin/dashboard#bagianSection");
    }

    if (!parsedLimit.valid) {
      req.flash("error", parsedLimit.message);
      return res.redirect("/admin/dashboard#bagianSection");
    }

    const existingBagian = await Bagian.findOne({ nama });

    if (existingBagian) {
      req.flash("error", "Bagian sudah terdaftar.");
      return res.redirect("/admin/dashboard#bagianSection");
    }

    await Bagian.create({
      nama,
      aktif: true,
      limitUser: parsedLimit.value
    });

    req.flash("success", `Bagian ${nama} berhasil ditambahkan.`);
    return res.redirect("/admin/dashboard#bagianSection");
  } catch (error) {
    console.error("Gagal menambahkan bagian:", error);

    if (error.code === 11000) {
      req.flash("error", "Bagian sudah terdaftar.");
      return res.redirect("/admin/dashboard#bagianSection");
    }

    req.flash("error", "Gagal menambahkan bagian.");
    return res.redirect("/admin/dashboard#bagianSection");
  }
};

const hapusBagian = async (req, res) => {
  try {
    const { id } = req.params;

    const bagian = await Bagian.findById(id);

    if (!bagian) {
      req.flash("error", "Bagian tidak ditemukan.");
      return res.redirect("/admin/dashboard#bagianSection");
    }

    const jumlahUserMemakaiBagian = await User.countDocuments({
      bagian: bagian.nama
    });

    if (jumlahUserMemakaiBagian > 0) {
      req.flash(
        "error",
        `Bagian ${bagian.nama} tidak bisa dihapus karena masih digunakan oleh ${jumlahUserMemakaiBagian} akun.`
      );

      return res.redirect("/admin/dashboard#bagianSection");
    }

    await Bagian.findByIdAndDelete(id);

    req.flash("success", `Bagian ${bagian.nama} berhasil dihapus.`);
    return res.redirect("/admin/dashboard#bagianSection");
  } catch (error) {
    console.error("Gagal menghapus bagian:", error);
    req.flash("error", "Gagal menghapus bagian.");
    return res.redirect("/admin/dashboard#bagianSection");
  }
};

const updateLimitBagian = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedLimit = parseLimitUser(req.body.limitUser);

    if (!parsedLimit.valid) {
      req.flash("error", parsedLimit.message);
      return res.redirect("/admin/dashboard#bagianSection");
    }

    const bagian = await Bagian.findById(id);

    if (!bagian) {
      req.flash("error", "Bagian tidak ditemukan.");
      return res.redirect("/admin/dashboard#bagianSection");
    }

    const jumlahPemakaiBagian = await User.countDocuments({
      role: { $ne: "admin" },
      bagian: bagian.nama
    });

    if (
      parsedLimit.value !== null &&
      jumlahPemakaiBagian > parsedLimit.value
    ) {
      req.flash(
        "error",
        `Limit tidak boleh lebih kecil dari jumlah user yang sudah memakai bagian ${bagian.nama}. Saat ini digunakan oleh ${jumlahPemakaiBagian} user.`
      );

      return res.redirect("/admin/dashboard#bagianSection");
    }

    bagian.limitUser = parsedLimit.value;
    await bagian.save();

    const limitText = parsedLimit.value === null
      ? "unlimited"
      : `${parsedLimit.value} user`;

    req.flash(
      "success",
      `Limit bagian ${bagian.nama} berhasil diubah menjadi ${limitText}.`
    );

    return res.redirect("/admin/dashboard#bagianSection");
  } catch (error) {
    console.error("Gagal update limit bagian:", error);
    req.flash("error", "Gagal memperbarui limit bagian.");
    return res.redirect("/admin/dashboard#bagianSection");
  }
};

const updateSettingAplikasi = async (req, res) => {
  try {
    await updateAppConfig({
      dariBagianMode: req.body.dariBagianMode,
      spreadsheetUrl: req.body.spreadsheetUrl,
      googleScriptUrl: req.body.googleScriptUrl
    });

    req.flash("success", "Konfigurasi aplikasi berhasil diperbarui.");
    return res.redirect("/admin/dashboard#configSection");
  } catch (error) {
    console.error("Gagal update konfigurasi aplikasi:", error);
    req.flash("error", "Gagal memperbarui konfigurasi aplikasi.");
    return res.redirect("/admin/dashboard#configSection");
  }
};

const hapusUser = async (req, res) => {
  try {
    const { id } = req.params;

    const sessionUser = req.session.user || {};
    const sessionUserId = String(sessionUser.id || sessionUser._id || "");

    if (!id) {
      req.flash("error", "ID user tidak valid.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    if (String(id) === sessionUserId) {
      req.flash("error", "Akun admin yang sedang login tidak dapat dihapus.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    if (targetUser.role === "admin") {
      req.flash("error", "Akun administrator tidak dapat dihapus.");
      return res.redirect("/admin/dashboard#akunSection");
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

    await User.findByIdAndDelete(id);

    req.flash("success", `User ${targetUser.nama} berhasil dihapus.`);
    return res.redirect("/admin/dashboard#akunSection");
  } catch (error) {
    console.error("Gagal menghapus user:", error);
    req.flash("error", "Gagal menghapus user.");
    return res.redirect("/admin/dashboard#akunSection");
  }
};

const resetPasswordUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    if (targetUser.role === "admin") {
      req.flash("error", "Password akun administrator tidak dapat direset dari halaman ini.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    const defaultPassword = "12345678";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    targetUser.password = hashedPassword;
    await targetUser.save();

    req.flash(
      "success",
      `Password user ${targetUser.nama} berhasil direset menjadi 12345678.`
    );

    return res.redirect("/admin/dashboard#akunSection");
  } catch (error) {
    console.error("Gagal reset password user:", error);
    req.flash("error", "Gagal mereset password user.");
    return res.redirect("/admin/dashboard#akunSection");
  }
};

const tambahUsernameWhitelist = async (req, res) => {
  try {
    const rawUsernames = String(req.body.usernames || "").trim();

    if (!rawUsernames) {
      req.flash("error", "NIP wajib diisi.");
      return res.redirect("/admin/dashboard#whitelistSection");
    }

    const usernameList = rawUsernames
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter((item) => item !== "");

    if (usernameList.length === 0) {
      req.flash("error", "Tidak ada NIP yang valid untuk ditambahkan.");
      return res.redirect("/admin/dashboard#whitelistSection");
    }

    const isSingleInput = usernameList.length === 1;

    const createdBy =
      req.session.user && (req.session.user.id || req.session.user._id)
        ? req.session.user.id || req.session.user._id
        : null;

    /*
      MODE INPUT SATUAN
      Pesan harus menyebut NIP yang bermasalah.
    */
    if (isSingleInput) {
      const username = usernameList[0];

      if (!/^\d{18}$/.test(username)) {
        req.flash(
          "error",
          `NIP ${username} tidak valid. NIP wajib 18 digit angka.`
        );

        return res.redirect("/admin/dashboard#whitelistSection");
      }

      const existingUser = await User.findOne({ username }).select("username");

      if (existingUser) {
        req.flash(
          "error",
          `NIP ${username} sudah terdaftar sebagai user. NIP ini tidak perlu dimasukkan ke whitelist.`
        );

        return res.redirect("/admin/dashboard#whitelistSection");
      }

      const existingWhitelist = await UsernameWhitelist.findOne({
        username
      }).select("username");

      if (existingWhitelist) {
        req.flash(
          "error",
          `NIP ${username} sudah pernah terdaftar di whitelist.`
        );

        return res.redirect("/admin/dashboard#whitelistSection");
      }

      await UsernameWhitelist.create({
        username,
        createdBy
      });

      req.flash(
        "success",
        `NIP ${username} berhasil ditambahkan ke whitelist.`
      );

      return res.redirect("/admin/dashboard#whitelistSection");
    }

    /*
      MODE INPUT BANYAK
      Tidak tampilkan NIP satu per satu.
      Cukup jumlah ditambahkan dan jumlah dilewati.
    */
    const uniqueUsernames = [...new Set(usernameList)];
    const inputDuplicateCount = usernameList.length - uniqueUsernames.length;

    const validUsernames = uniqueUsernames.filter((username) => {
      return /^\d{18}$/.test(username);
    });

    const invalidCount = uniqueUsernames.length - validUsernames.length;

    if (validUsernames.length === 0) {
      req.flash(
        "error",
        `Tidak ada NIP valid yang ditambahkan. Dilewati: ${uniqueUsernames.length}.`
      );

      return res.redirect("/admin/dashboard#whitelistSection");
    }

    const existingUsers = await User.find({
      username: { $in: validUsernames }
    }).select("username");

    const existingUserSet = new Set(
      existingUsers.map((item) => String(item.username))
    );

    const existingWhitelists = await UsernameWhitelist.find({
      username: { $in: validUsernames }
    }).select("username");

    const existingWhitelistSet = new Set(
      existingWhitelists.map((item) => String(item.username))
    );

    const usernamesToInsert = validUsernames.filter((username) => {
      const alreadyUser = existingUserSet.has(username);
      const alreadyWhitelist = existingWhitelistSet.has(username);

      return !alreadyUser && !alreadyWhitelist;
    });

    let insertedCount = 0;

    if (usernamesToInsert.length > 0) {
      await UsernameWhitelist.insertMany(
        usernamesToInsert.map((username) => {
          return {
            username,
            createdBy
          };
        })
      );

      insertedCount = usernamesToInsert.length;
    }

    const skippedCount =
      inputDuplicateCount +
      invalidCount +
      existingUserSet.size +
      existingWhitelistSet.size;

    req.flash(
      "success",
      `NIP berhasil diproses. Ditambahkan: ${insertedCount}. Dilewati: ${skippedCount}.`
    );

    return res.redirect("/admin/dashboard#whitelistSection");
  } catch (error) {
    console.error("Gagal menambahkan NIP:", error);

    req.flash("error", "Gagal menambahkan NIP.");
    return res.redirect("/admin/dashboard#whitelistSection");
  }
};

const hapusUsernameWhitelist = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await UsernameWhitelist.findByIdAndDelete(id);

    if (!deleted) {
      req.flash("error", "NIP database tidak ditemukan.");
      return res.redirect("/admin/dashboard#whitelistSection");
    }

    req.flash("success", `NIP ${deleted.username} berhasil dihapus.`);
    return res.redirect("/admin/dashboard#whitelistSection");
  } catch (error) {
    console.error("Gagal menghapus NIP database:", error);
    req.flash("error", "Gagal menghapus username whitelist.");
    return res.redirect("/admin/dashboard#whitelistSection");
  }
};
const jadikanSubAdmin = async (req, res) => {
  try {
    /*
      Route baru:
      POST /admin/sub-admin
      ID user dikirim lewat req.body.userId

      Route lama:
      POST /admin/user/:id/jadikan-sub-admin
      ID user dikirim lewat req.params.id

    */
    const id = req.params.id || req.body.userId;

    const subAdminGroup = String(req.body.subAdminGroup || "")
      .trim()
      .toUpperCase();

    let bagianDibawahi = req.body.bagianDibawahi || [];

    if (!Array.isArray(bagianDibawahi)) {
      bagianDibawahi = [bagianDibawahi];
    }

    bagianDibawahi = [...new Set(
      bagianDibawahi
        .map((item) => String(item || "").trim().toUpperCase())
        .filter((item) => item !== "")
    )];

    console.log("DATA FORM SUB ADMIN:", {
      paramsId: req.params.id,
      bodyUserId: req.body.userId,
      idDipakai: id,
      subAdminGroup,
      bagianDibawahi
    });

    if (!id) {
      req.flash("error", "User calon sub admin wajib dipilih.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (!subAdminGroup) {
      req.flash("error", "Nama sub admin wajib diisi.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (bagianDibawahi.length === 0) {
      req.flash("error", "Minimal pilih satu bagian yang dibawahi sub admin.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", `User tidak ditemukan. ID yang dikirim: ${id}`);
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (targetUser.role === "admin") {
      req.flash("error", "Akun admin besar tidak dapat dijadikan sub admin.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    const bagianValid = await Bagian.find({
      nama: { $in: bagianDibawahi },
      aktif: true
    }).lean();

    const bagianValidNames = bagianValid.map((item) => item.nama);

    const bagianTidakValid = bagianDibawahi.filter((item) => {
      return !bagianValidNames.includes(item);
    });

    if (bagianTidakValid.length > 0) {
      req.flash(
        "error",
        `Bagian berikut tidak valid atau tidak aktif: ${bagianTidakValid.join(", ")}`
      );

      return res.redirect("/admin/dashboard#subAdminSection");
    }

    const existingSubAdmin = await User.findOne({
      role: "sub_admin",
      subAdminGroup,
      isSubAdminActive: true,
      _id: { $ne: targetUser._id }
    });

    if (existingSubAdmin) {
      req.flash(
        "error",
        `Sub admin ${subAdminGroup} sudah digunakan oleh ${existingSubAdmin.nama}.`
      );

      return res.redirect("/admin/dashboard#subAdminSection");
    }

    targetUser.role = "sub_admin";
    targetUser.subAdminGroup = subAdminGroup;
    targetUser.bagianDibawahi = bagianDibawahi;
    targetUser.isSubAdminActive = true;
    targetUser.ditunjukOleh =
      req.session.user && (req.session.user.id || req.session.user._id)
        ? req.session.user.id || req.session.user._id
        : null;
    targetUser.tanggalDitunjuk = new Date();

    await targetUser.save();

    req.flash(
      "success",
      `${targetUser.nama} berhasil dijadikan sub admin ${subAdminGroup}.`
    );

    return res.redirect("/admin/dashboard#subAdminSection");
  } catch (error) {
    console.error("Gagal menjadikan sub admin:", error);

    if (error.name === "CastError") {
      req.flash("error", "ID user tidak valid. Cek value pada dropdown Pilih User.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (error.code === 11000) {
      req.flash("error", "Sub admin untuk kelompok tersebut sudah ada.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    req.flash("error", "Gagal menjadikan user sebagai sub admin.");
    return res.redirect("/admin/dashboard#subAdminSection");
  }
};

const cabutSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    if (targetUser.role !== "sub_admin") {
      req.flash("error", "User ini bukan sub admin.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    targetUser.role = "user";
    targetUser.subAdminGroup = "";
    targetUser.bagianDibawahi = [];
    targetUser.isSubAdminActive = false;
    targetUser.ditunjukOleh = null;
    targetUser.tanggalDitunjuk = null;

    await targetUser.save();

    req.flash("success", `Hak sub admin ${targetUser.nama} berhasil dicabut.`);
    return res.redirect("/admin/dashboard#akunSection");
  } catch (error) {
    console.error("Gagal mencabut sub admin:", error);
    req.flash("error", "Gagal mencabut hak sub admin.");
    return res.redirect("/admin/dashboard#akunSection");
  }
};

const updateBagianDibawahiSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    let bagianDibawahi = req.body.bagianDibawahi || [];

    if (!Array.isArray(bagianDibawahi)) {
      bagianDibawahi = [bagianDibawahi];
    }

    bagianDibawahi = bagianDibawahi
      .map((item) => String(item || "").trim().toUpperCase())
      .filter((item) => item !== "");

    if (bagianDibawahi.length === 0) {
      req.flash("error", "Minimal pilih satu bagian yang dibawahi.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "User tidak ditemukan.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    if (targetUser.role !== "sub_admin") {
      req.flash("error", "User ini bukan sub admin.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    const bagianValid = await Bagian.find({
      nama: { $in: bagianDibawahi },
      aktif: true
    }).lean();

    if (bagianValid.length !== bagianDibawahi.length) {
      req.flash("error", "Ada bagian yang tidak valid atau tidak aktif.");
      return res.redirect("/admin/dashboard#akunSection");
    }

    targetUser.bagianDibawahi = bagianDibawahi;
    await targetUser.save();

    req.flash(
      "success",
      `Bagian yang dibawahi oleh ${targetUser.nama} berhasil diperbarui.`
    );

    return res.redirect("/admin/dashboard#akunSection");
  } catch (error) {
    console.error("Gagal update bagian dibawahi sub admin:", error);
    req.flash("error", "Gagal memperbarui bagian yang dibawahi sub admin.");
    return res.redirect("/admin/dashboard#akunSection");
  }
};


const tambahBagianSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    let bagianTambahan = req.body.bagianTambahan || [];

    if (!Array.isArray(bagianTambahan)) {
      bagianTambahan = [bagianTambahan];
    }

    bagianTambahan = [...new Set(
      bagianTambahan
        .map((item) => String(item || "").trim().toUpperCase())
        .filter((item) => item !== "")
    )];

    if (!id) {
      req.flash("error", "ID sub admin tidak valid.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (bagianTambahan.length === 0) {
      req.flash("error", "Pilih minimal satu bagian untuk ditambahkan.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "Sub admin tidak ditemukan.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (targetUser.role !== "sub_admin") {
      req.flash("error", "User ini bukan sub admin.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    const bagianValid = await Bagian.find({
      nama: { $in: bagianTambahan },
      aktif: true
    }).lean();

    const bagianValidNames = bagianValid.map((item) => item.nama);

    if (bagianValidNames.length === 0) {
      req.flash("error", "Bagian yang dipilih tidak valid atau tidak aktif.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    const bagianLama = Array.isArray(targetUser.bagianDibawahi)
      ? targetUser.bagianDibawahi
      : [];

    targetUser.bagianDibawahi = [...new Set([
      ...bagianLama,
      ...bagianValidNames
    ])];

    await targetUser.save();

    req.flash(
      "success",
      `Bagian sub admin ${targetUser.nama} berhasil ditambahkan.`
    );

    return res.redirect("/admin/dashboard#subAdminSection");
  } catch (error) {
    console.error("Gagal menambah bagian sub admin:", error);

    if (error.name === "CastError") {
      req.flash("error", "ID sub admin tidak valid.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    req.flash("error", "Gagal menambah bagian sub admin.");
    return res.redirect("/admin/dashboard#subAdminSection");
  }
};

const hapusBagianSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const bagian = String(req.body.bagian || "")
      .trim()
      .toUpperCase();

    if (!id) {
      req.flash("error", "ID sub admin tidak valid.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (!bagian) {
      req.flash("error", "Bagian yang akan dihapus tidak valid.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      req.flash("error", "Sub admin tidak ditemukan.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    if (targetUser.role !== "sub_admin") {
      req.flash("error", "User ini bukan sub admin.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    targetUser.bagianDibawahi = (targetUser.bagianDibawahi || []).filter(
      (item) => String(item || "").trim().toUpperCase() !== bagian
    );

    await targetUser.save();

    req.flash(
      "success",
      `Bagian ${bagian} berhasil dihapus dari sub admin ${targetUser.nama}.`
    );

    return res.redirect("/admin/dashboard#subAdminSection");
  } catch (error) {
    console.error("Gagal menghapus bagian sub admin:", error);

    if (error.name === "CastError") {
      req.flash("error", "ID sub admin tidak valid.");
      return res.redirect("/admin/dashboard#subAdminSection");
    }

    req.flash("error", "Gagal menghapus bagian sub admin.");
    return res.redirect("/admin/dashboard#subAdminSection");
  }
};

module.exports = {
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
};
