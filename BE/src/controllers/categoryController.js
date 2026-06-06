const Category = require("../models/Category.js");
const {
  normalizeCategoryPayload,
  normalizeCategoryUpdatePayload,
} = require("../validations/categoryValidation.js");

// LẤY TẤT CẢ DANH MỤC (PUBLIC)
// Dùng để hiển thị lên Menu hoặc các icon lọc ở trang chủ
module.exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      order: 1,
    });
    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error("Lỗi getAllCategories:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//  TẠO DANH MỤC MỚI (ADMIN)
module.exports.createCategory = async (req, res) => {
  try {
    const { categoryName, slug, icon, description, image, order } =
      normalizeCategoryPayload(req.body).data;

    // Kiểm tra trùng lặp
    const exist = await Category.findOne({ $or: [{ categoryName }, { slug }] });
    if (exist) {
      return res
        .status(400)
        .json({ message: "Tên danh mục hoặc Slug đã tồn tại" });
    }

    const newCategory = await Category.create({
      categoryName,
      slug,
      icon,
      description,
      image,
      order,
    });

    return res.status(201).json({
      message: "Tạo danh mục thành công",
      data: newCategory,
    });
  } catch (error) {
    console.error("Lỗi createCategory:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//  CẬP NHẬT DANH MỤC (ADMIN)
module.exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = normalizeCategoryUpdatePayload(req.body).data;

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updatedCategory) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    return res.status(200).json({
      message: "Cập nhật danh mục thành công",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Lỗi updateCategory:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ================= XÓA DANH MỤC (ADMIN) =================
module.exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem có tour nào đang thuộc danh mục này không (tùy chọn nhưng nên có)
    // const Service = require("../models/service.js");
    // const hasService = await Service.findOne({ category: id });
    // if (hasService) return res.status(400).json({ message: "Không thể xóa danh mục đang có tour" });

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    return res.status(200).json({ message: "Đã xóa danh mục thành công" });
  } catch (error) {
    console.error("Lỗi deleteCategory:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
