const mongoose = require("mongoose");

const usernameWhitelistSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Untuk whitelist yang ditambahkan oleh sub admin
    bagianTarget: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("UsernameWhitelist", usernameWhitelistSchema);