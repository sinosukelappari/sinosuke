const mongoose = require("mongoose");

const appConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main",
      unique: true
    },

    dariBagianMode: {
      type: String,
      enum: ["auto", "manual"],
      default: "manual"
    },

    spreadsheetUrl: {
      type: String,
      default: "",
      trim: true
    },

    googleScriptUrl: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AppConfig", appConfigSchema);