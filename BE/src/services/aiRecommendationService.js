const Service = require("../models/Service.js");
const Order = require("../models/Order.js");
const Category = require("../models/Category.js");
const {
  buildPreferenceSummary,
  getGuestPreferenceSummary,
  getOwnerKey,
  getPreferenceDoc,
} = require("./behaviorService.js");
const {
  buildFilterKey,
  getRecommendationCache,
  saveRecommendationCache,
} = require("./recommendationCacheService.js");
const mongoose = require("mongoose");
const {
  getSeasonFromMonth,
  isHolidayLike,
  normalizeTagList,
  normalizeText,
} = require("../utils/seasonHelper.js");

const FINAL_LIMIT = 5;
const SEASON_KEYWORDS = {
  summer: [
    "beach",
    "sea",
    "island",
    "dao",
    "đảo",
    "bien",
    "biển",
    "resort",
    "relax",
    "relaxation",
    "snorkeling",
    "phu quoc",
    "nha trang",
    "da nang",
    "vung tau",
    "halong",
    "ha long",
  ],
  winter: [
    "dalat",
    "da lat",
    "sapa",
    "mountain",
    "hill",
    "highland",
    "cold",
    "resort",
    "luxury",
    "retreat",
    "nui",
    "núi",
  ],
  autumn: ["peaceful", "mist", "nature", "eco", "trek", "forest"],
  rainy: ["indoor", "spa", "resort", "wellness", "hot spring", "museum"],
};

// Suy ra nhãn thời tiết mặc định theo mùa hiện tại.
const getCurrentWeatherTagFromSeason = (season) => {
  if (season === "summer") return "hot";
  if (season === "winter") return "cool";
  if (season === "autumn") return "all";
  return "all";
};

// Chuẩn hóa text thành key ngắn gọn để so khớp preference.
const normalizePreferenceKey = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";

