require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/database");
const User = require("../models/User");

const hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

const seedAdmin = async function () {
  const adminName = process.env.ADMIN_NAME;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminName || !adminUsername || !adminPassword) {
    throw new Error("ADMIN_NAME, ADMIN_USERNAME, dan ADMIN_PASSWORD wajib diisi di .env");
  }

  const adminAda = await User.findOne({ role: "admin" });

  if (adminAda) {
    adminAda.nama = adminName;
    adminAda.username = adminUsername;
    adminAda.password = await hashPassword(adminPassword);
    adminAda.role = "admin";

    await adminAda.save();

    console.log("Admin besar berhasil diperbarui.");
    console.log("Username admin:", adminUsername);
    return;
  }

  await User.create({
    nama: adminName,
    username: adminUsername,
    password: await hashPassword(adminPassword),
    role: "admin"
  });

  console.log("Admin besar berhasil dibuat.");
  console.log("Username admin:", adminUsername);
};

const seedUser = async function (userData, label) {
  const userName = userData.name;
  const userUsername = userData.username;
  const userPassword = userData.password;
  const userBagian = userData.bagian || "";

  if (!userName || !userUsername || !userPassword) {
    console.log("Data " + label + " tidak lengkap. Seed dilewati.");
    return;
  }

  const userAda = await User.findOne({ username: userUsername });

  if (userAda) {
    userAda.nama = userName;
    userAda.username = userUsername;
    userAda.password = await hashPassword(userPassword);
    userAda.role = "user";
    userAda.bagian = userBagian;

    await userAda.save();

    console.log(label + " berhasil diperbarui.");
    console.log("Username:", userUsername);
    return;
  }

  await User.create({
    nama: userName,
    username: userUsername,
    password: await hashPassword(userPassword),
    role: "user",
    bagian: userBagian
  });

  console.log(label + " berhasil dibuat.");
  console.log("Username:", userUsername);
};

const seedData = async function () {
  try {
    await connectDB();

    await seedAdmin();

    await seedUser(
      {
        name: process.env.SEED_USER_NAME,
        username: process.env.SEED_USER_USERNAME,
        password: process.env.SEED_USER_PASSWORD,
        bagian: process.env.SEED_USER_BAGIAN
      },
      "User biasa 1"
    );

    await seedUser(
      {
        name: process.env.SEED_USER_NAME2,
        username: process.env.SEED_USER_USERNAME2,
        password: process.env.SEED_USER_PASSWORD2,
        bagian: process.env.SEED_USER_BAGIAN2
      },
      "User biasa 2"
    );

    console.log("Seed data selesai.");
    process.exit();
  } catch (error) {
    console.error("Gagal membuat atau memperbarui data:", error.message);
    process.exit(1);
  }
};

seedData();