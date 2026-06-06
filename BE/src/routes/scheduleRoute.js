const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController.js");
const {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

// Public: Xem lịch của một tour
router.get(
  "/service/:serviceId",
  optionalVerifyToken,
  scheduleController.getSchedulesByService,
);

// Private: Chỉ dành cho Nhà cung cấp (Provider)
router.post(
  "/",
  verifyToken,
  authorizeRoles("provider"),
  scheduleController.createSchedule,
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("provider"),
  scheduleController.updateSchedule,
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("provider"),
  scheduleController.deleteSchedule,
);

module.exports = router;
