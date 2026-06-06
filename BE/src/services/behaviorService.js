const UserBehaviorLog = require("../models/UserBehaviorLog.js");
const UserPreference = require("../models/UserPreference.js");
const {
  invalidateRecommendationCache,
} = require("./recommendationCacheService.js");
const {
  getSeasonFromMonth,
  normalizeText,
} = require("../utils/seasonHelper.js");

const ACTION_WEIGHTS = {
  view: 1,
  search: 2,
  favorite: 4,
  book: 8,
  rating: 1,
};

const RATING_WEIGHTS = {
  1: -10,
  2: -10,
  3: 0,
  4: 10,
  5: 15,
};

const normalizeKey = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";

const getOwnerKey = ({ userId = null, guestId = "" } = {}) => {
  if (userId) {
    return `user:${String(userId)}`;
  }

  const normalizedGuestId = String(guestId || "").trim();
  return `guest:${normalizedGuestId || "anonymous"}`;
};

const getRatingWeight = (rating) => {
  const normalizedRating = Number(rating || 0);
  return RATING_WEIGHTS[normalizedRating] ?? 0;
};

const getServiceContext = (service) => {
  if (!service) return {};

  const rawCategory = service.category;
  const categoryName = Array.isArray(rawCategory)
    ? rawCategory[0]?.categoryName || rawCategory[0] || ""
    : rawCategory && typeof rawCategory === "object"
      ? rawCategory.categoryName || ""
      : rawCategory || "";
  const categorySlug = Array.isArray(rawCategory)
    ? rawCategory[0]?.slug || rawCategory[0] || ""
    : rawCategory && typeof rawCategory === "object"
      ? rawCategory.slug || ""
      : "";
  const seasonTags = Array.isArray(service.seasonTags) ? service.seasonTags : [];
  const bestMonths = Array.isArray(service.bestMonths) ? service.bestMonths : [];

  return {
    serviceId: service._id || null,
    category: categoryName,
    categorySlug,
    location: service.location || "",
    budgetRange: service.budgetRange || "",
    season: seasonTags[0] || getSeasonFromMonth(bestMonths[0]) || "",
  };
};

const buildSignalPayload = ({ actionType, service, payload = {} }) => {
  const serviceContext = getServiceContext(service);
  const month = Number(payload.month || 0);
  const inferredSeason =
    normalizeText(payload.season) ||
    getSeasonFromMonth(month) ||
    serviceContext.season;
  const rating = Number(payload.rating || 0);
  const ratingWeight = getRatingWeight(rating);

  return {
    actionType,
    serviceId: serviceContext.serviceId || payload.serviceId || null,
    category:
      payload.category ||
      serviceContext.category ||
      serviceContext.categorySlug ||
      "",
    budgetRange: payload.budgetRange || serviceContext.budgetRange || "",
    location: payload.location || serviceContext.location || "",
    keyword: payload.keyword || payload.searchText || "",
    season: inferredSeason || "",
    holiday: Boolean(payload.holiday),
    rating: rating || null,
    ratingWeight,
    source: payload.source || "",
    metadata: payload.metadata || {},
  };
};

const buildPreferenceUpdate = (signal) => {
  const countWeight = ACTION_WEIGHTS[signal.actionType] || 1;
  const preferenceWeight =
    signal.actionType === "rating" ? signal.ratingWeight : countWeight;
  const update = {
    $inc: {
      [`actionCounts.${signal.actionType}`]:
        signal.actionType === "rating" ? 1 : countWeight,
      "actionCounts.total":
        signal.actionType === "rating" ? 1 : countWeight,
    },
    $set: {
      lastSignalAt: new Date(),
    },
    $push: {
      recentSignals: {
        $each: [{ ...signal, createdAt: new Date() }],
        $slice: -20,
      },
    },
  };

  const categoryKey = normalizeKey(signal.category);
  const locationKey = normalizeKey(signal.location);
  const budgetKey = normalizeKey(signal.budgetRange);
  const seasonKey = normalizeKey(signal.season);

  if (signal.category && preferenceWeight !== 0) {
    update.$inc[`categoryScores.${categoryKey}`] = preferenceWeight;
  }
  if (signal.location && preferenceWeight !== 0) {
    update.$inc[`locationScores.${locationKey}`] = preferenceWeight;
  }
  if (signal.budgetRange && preferenceWeight !== 0) {
    update.$inc[`budgetScores.${budgetKey}`] = preferenceWeight;
  }
  if (signal.season && preferenceWeight !== 0) {
    update.$inc[`seasonScores.${seasonKey}`] = preferenceWeight;
  }

  return update;
};

