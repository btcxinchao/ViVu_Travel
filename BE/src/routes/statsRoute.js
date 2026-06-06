const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController.js");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

// Thống kê cho Nhà cung cấp
router.get(
  "/partner",
  verifyToken,
  authorizeRoles("provider"),
  statsController.getPartnerStats,
);

// Thống kê cho Admin
router.get(
  "/admin",
  verifyToken,
  authorizeRoles("admin"),
  statsController.getAdminStats,
);

module.exports = router;
