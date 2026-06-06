const mongoose = require("mongoose");

const revenueLedgerSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ["escrow_hold", "settlement", "refund"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["held", "settled", "refunded", "retained", "void"],
      default: "held",
      index: true,
    },
    grossAmount: { type: Number, default: 0 },
    heldAmount: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    refundRate: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    providerAmount: { type: Number, default: 0 },
    cancelledBy: { type: String, default: "" },
    policyLabel: { type: String, default: "" },
    actorRole: { type: String, default: "system" },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

const RevenueLedger = mongoose.model("RevenueLedger", revenueLedgerSchema);

module.exports = RevenueLedger;
