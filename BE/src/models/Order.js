const mongoose = require("mongoose");
const User = require("./User.js");
const Service = require("./Service.js");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Snapshot thông tin tại thời điểm đặt để đối chiếu sau này
    tourSnapshot: {
      name: String,
      departureDate: Date,
      pricePerPerson: Number,
    },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    numPeople: { type: Number, required: true, min: 1 },
    orderCode: { type: String, default: "" },
    originalPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    couponCode: { type: String, default: "" },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    discountAmount: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },
    refundRate: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    refundPolicy: { type: String, default: "" },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "succeeded", "failed"],
      default: "none",
    },
    refundRequestedAt: { type: Date, default: null },
    refundCompletedAt: { type: Date, default: null },
    refundRequestId: { type: String, default: "" },
    refundGatewayResponseCode: { type: String, default: "" },
    refundGatewayMessage: { type: String, default: "" },
    refundGatewayTransactionNo: { type: String, default: "" },
    cancelledBy: {
      type: String,
      enum: ["", "user", "provider", "admin"],
      default: "",
    },
    cancelReason: { type: String, default: "" },
    cancelledAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    escrowStatus: {
      type: String,
      enum: ["none", "held", "released", "refunded"],
      default: "none",
    },
    settlementStatus: {
      type: String,
      enum: ["pending", "settled", "refunded", "void"],
      default: "pending",
    },
    escrowedAt: { type: Date, default: null },
    settledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    cancellationPolicySnapshot: {
      fullRefundDays: { type: Number, default: 10 },
      partialRefundDays: { type: Number, default: 5 },
      partialRefundRate: { type: Number, default: 0.7 },
      lowRefundRate: { type: Number, default: 0.3 },
    },
    paymentInfo: {
      paymentMethod: { type: String, default: "" },
      transactionNo: { type: String, default: "" },
      bankCode: { type: String, default: "" },
      payDate: { type: String, default: "" },
      orderInfo: { type: String, default: "" },
      amount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: [
        "awaiting_payment",
        "awaiting_confirm",
        "confirmed",
        "completed",
        "cancelled",
      ],
      default: "awaiting_confirm",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
