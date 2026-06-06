const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB kết nối thành công ");
  } catch (error) {
    console.error("MongoDB kết nối thất bại :", error.message);
    process.exit(1);
  }
};
exports.connectDB = connectDB;
