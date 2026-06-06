const Order = require("../models/Order.js");
const Service = require("../models/Service.js");
const Review = require("../models/Review.js");
const User = require("../models/User.js");
const mongoose = require("mongoose");
const {
  COMMISSION_RATE,
  summarizeLedger,
  toMoney,
} = require("../services/escrowLedgerService.js");

const ACTIVE_BOOKING_STATUSES = ["awaiting_payment", "awaiting_confirm", "confirmed"];
const PAYMENT_REVENUE_STATUSES = ["paid"];
const PAYMENT_HISTORY_STATUSES = ["paid", "refunded"];

const calcCommission = (gross) => Math.floor(toMoney(gross) * COMMISSION_RATE);

const buildRevenueBreakdown = (gross = 0) => {
  const total = toMoney(gross);
  const commission = calcCommission(total);
  const providerNet = Math.max(total - commission, 0);

  return {
    gross: total,
    commission,
    providerNet,
  };
};

const mapMonthlyRevenue = (rows = []) =>
  rows
    .map((item) => {
      const grossRevenue = toMoney(item?.grossRevenue);
      const commissionRevenue = calcCommission(grossRevenue);
      const providerRevenue = Math.max(grossRevenue - commissionRevenue, 0);

      return {
        month: Number(item?.month || 0),
        orders: Number(item?.orders || 0),
        grossRevenue,
        commissionRevenue,
        providerRevenue,
        heldRevenue: toMoney(item?.heldRevenue),
      };
    })
    .filter((item) => item.month >= 1 && item.month <= 12);

// [PROVIDER] THỐNG KÊ CHO NHÀ CUNG CẤP
module.exports.getPartnerStats = async (req, res) => {
  try {
    const providerId = new mongoose.Types.ObjectId(req.user.id);
    const ledgerSummary = await summarizeLedger({ providerId });
    const ledger = ledgerSummary[0] || {};
    const hasLedger = Boolean(
      ledger.totalSettlementGross ||
        ledger.totalRefundRevenue ||
        ledger.totalHeldRevenue,
    );

    const revenueData = await Order.aggregate([
      {
        $match: {
          provider_id: providerId,
          paymentStatus: { $in: PAYMENT_REVENUE_STATUSES },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalGrossRevenue: { $sum: "$totalPrice" },
          completedGrossRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$totalPrice", 0],
            },
          },
          heldGrossRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ACTIVE_BOOKING_STATUSES] },
                "$totalPrice",
                0,
              ],
            },
          },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [
                { $in: ["$status", ACTIVE_BOOKING_STATUSES] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const grossRevenue = revenueData[0]?.totalGrossRevenue || 0;
    const completedGrossRevenue = revenueData[0]?.completedGrossRevenue || 0;
    const heldGrossRevenue = revenueData[0]?.heldGrossRevenue || 0;
    const escrowHeldRevenue = heldGrossRevenue;
    const grossBreakdown = buildRevenueBreakdown(completedGrossRevenue);
    const heldBreakdown = buildRevenueBreakdown(escrowHeldRevenue);
    const settlementGrossRevenue = hasLedger
      ? ledger.totalSettlementGross || 0
      : completedGrossRevenue;
    const settlementCommissionRevenue = hasLedger
      ? ledger.totalCommissionRevenue || 0
      : grossBreakdown.commission;
    const settlementProviderRevenue = hasLedger
      ? ledger.totalProviderPayout || 0
      : grossBreakdown.providerNet;
    const retainedCancellationRevenue = hasLedger
      ? ledger.totalRefundProviderRetention || 0
      : 0;
    const totalProviderRevenue = Math.max(
      settlementProviderRevenue + retainedCancellationRevenue,
      0,
    );
    const totalRevenue = Math.max(
      settlementGrossRevenue + retainedCancellationRevenue,
      0,
    );
    const platformFee = settlementCommissionRevenue;
    const availableBalance = totalProviderRevenue;

    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          provider_id: providerId,
          paymentStatus: { $in: PAYMENT_REVENUE_STATUSES },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          provider_id: providerId,
          paymentStatus: { $in: PAYMENT_HISTORY_STATUSES },
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          orders: { $sum: 1 },
          grossRevenue: { $sum: "$totalPrice" },
          heldRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ACTIVE_BOOKING_STATUSES] },
                "$totalPrice",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalTours = await Service.countDocuments({
      provider_id: providerId,
    });
    const totalOrders = await Order.countDocuments({ provider_id: providerId });

    return res.status(200).json({
      data: {
        commissionRate: COMMISSION_RATE,
        totalCollectedRevenue: grossRevenue,
        totalRevenue,
        completedGrossRevenue: settlementGrossRevenue,
        heldGrossRevenue: escrowHeldRevenue,
        heldRevenue: escrowHeldRevenue,
        commissionRevenue: settlementCommissionRevenue,
        platformFee,
        providerRevenue: totalProviderRevenue,
        availableBalance,
        disbursedRevenue: totalProviderRevenue,
        retainedCancellationRevenue,
        heldCommissionRevenue: heldBreakdown.commission,
        heldProviderRevenue: heldBreakdown.providerNet,
        totalOrders: revenueData[0]?.totalOrders || totalOrders,
        completedOrders: revenueData[0]?.completedOrders || 0,
        pendingOrders: revenueData[0]?.pendingOrders || 0,
        totalTours,
        orderStatusStats,
        monthlyRevenue: mapMonthlyRevenue(monthlyRevenue),
      },
    });
  } catch (error) {
    console.error("Lỗi getPartnerStats:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy thống kê" });
  }
};