// Lấy ra các preference có điểm cao nhất từ map/object.
const getTopPreferenceKeys = (mapValue, limit = 3) => {
  if (!mapValue) return [];

  const entries =
    mapValue instanceof Map
      ? Array.from(mapValue.entries())
      : Object.entries(mapValue);

  return entries
    .map(([key, score]) => ({
      key,
      score: Number(score || 0),
    }))
    .filter((item) => item.key && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// Kiểm tra tour có hợp mùa hay không dựa trên seasonTags.
const matchesSeasonTag = (serviceTags, season) => {
  if (!Array.isArray(serviceTags) || !season || season === "all") {
    return false;
  }

  if (season === "autumn") {
    return serviceTags.includes("autumn") || serviceTags.includes("rainy");
  }

  if (season === "rainy") {
    return serviceTags.includes("rainy") || serviceTags.includes("autumn");
  }

  return serviceTags.includes(season);
};

// Tính điểm nền từ featured, rating, review, view và booking.
const buildBaseScore = (serviceObject, bookingCount) => {
  const featuredScore = serviceObject.featured ? 65 : 0;
  const ratingScore = Number(serviceObject.rating || 0) * 20;
  const reviewScore = Number(serviceObject.reviewCount || 0) * 3;
  const viewScore = Number(serviceObject.viewCount || 0) * 0.5;
  const bookingScore = Number(bookingCount || 0) * 4;

  return featuredScore + ratingScore + reviewScore + viewScore + bookingScore;
};

// Tính điểm khớp theo bộ lọc người dùng chọn.
const buildFilterScore = (serviceObject, context) => {
  const categoryFilter = normalizeText(context.category);
  const locationFilter = normalizeText(context.location);
  const budgetRange = normalizeText(context.budgetRange);
  const season = normalizeText(context.season);
  const weatherTag = normalizeText(context.weatherTag);
  const categoryName = normalizeText(serviceObject?.category?.categoryName);
  const categorySlug = normalizeText(serviceObject?.category?.slug);
  const serviceLocation = normalizeText(serviceObject.location);
  const serviceBudget = normalizeText(serviceObject.budgetRange);
  const seasonTags = normalizeTagList(serviceObject.seasonTags);
  const weatherTags = normalizeTagList(serviceObject.weatherTags);

  let score = 0;

  if (categoryFilter) {
    if (
      categoryName.includes(categoryFilter) ||
      categorySlug.includes(categoryFilter)
    ) {
      score += 18;
    }
  }

  if (locationFilter && serviceLocation.includes(locationFilter)) {
    score += 10;
  }

  if (budgetRange && serviceBudget === budgetRange) {
    score += 8;
  }

  if (season && matchesSeasonTag(seasonTags, season)) {
    score += 12;
  }

  if (weatherTag && weatherTag !== "all" && weatherTags.includes(weatherTag)) {
    score += 10;
  }

  return score;
};

// Tính điểm xu hướng theo lượt book/view/review và độ mới của tour.
const buildTrendScore = (serviceObject, bookingCount) => {
  const bookingBoost = Math.min(18, Math.log1p(Number(bookingCount || 0)) * 6);
  const viewBoost = Math.min(
    12,
    Math.log1p(Number(serviceObject.viewCount || 0)) * 2.5,
  );
  const reviewBoost = Math.min(
    10,
    Math.log1p(Number(serviceObject.reviewCount || 0)) * 3,
  );
  const ratingBoost = Number(serviceObject.rating || 0) >= 4 ? 6 : 0;
  const featuredBoost = serviceObject.featured ? 4 : 0;
  const recencyBoost = (() => {
    const createdAt = new Date(serviceObject.createdAt || 0).getTime();
    const ageInDays = Math.max(
      1,
      (Date.now() - createdAt) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, 8 - Math.min(8, ageInDays / 14));
  })();

  return (
    bookingBoost +
    viewBoost +
    reviewBoost +
    ratingBoost +
    featuredBoost +
    recencyBoost
  );
};

// Tính điểm theo mùa và thời tiết hiện tại.
const buildSeasonalScore = (serviceObject, context) => {
  const season = normalizeText(context.season);
  const weatherTag = normalizeText(context.weatherTag);
  const month = Number(context.month || 0);
  const seasonTags = normalizeTagList(serviceObject.seasonTags);
  const weatherTags = normalizeTagList(serviceObject.weatherTags);
  const bestMonths = Array.isArray(serviceObject.bestMonths)
    ? serviceObject.bestMonths
    : [];
  const serviceText = normalizeText(
    [
      serviceObject.serviceName,
      serviceObject.location,
      serviceObject?.category?.categoryName,
      serviceObject?.category?.slug,
      serviceObject.description,
      serviceObject.seasonTags?.join(" "),
      serviceObject.weatherTags?.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );

  let score = 0;

  if (season && matchesSeasonTag(seasonTags, season)) {
    score += 20;
  }

  if (weatherTag && weatherTag !== "all" && weatherTags.includes(weatherTag)) {
    score += 12;
  }

  if (month && bestMonths.includes(month)) {
    score += 10;
  }

  if (season === "summer") {
    if (SEASON_KEYWORDS.summer.some((keyword) => serviceText.includes(keyword))) {
      score += 12;
    }
  }

  if (season === "winter") {
    if (SEASON_KEYWORDS.winter.some((keyword) => serviceText.includes(keyword))) {
      score += 12;
    }
  }

  if (season === "autumn") {
    if (SEASON_KEYWORDS.autumn.some((keyword) => serviceText.includes(keyword))) {
      score += 8;
    }
  }

  if (season === "rainy") {
    if (SEASON_KEYWORDS.rainy.some((keyword) => serviceText.includes(keyword))) {
      score += 8;
    }
  }

  return score;
};

// Tính điểm cá nhân hóa dựa trên lịch sử hành vi của user/guest.
const buildPersonalPreferenceScore = (serviceObject, context) => {
  const preference = context.preference || {};
  const strength = getPreferenceStrength(preference);
  if (strength <= 0) {
    return 0;
  }

  const preferenceCategoryKeys = (preference.topCategories || []).map((item) =>
    normalizePreferenceKey(item.key),
  );
  const preferenceLocationKeys = (preference.topLocations || []).map((item) =>
    normalizePreferenceKey(item.key),
  );
  const preferenceBudgetKeys = (preference.topBudgets || []).map((item) =>
    normalizePreferenceKey(item.key),
  );
  const preferenceSeasonKeys = (preference.topSeasons || []).map((item) =>
    normalizePreferenceKey(item.key),
  );

  const serviceCategoryKey = normalizePreferenceKey(
    serviceObject?.category?.categoryName || serviceObject?.category?.slug,
  );
  const serviceLocationKey = normalizePreferenceKey(serviceObject.location);
  const serviceBudgetKey = normalizePreferenceKey(serviceObject.budgetRange);
  const serviceSeasonTags = normalizeTagList(serviceObject.seasonTags);

  let score = 0;

  const categoryRank = preferenceCategoryKeys.indexOf(serviceCategoryKey);
  if (categoryRank >= 0) {
    score += (42 - categoryRank * 10) * strength;
  }

  const locationRank = preferenceLocationKeys.indexOf(serviceLocationKey);
  if (locationRank >= 0) {
    score += (32 - locationRank * 8) * strength;
  }

  const budgetRank = preferenceBudgetKeys.indexOf(serviceBudgetKey);
  if (budgetRank >= 0) {
    score += (24 - budgetRank * 6) * strength;
  }

  if (preferenceSeasonKeys.some((key) => serviceSeasonTags.includes(key))) {
    score += 18 * strength;
  }

  const recentSignals = Array.isArray(preference.recentSignals)
    ? preference.recentSignals
    : [];
  const recentMatchCount = recentSignals.filter((signal) => {
    const signalCategory = normalizePreferenceKey(signal?.category);
    const signalLocation = normalizePreferenceKey(signal?.location);
    const signalBudget = normalizePreferenceKey(signal?.budgetRange);
    const signalSeason = normalizePreferenceKey(signal?.season);
    return (
      signalCategory === serviceCategoryKey ||
      signalLocation === serviceLocationKey ||
      signalBudget === serviceBudgetKey ||
      (signalSeason && serviceSeasonTags.includes(signalSeason))
    );
  }).length;

  if (recentMatchCount > 0) {
    score += Math.min(20, recentMatchCount * 4) * strength;
  }

  const actionCounts = preference.actionCounts || {};
  const interactionBoost = Math.min(
    18,
    Number(actionCounts.view || 0) * 0.15 +
      Number(actionCounts.search || 0) * 0.35 +
      Number(actionCounts.favorite || 0) * 0.25 +
      Number(actionCounts.book || 0) * 0.3 +
      Number(actionCounts.rating || 0) * 0.2,
  );

  score += interactionBoost * strength;

  return score;
};

// Gom số lượt booking theo từng service để dùng khi xếp hạng.
const buildBookingCountMap = async () => {
  const counts = await Order.aggregate([
    {
      $group: {
        _id: "$serviceId",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    counts.map((item) => [String(item._id), Number(item.count || 0)]),
  );
};

// Chuyển category nhập vào thành ObjectId nếu cần.
const resolveCategoryFilter = async (categoryInput) => {
  const normalized = normalizeText(categoryInput);
  if (!normalized) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(categoryInput)) {
    return categoryInput;
  }

  const categoryDoc = await Category.findOne({
    $or: [
      { slug: normalized },
      { categoryName: categoryInput },
      { categoryName: { $regex: `^${categoryInput}$`, $options: "i" } },
      { slug: { $regex: `^${normalized}$`, $options: "i" } },
    ],
  }).select("_id");

  return categoryDoc?._id || null;
};

// Đo mức độ đủ dữ liệu của hồ sơ hành vi.
const getPreferenceStrength = (preference) => {
  const total = Number(preference?.actionCounts?.total || 0);
  if (total < 3) {
    return 0;
  }

  return Math.min(1.5, 0.75 + total / 20);
};

// Bỏ các metadata tạm trước khi trả service ra response.
const stripCacheMeta = (service) => {
  if (!service || typeof service !== "object") return service;
  const { cacheMeta, ...rest } = service;
  return rest;
};

// Tạo danh sách gợi ý theo rule-base cho user hoặc guest.
module.exports.getRecommendations = async (query = {}, userId = null, guestId = "") => {
  const month = Number(query.month) || new Date().getMonth() + 1;
  const season = query.season || getSeasonFromMonth(month);
  const weatherTag = query.weatherTag || getCurrentWeatherTagFromSeason(season);
  const budgetRange = normalizeText(query.budgetRange);
  const category = query.category;
  const location = query.location;
  const isHoliday = isHolidayLike(query.holiday);
  const resolvedCategoryId = await resolveCategoryFilter(category);
  const ownerKey = getOwnerKey({ userId, guestId });
  const ownerType = userId ? "user" : "guest";
  const filterSnapshot = {
    month,
    season,
    weatherTag,
    budgetRange,
    category: category || "",
    location: location || "",
  };
  const filterKey = buildFilterKey(filterSnapshot);

  const cached = await getRecommendationCache({ ownerKey, filterKey });
  if (cached && !cached.refreshNeeded) {
    return {
      data: Array.isArray(cached.data) ? cached.data : [],
      meta: {
        ...(cached.meta || {}),
        cacheHit: true,
        cacheKey: cached.cacheKey,
        filterKey,
        ownerType,
        guestId: userId ? "" : guestId,
      },
    };
  }

  const preferenceSummary = userId
    ? buildPreferenceSummary(
        await getPreferenceDoc(userId),
      )
    : await getGuestPreferenceSummary(guestId);

  const serviceQuery = {
    status: "active",
  };

  if (budgetRange && ["low", "mid", "high"].includes(budgetRange)) {
    serviceQuery.budgetRange = budgetRange;
  }

  if (resolvedCategoryId) {
    serviceQuery.category = resolvedCategoryId;
  }

  if (location) {
    serviceQuery.location = { $regex: location, $options: "i" };
  }

  const [services, bookingCountMap] = await Promise.all([
    Service.find(serviceQuery)
      .populate("category", "categoryName slug")
      .populate("provider_id", "fullName")
      .sort({ featured: -1, rating: -1, reviewCount: -1, viewCount: -1, createdAt: -1 }),
    buildBookingCountMap(),
  ]);

  const ranked = services
    .map((service) => {
      const serviceObject = service.toObject();
      const bookingCount = Number(bookingCountMap.get(String(serviceObject._id)) || 0);
      const baseScore = buildBaseScore(serviceObject, bookingCount);
      const filterScore = buildFilterScore(serviceObject, {
        month,
        season,
        weatherTag,
        budgetRange,
        category: category || "",
        location: location || "",
      });
      const trendScore = buildTrendScore(serviceObject, bookingCount);
      const seasonalScore = buildSeasonalScore(serviceObject, {
        month,
        season,
        weatherTag,
      });
      const personalPreferenceScore = buildPersonalPreferenceScore(serviceObject, {
        preference: preferenceSummary,
      });

      return {
        ...serviceObject,
        recommendationScore:
          baseScore +
          filterScore +
          trendScore +
          seasonalScore +
          personalPreferenceScore,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, FINAL_LIMIT)
    .map(stripCacheMeta);

  const meta = {
    month,
    season,
    weatherTag,
    isHoliday,
    budgetRange,
    category: category || "",
    resolvedCategoryId: resolvedCategoryId ? String(resolvedCategoryId) : "",
    location: location || "",
    preference: preferenceSummary,
    limit: FINAL_LIMIT,
    ownerType,
    guestId: userId ? "" : guestId,
    mode: "rules",
    engine: "rule-base recommendation",
    aiUsed: false,
    fallbackUsed: false,
    candidatePoolSize: services.length,
    cacheHit: false,
  };

  await saveRecommendationCache({
    ownerKey,
    ownerType,
    ownerId: userId ? String(userId) : String(guestId || "anonymous"),
    filterKey,
    filterSnapshot,
    data: ranked,
    meta,
  });

  return {
    data: ranked,
    meta,
  };
};
