const mongoose = require("mongoose");

const suratSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    namaUser: {
      type: String,
      default: "",
      trim: true
    },

    username: {
      type: String,
      default: "",
      trim: true
    },

    noUrut: {
      type: Number,
      required: true
    },

    nomorSurat: {
      type: Number,
      required: true
    },

    nomorSuratLengkap: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    jenisSurat: {
      type: String,
      enum: ["SURAT_KEPUTUSAN", "SURAT_BIASA"],
      default: "SURAT_KEPUTUSAN",
      trim: true
    },

    hariTanggal: {
      type: String,
      default: "",
      trim: true
    },

    kodeSatker: {
      type: String,
      default: "",
      trim: true
    },

    kodeKlasifikasi: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    kodeTambahan: {
      type: String,
      required: true,
      trim: true
    },

    dariBagian: {
      type: String,
      required: true,
      trim: true
    },

    tujuanSurat: {
      type: String,
      required: true,
      trim: true
    },

    halSurat: {
      type: String,
      required: true,
      trim: true
    },

    sheetName: {
      type: String,
      default: "",
      trim: true
    },

    sheetRow: {
      type: Number,
      default: null
    },

    sheetGid: {
      type: String,
      default: "",
      trim: true
    },

    spreadsheetId: {
      type: String,
      default: "",
      trim: true
    },

    spreadsheetUrl: {
      type: String,
      default: "",
      trim: true
    },

    sheetRowUrl: {
      type: String,
      default: "",
      trim: true
    },

    googleSheetStatus: {
      type: String,
      enum: ["success", "failed"],
      default: "success"
    },

    googleSheetMessage: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

suratSchema.index({ username: 1 });
suratSchema.index({ kodeKlasifikasi: 1 });
suratSchema.index({ jenisSurat: 1 });
suratSchema.index({ sheetName: 1 });
suratSchema.index({ sheetRow: 1 });
suratSchema.index({ sheetRowUrl: 1 });

module.exports = mongoose.model("Surat", suratSchema);
