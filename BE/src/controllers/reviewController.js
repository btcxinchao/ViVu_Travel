const Review = require("../models/Review.js");
const Order = require("../models/Order.js");
const Service = require("../models/Service.js");
const behaviorService = require("../services/behaviorService.js");
const { validateCreateReview } = require("../validations/reviewValidation.js");

// Gui danh gia moi (user)
module.exports.createReview = async (req, res) => {
  try {
    const validation = validateCreateReview(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }
    const { orderId, rating, comment } = validation.data;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Khong tim thay don hang" });
    }

    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Ban khong co quyen danh gia don hang nay" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({
        message: "Ban chi co the danh gia sau khi da hoan thanh chuyen di",
      });
    }

    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "Ban da danh gia cho chuyen di nay roi" });
    }

    const newReview = await Review.create({
      orderId,
      serviceId: order.serviceId,
      userId: req.user.id,
      rating,
      comment,
    });

    const allReviews = await Review.find({ serviceId: order.serviceId });
    const reviewCount = allReviews.length;
    const avgRating =
      allReviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount;

    await Service.findByIdAndUpdate(order.serviceId, {
      rating: avgRating.toFixed(1),
      reviewCount,
    });

    const serviceForBehavior = await Service.findById(order.serviceId).populate(
      "category",
      "categoryName slug",
    );

    await behaviorService
      .recordBehavior({
        userId: req.user.id,
        actionType: "rating",
        service: serviceForBehavior,
        payload: {
          rating,
          source: "create_review",
          metadata: {
            orderId: String(orderId),
            comment,
          },
        },
      })
      .catch((behaviorError) => {
        console.error("Loi record rating behavior:", behaviorError);
      });

    return res.status(201).json({
      message: "Cam on ban da danh gia chuyen di!",
      data: newReview,
    });
  } catch (error) {
    console.error("Loi createReview:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// Lay danh sach review cua mot tour (public)
module.exports.getReviewsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const reviews = await Review.find({ serviceId })
      .populate("userId", "fullName avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: reviews });
  } catch (error) {
    return res.status(500).json({ message: "Loi he thong" });
  }
};

module.exports.getHighlightedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ rating: { $gte: 4 } })
      .populate("userId", "fullName avatar")
      .populate("serviceId", "serviceName")
      .sort({ rating: -1, createdAt: -1 })
      .limit(6);

    return res.status(200).json({ data: reviews });
  } catch (error) {
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// Xoa danh gia (user/admin)
module.exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Khong tim thay danh gia" });
    }

    if (review.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Khong co quyen xoa danh gia nay" });
    }

    await Review.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Da xoa danh gia" });
  } catch (error) {
    return res.status(500).json({ message: "Loi he thong" });
  }
};
