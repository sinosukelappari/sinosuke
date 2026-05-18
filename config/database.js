const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB berhasil terhubung");
  } catch (error) {
    console.error("MongoDB gagal terhubung:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;