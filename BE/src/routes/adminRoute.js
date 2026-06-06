const express = require("express");
const router = express.Router();
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");
const adminController = require("../controllers/adminController.js");
const Authorization = [verifyToken, authorizeRoles("admin")];
router.get(
  "/providers/pending",
  ...Authorization,
  adminController.getPendingProviders,
);
router.get("/providers", ...Authorization, adminController.getAllProviders);
router.patch(
  "/approve-provider/:id",
  ...Authorization,
  adminController.approveProvider,
);
router.patch(
  "/reject-provider/:id",
  ...Authorization,
  adminController.rejectProvider,
);
//lấy tất cả tài khoản
router.get("/allAccounts", ...Authorization, adminController.getAllAccounts);
//change role
router.patch(
  "/change-role/:id",
  ...Authorization,
  adminController.changeUserRole,
);
//xóa tài khoản
router.delete(
  "/delete-account/:id",
  ...Authorization,
  adminController.deleteAccount,
);
//khóa tài khoản
router.patch(
  "/lock-account/:id",
  ...Authorization,
  adminController.lockAccount,
);
//mở khóa tài khoản
router.patch(
  "/unlock-account/:id",
  ...Authorization,
  adminController.unlockAccount,
);
//admin tạo tài khoản mới
router.post("/add-account", ...Authorization, adminController.addAccount);

// QUAN LY DU LIEU DICH VU
//xem dich vu
router.get("/getAllService", ...Authorization, adminController.getAllService);
//xoa dich vu
router.delete("/deleteService/:id", ...Authorization, adminController.deleteService);
//thay doi trang thai dich vu
router.patch(
  "/changeServiceStatus/:id",
  ...Authorization,
  adminController.changeServiceStatus,
);
module.exports = router;
