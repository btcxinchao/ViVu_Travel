const mongoose = require("mongoose");

const recommendationCacheSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ["user", "guest"],
      required: true,
      index: true,
    },
    ownerKey: {
      type: String,
      required: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    filterKey: {
      type: String,
      required: true,
      index: true,
    },
    filterSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    refreshNeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastGeneratedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true },
);

const RecommendationCache = mongoose.model(
  "RecommendationCache",
  recommendationCacheSchema,
);

module.exports = RecommendationCache;
