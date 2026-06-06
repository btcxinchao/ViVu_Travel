const bcrypt = require("bcrypt");
const User = require("../models/User.js");

const DEFAULT_ADMIN_EMAIL = "admin@vivutravel.local";
const DEFAULT_ADMIN_PASSWORD = "Admin@123456";
const DEFAULT_ADMIN_PHONE = "0900000000";

const ensureDefaultAdmin = async () => {
  const email = String(process.env.DEFAULT_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
    .trim()
    .toLowerCase();
  const password = String(
    process.env.DEFAULT_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  );
  const fullName = String(process.env.DEFAULT_ADMIN_NAME || "System Admin").trim();
  const phone = String(process.env.DEFAULT_ADMIN_PHONE || DEFAULT_ADMIN_PHONE).trim();

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    return;
  }

  const existingAccount = await User.findOne({
    $or: [{ email }, { phone }, { fullName }],
  });
  if (existingAccount) {
    console.warn(
      "Khong the tao admin mac dinh vi email, phone hoac fullName da ton tai.",
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    fullName,
    email,
    phone,
    password: hashedPassword,
    role: "admin",
    status: "active",
  });

  console.log(`Da tao admin mac dinh: ${email}`);
};

module.exports = {
  ensureDefaultAdmin,
};
