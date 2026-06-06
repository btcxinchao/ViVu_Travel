const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.js");
const {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

// Routes cho User và Provider (Cần đăng nhập)
router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);
router.patch("/change-password", verifyToken, userController.changePassword);
router.get("/favorites", verifyToken, userController.getFavoriteServices);
router.patch("/favorites/:serviceId/toggle", verifyToken, userController.toggleFavoriteService);
router.post("/behavior", optionalVerifyToken, userController.recordBehavior);

// Routes cho Admin
router.get(
  "/all",
  verifyToken,
  authorizeRoles("admin"),
  userController.getAllUsers,
);
router.patch(
  "/status/:id",
  verifyToken,
  authorizeRoles("admin"),
  userController.updateUserStatus,
);

module.exports = router;
