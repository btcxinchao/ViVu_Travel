const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController.js");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

// User tao don moi
router.post("/", verifyToken, orderController.createOrder);

// User xem don cua minh
router.get("/my-orders", verifyToken, orderController.getMyOrders);

// User huy don cua minh
router.patch("/cancel/:id", verifyToken, orderController.cancelMyOrder);

// Admin xem toan bo don hang
router.get(
  "/admin",
  verifyToken,
  authorizeRoles("admin"),
  orderController.getAdminOrders,
);

// Provider xem don cua minh
router.get(
  "/provider",
  verifyToken,
  authorizeRoles("provider"),
  orderController.getProviderOrders,
);

// Provider/Admin cap nhat trang thai don
router.patch(
  "/status/:id",
  verifyToken,
  authorizeRoles("provider", "admin"),
  orderController.updateOrderStatus,
);

module.exports = router;
