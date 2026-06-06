const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController.js");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

// Xem review của tour (Ai cũng xem được)
router.get("/service/:serviceId", reviewController.getReviewsByService);

// Review nổi bật cho homepage
router.get("/highlights", reviewController.getHighlightedReviews);

// Gửi review (Phải đăng nhập)
router.post("/", verifyToken, reviewController.createReview);

// Xóa review (User hoặc Admin)
router.delete("/:id", verifyToken, reviewController.deleteReview);

module.exports = router;
