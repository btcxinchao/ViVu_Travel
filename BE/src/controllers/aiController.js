const aiRecommendationService = require("../services/aiRecommendationService.js");

module.exports.getRecommendations = async (req, res) => {
  try {
    const result = await aiRecommendationService.getRecommendations(
      req.query,
      req.user?.id || null,
      req.guestId || "",
    );

    return res.status(200).json({
      message: "Lay danh sach goi y thanh cong",
      ...result,
    });
  } catch (error) {
    console.error("Loi getRecommendations:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
