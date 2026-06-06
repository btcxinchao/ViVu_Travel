const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController.js");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

router.get("/info/:id", providerController.getInfo);
router.get(
  "/me",
  verifyToken,
  authorizeRoles("provider", "admin"),
  providerController.getMyProviderProfile,
);

module.exports = router;
