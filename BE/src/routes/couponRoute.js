const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController.js");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware.js");

// Lay danh sach ma giam gia cua provider dang dang nhap.
router.get(
  "/my-coupons",
  verifyToken,
  authorizeRoles("provider"),
  couponController.getMyCoupons,
);

// Provider tao ma giam gia moi.
router.post(
  "/",
  verifyToken,
  authorizeRoles("provider"),
  couponController.createCoupon,
);

// Provider cap nhat ma giam gia.
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("provider"),
  couponController.updateCoupon,
);

// Provider xoa ma giam gia.
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("provider"),
  couponController.deleteCoupon,
);

// Kiem tra ma giam gia truoc khi dat tour.
router.post("/validate", couponController.validateCoupon);

module.exports = router;
