const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController.js");
const { excelUpload } = require("../middlewares/excelUploadMiddleware.js");
const {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

// Routes công khai
router.get("/", serviceController.getAllServices);

// Routes dành cho Provider (Nhà cung cấp)
router.post(
  "/",
  verifyToken,
  authorizeRoles("provider"),
  excelUpload.single("itineraryFile"),
  serviceController.createService,
);
router.get(
  "/my-services",
  verifyToken,
  authorizeRoles("provider"),
  serviceController.getMyServices,
);
router.get("/detail/:id", serviceController.getServiceById);
router.patch(
  "/:id/view",
  optionalVerifyToken,
  serviceController.incrementServiceView,
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("provider"),
  excelUpload.single("itineraryFile"),
  serviceController.updateService,
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("provider"),
  serviceController.deleteService,
);
//  ADMIN
// 1. Lấy danh sách tour đang đợi được duyệt
router.get(
  "/admin/pending",
  verifyToken,
  authorizeRoles("admin"),
  serviceController.getPendingServices,
);

// 2. Cập nhật trạng thái duyệt (Duyệt hoặc Từ chối)
router.patch(
  "/admin/approve/:id",
  verifyToken,
  authorizeRoles("admin"),
  serviceController.approveRejectService,
);
module.exports = router;
