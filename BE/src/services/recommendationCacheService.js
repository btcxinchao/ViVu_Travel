const RecommendationCache = require("../models/RecommendationCache.js");

const RECOMMENDATION_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// Chuẩn hóa giá trị để tạo cache key ổn định.
const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

// Tạo key định danh cho từng user hoặc guest.
const buildOwnerKey = ({ userId = null, guestId = "" } = {}) => {
  if (userId) {
    return `user:${String(userId)}`;
  }

  const normalizedGuestId = String(guestId || "").trim();
  return `guest:${normalizedGuestId || "anonymous"}`;
};

// Tạo key cho bộ lọc recommendation hiện tại.
const buildFilterKey = (filter = {}) => {
  const snapshot = {
    month: Number(filter.month || 0),
    season: normalizeValue(filter.season),
    weatherTag: normalizeValue(filter.weatherTag),
    budgetRange: normalizeValue(filter.budgetRange),
    category: normalizeValue(filter.category),
    location: normalizeValue(filter.location),
  };

  return JSON.stringify(snapshot);
};

// Ghép key người dùng và key bộ lọc thành khóa cache duy nhất.
const buildCacheKey = (ownerKey, filterKey) => `${ownerKey}|${filterKey}`;

// Đọc cache recommendation nếu còn hiệu lực.
const getRecommendationCache = async ({ ownerKey, filterKey }) => {
  const cacheKey = buildCacheKey(ownerKey, filterKey);
  const now = new Date();

  const cached = await RecommendationCache.findOne({
    cacheKey,
    refreshNeeded: false,
    expiresAt: { $gt: now },
  }).lean();

  if (!cached) {
    return null;
  }

  await RecommendationCache.updateOne(
    { cacheKey },
    { $set: { lastAccessedAt: now } },
  );

  return cached;
};

// Lưu kết quả recommendation vào cache.
const saveRecommendationCache = async ({
  ownerKey,
  ownerType,
  ownerId,
  filterKey,
  filterSnapshot,
  data,
  meta,
}) => {
  const now = new Date();
  const cacheKey = buildCacheKey(ownerKey, filterKey);
  const expiresAt = new Date(now.getTime() + RECOMMENDATION_CACHE_TTL_MS);

  return RecommendationCache.findOneAndUpdate(
    { cacheKey },
    {
      $set: {
        cacheKey,
        ownerKey,
        ownerType,
        ownerId,
        filterKey,
        filterSnapshot,
        data,
        meta,
        refreshNeeded: false,
        lastGeneratedAt: now,
        lastAccessedAt: now,
        expiresAt,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );
};

// Đánh dấu cache của một user/guest cần làm mới.
const invalidateRecommendationCache = async (ownerKey) => {
  if (!ownerKey) {
    return;
  }

  await RecommendationCache.updateMany(
    { ownerKey },
    { $set: { refreshNeeded: true } },
  );
};

// Đánh dấu toàn bộ cache cần refresh sau khi cron chạy.
const markAllRecommendationCachesForRefresh = async () => {
  await RecommendationCache.updateMany({}, { $set: { refreshNeeded: true } });
};

// Xóa các cache đã hết hạn khỏi database.
const cleanupExpiredRecommendationCaches = async () => {
  await RecommendationCache.deleteMany({
    expiresAt: { $lte: new Date() },
  });
};

module.exports = {
  buildOwnerKey,
  buildFilterKey,
  getRecommendationCache,
  saveRecommendationCache,
  invalidateRecommendationCache,
  markAllRecommendationCachesForRefresh,
  cleanupExpiredRecommendationCaches,
};
