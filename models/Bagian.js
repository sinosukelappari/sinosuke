const mongoose = require("mongoose");

const bagianSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },

    aktif: {
      type: Boolean,
      default: true
    },

    limitUser: {
      type: Number,
      default: null,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Bagian", bagianSchema);