// [ADMIN] THỐNG KÊ CHO QUẢN TRỊ VIÊN
module.exports.getAdminStats = async (req, res) => {
  try {
    const ledgerSummary = await summarizeLedger({});
    const ledger = ledgerSummary[0] || {};
    const hasLedger = Boolean(
      ledger.totalSettlementGross ||
        ledger.totalRefundRevenue ||
        ledger.totalHeldRevenue,
    );

    const revenueData = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: PAYMENT_HISTORY_STATUSES },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalCollectedRevenue: { $sum: "$totalPrice" },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$totalPrice", 0],
            },
          },
          heldRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ACTIVE_BOOKING_STATUSES] },
                "$totalPrice",
                0,
              ],
            },
          },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const totalCollectedRevenue = revenueData[0]?.totalCollectedRevenue || 0;
    const completedRevenue = revenueData[0]?.completedRevenue || 0;
    const heldRevenue = revenueData[0]?.heldRevenue || 0;
    const refundedRevenue = hasLedger
      ? ledger.totalRefundRevenue || 0
      : (
          await Order.aggregate([
            {
              $match: {
                paymentStatus: "refunded",
              },
            },
            {
              $group: {
                _id: null,
                refundedRevenue: { $sum: "$refundAmount" },
              },
            },
          ])
        )[0]?.refundedRevenue || 0;
    const retentionRevenue = hasLedger ? ledger.totalRefundProviderRetention || 0 : 0;
    const settlementGrossRevenue = hasLedger
      ? ledger.totalSettlementGross || 0
      : completedRevenue;
    const escrowHeldRevenue = heldRevenue;
    const completedBreakdown = buildRevenueBreakdown(settlementGrossRevenue);
    const heldBreakdown = buildRevenueBreakdown(escrowHeldRevenue);
    const commissionRevenue = hasLedger
      ? ledger.totalCommissionRevenue || 0
      : completedBreakdown.commission;
    const providerPayout = hasLedger
      ? ledger.totalProviderPayout || 0
      : completedBreakdown.providerNet;

    const userStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const serviceStats = await Service.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const totalReviews = await Review.countDocuments();

    const topServices = await Order.aggregate([
      { $match: { status: "completed", paymentStatus: "paid" } },
      {
        $group: {
          _id: "$serviceId",
          totalEarned: { $sum: "$totalPrice" },
          totalBookings: { $sum: 1 },
        },
      },
      { $sort: { totalEarned: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "tourInfo",
        },
      },
      { $unwind: "$tourInfo" },
      {
        $project: {
          serviceName: "$tourInfo.serviceName",
          totalEarned: 1,
          totalBookings: 1,
        },
      },
    ]);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: PAYMENT_REVENUE_STATUSES },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          orders: { $sum: 1 },
          grossRevenue: { $sum: "$totalPrice" },
          heldRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ACTIVE_BOOKING_STATUSES] },
                "$totalPrice",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      data: {
        commissionRate: COMMISSION_RATE,
        gmv: totalCollectedRevenue,
        totalRevenue: settlementGrossRevenue,
        totalCollectedRevenue,
        completedRevenue: settlementGrossRevenue,
        heldRevenue: escrowHeldRevenue,
        refundedRevenue,
        retentionRevenue,
        commissionRevenue,
        platformFee: commissionRevenue,
        providerPayout,
        availableBalance: providerPayout,
        disbursedRevenue: providerPayout,
        escrowHeldRevenue,
        heldCommissionRevenue: heldBreakdown.commission,
        heldProviderPayout: heldBreakdown.providerNet,
        totalOrders: revenueData[0]?.totalOrders || 0,
        completedOrders: revenueData[0]?.completedOrders || 0,
        userStats,
        serviceStats,
        topServices,
        totalReviews,
        monthlyRevenue: mapMonthlyRevenue(monthlyRevenue),
      },
    });
  } catch (error) {
    console.error("Lỗi getAdminStats:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
