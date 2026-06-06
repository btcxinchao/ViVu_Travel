const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController.js");
const { optionalVerifyToken } = require("../middlewares/authMiddleware.js");

router.get(
  "/recommendations",
  optionalVerifyToken,
  aiController.getRecommendations,
);

module.exports = router;
