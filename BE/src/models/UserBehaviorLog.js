const mongoose = require("mongoose");

const userBehaviorLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestId: {
      type: String,
      default: "",
      index: true,
    },
    ownerKey: {
      type: String,
      default: "",
      index: true,
    },
    actionType: {
      type: String,
      enum: ["view", "favorite", "search", "book", "rating"],
      required: true,
      index: true,
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
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

userBehaviorLogSchema.pre("validate", function ensureOwner(next) {
  if (!this.userId && !this.guestId) {
    next(new Error("Either userId or guestId is required"));
    return;
  }

  if (!this.ownerKey) {
    this.ownerKey = this.userId
      ? `user:${String(this.userId)}`
      : `guest:${String(this.guestId)}`;
  }

  next();
});

const UserBehaviorLog = mongoose.model("UserBehaviorLog", userBehaviorLogSchema);

module.exports = UserBehaviorLog;
