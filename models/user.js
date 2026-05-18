const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["user", "admin", "sub_admin"],
      default: "user"
    },

    bagian: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    subAdminGroup: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    bagianDibawahi: {
      type: [String],
      default: []
    },

    isSubAdminActive: {
      type: Boolean,
      default: false
    },

    ditunjukOleh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    tanggalDitunjuk: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.index(
  { subAdminGroup: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "sub_admin",
      isSubAdminActive: true
    }
  }
);

module.exports = mongoose.model("User", userSchema);