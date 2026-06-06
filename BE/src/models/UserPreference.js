const mongoose = require("mongoose");

const preferenceSignalSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["view", "favorite", "search", "book", "rating"],
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
    category: { type: String, default: "" },
    budgetRange: { type: String, default: "" },
    location: { type: String, default: "" },
    keyword: { type: String, default: "" },
    season: { type: String, default: "" },
    holiday: { type: Boolean, default: false },
    rating: { type: Number, default: null },
    ratingWeight: { type: Number, default: 0 },
    source: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    actionCounts: {
      view: { type: Number, default: 0 },
      favorite: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      book: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    categoryScores: { type: Map, of: Number, default: {} },
    locationScores: { type: Map, of: Number, default: {} },
    budgetScores: { type: Map, of: Number, default: {} },
    seasonScores: { type: Map, of: Number, default: {} },
    recentSignals: {
      type: [preferenceSignalSchema],
      default: [],
    },
    lastSignalAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const UserPreference = mongoose.model("UserPreference", userPreferenceSchema);

module.exports = UserPreference;
