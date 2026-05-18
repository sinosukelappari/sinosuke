const express = require("express");
const router = express.Router();

const Bagian = require("../models/Bagian");
const Surat = require("../models/Surat");

const kodeTambahanData = require("../data/kodeTambahanData");
const { getAppConfig } = require("../utils/appConfig");

router.get("/bagian", async function (req, res) {
  try {
    const bagianList = await Bagian.find({ aktif: true })
      .sort({ nama: 1 })
      .select("nama -_id")
      .lean();

    const data = bagianList.map(function (item) {
      return item.nama;
    });

    return res.json({
      status: "success",
      data: data
    });
  } catch (error) {
    console.error("Gagal mengambil data bagian:", error);

    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data bagian dari database.",
      data: []
    });
  }
});

router.get("/kode-tambahan/:kodeUtama", function (req, res) {
  const kodeUtama = String(req.params.kodeUtama || "")
    .trim()
    .toUpperCase();

  return res.json({
    status: "success",
    data: kodeTambahanData[kodeUtama] || []
  });
});

router.get("/last-number", async function (req, res) {
  try {
    const appConfig = await getAppConfig();
    const googleScriptUrl = appConfig.googleScriptUrl;

    const kodeKlasifikasi = req.query.kodeKlasifikasi;

    if (!kodeKlasifikasi) {
      return res.status(400).json({
        status: "error",
        message: "Kode klasifikasi wajib dikirim."
      });
    }

    if (!googleScriptUrl) {
      return res.status(500).json({
        status: "error",
        message: "GOOGLE_SCRIPT_URL belum diatur oleh admin."
      });
    }

    const targetUrl =
      googleScriptUrl +
      "?action=getLastNumber&kodeKlasifikasi=" +
      encodeURIComponent(kodeKlasifikasi);

    const response = await fetch(targetUrl);
    const result = await response.json();

    return res.json(result);
  } catch (error) {
    console.error("Gagal mengambil nomor surat:", error);

    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil nomor surat dari server."
    });
  }
});

router.post("/", async function (req, res) {
  try {
    const appConfig = await getAppConfig();
    const googleScriptUrl = appConfig.googleScriptUrl;

    if (!googleScriptUrl) {
      return res.status(500).json({
        status: "error",
        message: "GOOGLE_SCRIPT_URL belum diatur oleh admin."
      });
    }

    const user = req.session.user || {};
    const userId = user.id || user._id || null;

    const data = {
      hariTanggal: req.body.hariTanggal || "",
      kodeSatker: req.body.kodeSatker || appConfig.kodeSatker || "WP.3.PAS.4-",
      jenisSurat: normalizeJenisSurat(req.body.jenisSurat || "SURAT_KEPUTUSAN"),
      kodeKlasifikasi: req.body.kodeKlasifikasi || "",
      kodeTambahan: req.body.kodeTambahan || "",
      dariBagian: req.body.dariBagian || "",
      tujuanSurat: req.body.tujuanSurat || "",
      halSurat: req.body.halSurat || "",
      namaUser: user.nama || req.body.namaUser || "",
      username: user.username || req.body.username || ""
    };

    if (!data.jenisSurat) {
      return res.status(400).json({
        status: "error",
        message: "Jenis surat wajib dipilih."
      });
    }

    if (!data.kodeKlasifikasi) {
      return res.status(400).json({
        status: "error",
        message: "Kode klasifikasi wajib diisi."
      });
    }

    if (!data.kodeTambahan) {
      return res.status(400).json({
        status: "error",
        message: "Kode tambahan wajib diisi."
      });
    }

    if (!data.dariBagian) {
      return res.status(400).json({
        status: "error",
        message: "Dari Bagian wajib diisi."
      });
    }

    if (!data.tujuanSurat) {
      return res.status(400).json({
        status: "error",
        message: "Tujuan Surat wajib diisi."
      });
    }

    if (!data.halSurat) {
      return res.status(400).json({
        status: "error",
        message: "Hal Surat wajib diisi."
      });
    }

    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status !== "success") {
      return res.json(result);
    }

    const sheetRow = result.sheetRow || result.row || null;
    const sheetGid = result.sheetGid ? String(result.sheetGid) : "";
    const spreadsheetId = result.spreadsheetId || "";
    const spreadsheetUrl = result.spreadsheetUrl || appConfig.spreadsheetUrl || "";

    const sheetRowUrl =
      result.sheetRowUrl ||
      buildSheetRowUrl(spreadsheetUrl, sheetGid, sheetRow);

    let mongoSaved = false;
    let mongoError = "";
    let mongoId = null;

    try {
      const suratBaru = await Surat.create({
        userId: userId,

        namaUser: data.namaUser,
        username: data.username,

        noUrut: result.noUrut,
        nomorSurat: result.nomorSurat,
        nomorSuratLengkap: result.nomorSuratLengkap,
        jenisSurat: result.jenisSurat || data.jenisSurat,

        hariTanggal: data.hariTanggal,
        kodeSatker: data.kodeSatker,
        kodeKlasifikasi: data.kodeKlasifikasi,
        kodeTambahan: data.kodeTambahan,

        dariBagian: data.dariBagian,
        tujuanSurat: data.tujuanSurat,
        halSurat: data.halSurat,

        sheetName: result.sheetName || "",
        sheetRow: sheetRow,

        sheetGid: sheetGid,
        spreadsheetId: spreadsheetId,
        spreadsheetUrl: spreadsheetUrl,
        sheetRowUrl: sheetRowUrl,

        googleSheetStatus: "success",
        googleSheetMessage: result.message || "Data berhasil disimpan"
      });

      mongoSaved = true;
      mongoId = suratBaru._id;
    } catch (error) {
      console.error("Google Sheet sukses, tetapi gagal simpan ke MongoDB:", error);

      mongoSaved = false;
      mongoError = error.message;
    }

    return res.json({
      ...result,
      sheetRow: sheetRow,
      sheetGid: sheetGid,
      spreadsheetId: spreadsheetId,
      spreadsheetUrl: spreadsheetUrl,
      sheetRowUrl: sheetRowUrl,
      mongoSaved: mongoSaved,
      mongoError: mongoError,
      mongoId: mongoId
    });
  } catch (error) {
    console.error("Gagal menyimpan surat:", error);

    return res.status(500).json({
      status: "error",
      message: "Gagal menyimpan data surat dari server."
    });
  }
});

function normalizeJenisSurat(value) {
  const jenis = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (jenis === "SURAT_KEPUTUSAN") {
    return "SURAT_KEPUTUSAN";
  }

  if (jenis === "SURAT_BIASA") {
    return "SURAT_BIASA";
  }

  return "";
}

function buildSheetRowUrl(spreadsheetUrl, sheetGid, sheetRow) {
  if (!spreadsheetUrl || !sheetGid || !sheetRow) {
    return "";
  }

  const cleanUrl = String(spreadsheetUrl).split("#")[0];

  return cleanUrl + "#gid=" + sheetGid + "&range=A" + sheetRow;
}

module.exports = router;