const buildSummaryFromSignals = (signals = []) => {
  const summary = {
    actionCounts: {
      view: 0,
      favorite: 0,
      search: 0,
      book: 0,
      rating: 0,
      total: 0,
    },
    topCategories: new Map(),
    topLocations: new Map(),
    topBudgets: new Map(),
    topSeasons: new Map(),
    recentSignals: [],
  };

  const incMap = (map, key, delta) => {
    if (!key || !delta) return;
    map.set(key, Number(map.get(key) || 0) + delta);
  };

  for (const signal of signals) {
    const actionType = signal.actionType;
    if (!actionType) continue;

    const countWeight = ACTION_WEIGHTS[actionType] || 1;
    const preferenceWeight =
      actionType === "rating" ? Number(signal.ratingWeight || 0) : countWeight;
    const incrementCount = actionType === "rating" ? 1 : countWeight;

    if (summary.actionCounts[actionType] !== undefined) {
      summary.actionCounts[actionType] += incrementCount;
    }
    summary.actionCounts.total += incrementCount;

    if (signal.category && preferenceWeight !== 0) {
      incMap(summary.topCategories, normalizeKey(signal.category), preferenceWeight);
    }
    if (signal.location && preferenceWeight !== 0) {
      incMap(summary.topLocations, normalizeKey(signal.location), preferenceWeight);
    }
    if (signal.budgetRange && preferenceWeight !== 0) {
      incMap(summary.topBudgets, normalizeKey(signal.budgetRange), preferenceWeight);
    }
    if (signal.season && preferenceWeight !== 0) {
      incMap(summary.topSeasons, normalizeKey(signal.season), preferenceWeight);
    }
  }

  summary.recentSignals = signals.slice(0, 10);

  const toTopList = (mapValue, limit = 3) =>
    Array.from(mapValue.entries())
      .map(([key, score]) => ({ key, score: Number(score || 0) }))
      .filter((item) => item.key && item.score !== 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  return {
    actionCounts: summary.actionCounts,
    topCategories: toTopList(summary.topCategories, 3),
    topLocations: toTopList(summary.topLocations, 3),
    topBudgets: toTopList(summary.topBudgets, 3),
    topSeasons: toTopList(summary.topSeasons, 3),
    recentSignals: summary.recentSignals,
  };
};

const buildPreferenceSummary = (preferenceDoc) => {
  if (!preferenceDoc) {
    return buildSummaryFromSignals([]);
  }

  return {
    actionCounts: {
      view: Number(preferenceDoc.actionCounts?.view || 0),
      favorite: Number(preferenceDoc.actionCounts?.favorite || 0),
      search: Number(preferenceDoc.actionCounts?.search || 0),
      book: Number(preferenceDoc.actionCounts?.book || 0),
      rating: Number(preferenceDoc.actionCounts?.rating || 0),
      total: Number(preferenceDoc.actionCounts?.total || 0),
    },
    topCategories: mapToTopList(preferenceDoc.categoryScores, 3),
    topLocations: mapToTopList(preferenceDoc.locationScores, 3),
    topBudgets: mapToTopList(preferenceDoc.budgetScores, 3),
    topSeasons: mapToTopList(preferenceDoc.seasonScores, 3),
    recentSignals: Array.isArray(preferenceDoc.recentSignals)
      ? preferenceDoc.recentSignals.slice(0, 10)
      : [],
  };
};

const recordBehavior = async ({
  userId,
  guestId,
  actionType,
  service = null,
  payload = {},
}) => {
  if ((!userId && !guestId) || !actionType || !ACTION_WEIGHTS[actionType]) {
    return null;
  }

  const ownerKey = getOwnerKey({ userId, guestId });
  const signal = buildSignalPayload({ actionType, service, payload });

  const logEntry = UserBehaviorLog.create({
    userId: userId || null,
    guestId: userId ? "" : guestId,
    ownerKey,
    actionType,
    ...signal,
  });

  const preferenceEntry = userId
    ? UserPreference.findOneAndUpdate(
        { userId },
        buildPreferenceUpdate(signal),
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        },
      )
    : null;

  await Promise.all([logEntry, preferenceEntry]);
  await invalidateRecommendationCache(ownerKey);

  return signal;
};

const mapToTopList = (mapValue, limit = 3) => {
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

const getPreferenceDoc = async (userId) => {
  if (!userId) return null;
  return UserPreference.findOne({ userId });
};

const getGuestPreferenceSummary = async (guestId) => {
  if (!guestId) {
    return buildSummaryFromSignals([]);
  }

  const signals = await UserBehaviorLog.find({ guestId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return buildSummaryFromSignals(signals);
};

module.exports = {
  recordBehavior,
  buildPreferenceSummary,
  buildSummaryFromSignals,
  getPreferenceDoc,
  getGuestPreferenceSummary,
  getServiceContext,
  getOwnerKey,
  getRatingWeight,
};
