const RevenueLedger = require("../models/RevenueLedger.js");

const COMMISSION_RATE = 0.2;
const DEFAULT_CANCELLATION_POLICY = {
  fullRefundDays: 10,
  partialRefundDays: 5,
  partialRefundRate: 0.7,
  lowRefundRate: 0.3,
};

const toMoney = (value) => Math.max(0, Math.floor(Number(value || 0)));

const normalizeCancellationPolicy = (policy = {}) => ({
  fullRefundDays: Math.max(
    0,
    Number(policy.fullRefundDays ?? DEFAULT_CANCELLATION_POLICY.fullRefundDays),
  ),
  partialRefundDays: Math.max(
    0,
    Number(
      policy.partialRefundDays ?? DEFAULT_CANCELLATION_POLICY.partialRefundDays,
    ),
  ),
  partialRefundRate: Math.max(
    0,
    Math.min(
      1,
      Number(
        policy.partialRefundRate ??
          DEFAULT_CANCELLATION_POLICY.partialRefundRate,
      ),
    ),
  ),
  lowRefundRate: Math.max(
    0,
    Math.min(
      1,
      Number(policy.lowRefundRate ?? DEFAULT_CANCELLATION_POLICY.lowRefundRate),
    ),
  ),
});

const getCancellationPolicyFromOrder = (order = {}) =>
  normalizeCancellationPolicy(order.cancellationPolicySnapshot || {});

const getDepartureDate = (order = {}) => {
  const rawDate = order?.tourSnapshot?.departureDate || order?.departureDate;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const calculateSettlementAmounts = (grossAmount) => {
  const gross = toMoney(grossAmount);
  const commissionAmount = Math.floor(gross * COMMISSION_RATE);
  const providerAmount = Math.max(gross - commissionAmount, 0);
  
  return {
    grossAmount: gross,
    commissionAmount,
    providerAmount,
  };
};

const calculateRefundPlan = (order = {}, cancelledBy = "user") => {
  const grossAmount = toMoney(order.finalPrice || order.totalPrice);

  if (grossAmount <= 0) {
    return {
      grossAmount: 0,
      refundRate: 0,
      refundAmount: 0,
      retainedAmount: 0,
      policyLabel: "Khong co so tien de hoan",
    };
  }

  if (cancelledBy === "provider" || cancelledBy === "admin") {
    return {
      grossAmount,
      refundRate: 1,
      refundAmount: grossAmount,
      retainedAmount: 0,
      policyLabel:
        cancelledBy === "provider"
          ? "Provider huy tour - hoan 100%"
          : "Quan tri vien huy tour - hoan 100%",
    };
  }

  const policy = getCancellationPolicyFromOrder(order);
  const departureDate = getDepartureDate(order);
  const cancelledAt = new Date();

  if (!departureDate) {
    return {
      grossAmount,
      refundRate: 1,
      refundAmount: grossAmount,
      retainedAmount: 0,
      policyLabel: "Khong xac dinh ngay khoi hanh - hoan 100%",
    };
  }

  const diffDays = Math.floor(
    (departureDate.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays > policy.fullRefundDays) {
    return {
      grossAmount,
      refundRate: 1,
      refundAmount: grossAmount,
      retainedAmount: 0,
      policyLabel: `Huy hon ${policy.fullRefundDays} ngay - hoan 100%`,
    };
  }

  if (diffDays >= policy.partialRefundDays) {
    const refundAmount = Math.floor(grossAmount * policy.partialRefundRate);
    return {
      grossAmount,
      refundRate: policy.partialRefundRate,
      refundAmount,
      retainedAmount: Math.max(grossAmount - refundAmount, 0),
      policyLabel: `Huy tu ${policy.partialRefundDays} den ${policy.fullRefundDays} ngay - hoan ${Math.round(
        policy.partialRefundRate * 100,
      )}%`,
    };
  }

  const refundAmount = Math.floor(grossAmount * policy.lowRefundRate);
  return {
    grossAmount,
    refundRate: policy.lowRefundRate,
    refundAmount,
    retainedAmount: Math.max(grossAmount - refundAmount, 0),
    policyLabel: `Huy duoi ${policy.partialRefundDays} ngay - hoan ${Math.round(
      policy.lowRefundRate * 100,
    )}%`,
  };
};

const createEscrowHoldEntry = async (order, actor = {}) =>
  RevenueLedger.create({
    orderId: order._id,
    userId: order.userId,
    providerId: order.provider_id,
    serviceId: order.serviceId,
    entryType: "escrow_hold",
    status: "held",
    grossAmount: toMoney(order.finalPrice || order.totalPrice),
    heldAmount: toMoney(order.finalPrice || order.totalPrice),
    actorRole: actor.role || "system",
    actorId: actor.id || null,
    metadata: {
      orderCode: order.orderCode || "",
      paymentMethod: order?.paymentInfo?.paymentMethod || "",
    },
  });

const createSettlementEntry = async (order, actor = {}) => {
  const breakdown = calculateSettlementAmounts(
    order.finalPrice || order.totalPrice,
  );

  return RevenueLedger.create({
    orderId: order._id,
    userId: order.userId,
    providerId: order.provider_id,
    serviceId: order.serviceId,
    entryType: "settlement",
    status: "settled",
    grossAmount: breakdown.grossAmount,
    commissionAmount: breakdown.commissionAmount,
    providerAmount: breakdown.providerAmount,
    actorRole: actor.role || "system",
    actorId: actor.id || null,
    metadata: {
      orderCode: order.orderCode || "",
    },
  });
};

const createRefundEntry = async (order, refundPlan, actor = {}) =>
  RevenueLedger.create({
    orderId: order._id,
    userId: order.userId,
    providerId: order.provider_id,
    serviceId: order.serviceId,
    entryType: "refund",
    status:
      refundPlan.refundAmount > 0
        ? "refunded"
        : refundPlan.retainedAmount > 0
          ? "retained"
          : "void",
    grossAmount: refundPlan.grossAmount,
    refundAmount: refundPlan.refundAmount,
    refundRate: refundPlan.refundRate,
    providerAmount: refundPlan.retainedAmount,
    actorRole: actor.role || "system",
    actorId: actor.id || null,
    cancelledBy: actor.cancelledBy || "user",
    policyLabel: refundPlan.policyLabel,
    metadata: {
      orderCode: order.orderCode || "",
      retentionAmount: refundPlan.retainedAmount,
    },
  });

const summarizeLedger = async (match = {}) =>
  RevenueLedger.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: null,
        totalHeldRevenue: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "escrow_hold"] }, "$heldAmount", 0],
          },
        },
        totalSettlementGross: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "settlement"] }, "$grossAmount", 0],
          },
        },
        totalCommissionRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$entryType", "settlement"] },
              "$commissionAmount",
              0,
            ],
          },
        },
        totalProviderPayout: {
          $sum: {
            $cond: [
              { $eq: ["$entryType", "settlement"] },
              "$providerAmount",
              0,
            ],
          },
        },
        totalRefundRevenue: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "refund"] }, "$refundAmount", 0],
          },
        },
        totalRefundProviderRetention: {
          $sum: {
            $cond: [{ $eq: ["$entryType", "refund"] }, "$providerAmount", 0],
          },
        },
      },
    },
  ]);

module.exports = {
  COMMISSION_RATE,
  DEFAULT_CANCELLATION_POLICY,
  calculateSettlementAmounts,
  calculateRefundPlan,
  createEscrowHoldEntry,
  createSettlementEntry,
  createRefundEntry,
  normalizeCancellationPolicy,
  summarizeLedger,
  getCancellationPolicyFromOrder,
  toMoney,
};
