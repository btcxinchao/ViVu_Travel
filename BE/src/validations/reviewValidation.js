const { validationError, validationSuccess } = require("./commonValidation.js");

const validateCreateReview = (body = {}) => {
  const { orderId, rating, comment } = body;
  const normalizedRating = Number(rating);

  if (!orderId || !rating || !comment) {
    return validationError(400, "Thieu thong tin danh gia");
  }

  if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    return validationError(400, "So sao danh gia khong hop le");
  }

  return validationSuccess({
    orderId,
    rating: normalizedRating,
    comment,
  });
};

module.exports = {
  validateCreateReview,
};
