const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, unique: true }, // VD: "Biển đảo"
    slug: { type: String, required: true, unique: true }, // VD: "bien-dao"
    icon: { type: String }, // Link ảnh hoặc tên icon Lucide (ví dụ: "Umbrella")
    description: { type: String },
    image: { type: String }, // Ảnh đại diện cho danh mục nếu có
    order: { type: Number, default: 0 }, // Thứ tự hiển thị trên Menu
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
