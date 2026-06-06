const {
  validationError,
  validationSuccess,
  normalizeText,
  parseArrayField,
} = require("./commonValidation.js");

const normalizeServiceBody = (body = {}) => ({
  serviceName: normalizeText(body.serviceName || body.name),
  description: normalizeText(body.description),
  prices: Number(body.prices ?? body.price ?? 0),
  location: normalizeText(body.location),
  category: normalizeText(body.category),
  duration: normalizeText(body.duration),
  highlight: parseArrayField(body.highlight || body.highlights),
  includes: parseArrayField(body.includes),
  images: parseArrayField(body.images),
  featured: body.featured === true || body.featured === "true",
  seasonTags: parseArrayField(body.seasonTags || body.seasonTagsJson),
  bestMonths: parseArrayField(body.bestMonths)
    .map((item) => Number(item))
    .filter(Number.isFinite),
  weatherTags: parseArrayField(body.weatherTags),
  budgetRange: ["low", "mid", "high"].includes(
    normalizeText(body.budgetRange || "mid").toLowerCase(),
  )
    ? normalizeText(body.budgetRange || "mid").toLowerCase()
    : "mid",
  imageUrl: normalizeText(body.imageUrl),
  imageId: normalizeText(body.imageId),
});

const validateServicePayload = (body = {}) => {
  const payload = normalizeServiceBody(body);

  if (
    !payload.serviceName ||
    !payload.description ||
    !payload.prices ||
    !payload.category
  ) {
    return validationError(400, "Thiếu dữ liệu bắt buộc khi tạo service");
  }

  return validationSuccess(payload);
};

const validateItineraryFile = (file, itinerary) => {
  if (file && (!itinerary || itinerary.length === 0)) {
    return validationError(400, "File Excel không có dữ liệu lịch trình hợp lệ");
  }

  return validationSuccess();
};

const validateApproveRejectService = (body = {}) => {
  const status = normalizeText(body.status);

  if (!["active", "rejected"].includes(status)) {
    return validationError(400, "Trạng thái phê duyệt không hợp lệ");
  }

  return validationSuccess({ status });
};

const validateGetServicesQuery = (query = {}) =>
  validationSuccess({
    search: normalizeText(query.search),
    category: normalizeText(query.category),
    location: normalizeText(query.location),
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    page: Number(query.page || 1),
    limit: Number(query.limit || 10),
  });

module.exports = {
  normalizeServiceBody,
  validateServicePayload,
  validateItineraryFile,
  validateApproveRejectService,
  validateGetServicesQuery,
};
