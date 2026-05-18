require("dotenv").config();

const connectDB = require("../config/database");
const Bagian = require("../models/Bagian");

const daftarBagian = [
  { nama: "KEUANGAN", urutan: 1 },
  { nama: "KEPEGAWAIAN", urutan: 2 },
  { nama: "UMUM", urutan: 3 },
  { nama: "REGISTRASI", urutan: 4 },
  { nama: "PERAWATAN", urutan: 5 },
  { nama: "KAMTIB", urutan: 6 },
  { nama: "KPLP", urutan: 7 }
];

async function seedBagian() {
  try {
    await connectDB();

    for (const item of daftarBagian) {
      await Bagian.updateOne(
        { nama: item.nama },
        {
          $set: {
            nama: item.nama,
            urutan: item.urutan,
            aktif: true
          }
        },
        { upsert: true }
      );
    }

    console.log("Seed data bagian berhasil.");
    process.exit(0);
  } catch (error) {
    console.error("Seed data bagian gagal:", error);
    process.exit(1);
  }
}

seedBagian();