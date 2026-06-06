const mongoose = require("mongoose");
const User = require("./User.js");
const Category = require("./Category.js");

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  activities: [
    {
      time: String,
      title: String,
      description: String,
      type: {
        type: String,
        enum: [
          "transport",
          "sightseeing",
          "food",
          "hotel",
          "activity",
          "photo",
        ],
      },
    },
  ],
  meals: [String],
  accommodation: String,
});

const serviceSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    //tên dịch vụ
    serviceName: {
      type: String,
      required: true,
    },
    description: { type: String, required: true },
    //giá
    prices: {
      type: Number,
      required: true,
    },
    //địa điểm
    location: { type: String },
    //danh mục
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    //thời gian của tour
    duration: { type: String },
    images: [String],
    // điểm nổi bật của tour
    highlight: [String],
    //bao gồm buổi ăn , phương tiện
    includes: [String],
    // trạng thái
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "rejected"],
      default: "active",
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    seasonTags: { type: [String], default: [] },
    bestMonths: { type: [Number], default: [] },
    weatherTags: { type: [String], default: [] },
    budgetRange: {
      type: String,
      enum: ["low", "mid", "high"],
      default: "mid",
    },
    cancellationPolicy: {
      fullRefundDays: { type: Number, default: 10 },
      partialRefundDays: { type: Number, default: 5 },
      partialRefundRate: { type: Number, default: 0.7 },
      lowRefundRate: { type: Number, default: 0.3 },
    },
    itinerary: [itinerarySchema],

    //ảnh
    imageUrl: { type: String },
    imageId: { type: String },
  },
  { timestamps: true },
);

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
