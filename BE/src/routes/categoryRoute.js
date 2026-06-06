const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController.js");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

// Public: Bất kỳ ai cũng có thể xem danh mục
router.get("/", categoryController.getAllCategories);

// Private: Chỉ Admin mới có quyền Thay đổi dữ liệu
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  categoryController.createCategory,
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  categoryController.updateCategory,
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  categoryController.deleteCategory,
);

module.exports = router;
