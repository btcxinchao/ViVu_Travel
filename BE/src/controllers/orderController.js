const Order = require("../models/Order.js");
const Schedule = require("../models/Schedule.js");
const Coupon = require("../models/Coupon.js");
const behaviorService = require("../services/behaviorService.js");
const {
  calculateRefundPlan,
  createSettlementEntry,
  createRefundEntry,
  normalizeCancellationPolicy,
} = require("../services/escrowLedgerService.js");
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
} = require("../validations/orderValidation.js");

const generateOrderCode = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `OD${String(Math.floor(Math.random() * 10000)).padStart(
      4,
      "0",
    )}`;
    // 2 chữ + 4 số để khách và provider đối chiếu nhanh.
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.exists({ orderCode: candidate });
    if (!exists) return candidate;
  }

  return `OD${String(Date.now()).slice(-4)}`;
};


const releaseScheduleSlots = async (order) => {
  const schedule = await Schedule.findById(order.scheduleId);
  if (!schedule) return;

  schedule.bookedSlots = Math.max(
    0,
    Number(schedule.bookedSlots || 0) - Number(order.numPeople || 0),
  );

  if (schedule.bookedSlots < schedule.maxSlots && schedule.status === "full") {
    schedule.status = "open";
  }

  await schedule.save();
};

// Tao don dat tour moi cho user, co xu ly coupon neu duoc gui len.
module.exports.createOrder = async (req, res) => {
  try {
    const validation = validateCreateOrder(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const {
      scheduleId,
      numPeople,
      customerInfo,
      note,
      paymentFlow,
      couponCode,
    } = validation.data;

    const schedule = await Schedule.findById(scheduleId).populate("serviceId");
    if (!schedule || schedule.status !== "open") {
      return res
        .status(400)
        .json({ message: "Lich khoi hanh nay hien khong kha dung" });
    }

    const availableSlots =
      Number(schedule.maxSlots || 0) - Number(schedule.bookedSlots || 0);
    if (numPeople > availableSlots) {
      return res.status(400).json({
        message: "Số lượng chỗ còn lại không đủ",
      });
    }

    const service = schedule.serviceId;
    const baseTotalPrice = Number(service.prices || 0) * numPeople;
    let discountAmount = 0;
    let couponId = null;
    let normalizedCouponCode = "";

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: String(couponCode).trim().toUpperCase(),
        provider_id: service.provider_id,
        status: "active",
      });

      if (coupon) {
        const now = new Date();
        const withinTimeRange =
          (!coupon.startDate || coupon.startDate <= now) &&
          (!coupon.endDate || coupon.endDate >= now);

        if (
          withinTimeRange &&
          Number(coupon.usedCount || 0) < Number(coupon.maxUsage || 1) &&
          baseTotalPrice >= Number(coupon.minOrderValue || 0)
        ) {
          const allowedServiceIds = Array.isArray(coupon.serviceIds)
            ? coupon.serviceIds.map((item) => String(item))
            : [];
          const serviceAllowed =
            allowedServiceIds.length === 0 ||
            allowedServiceIds.includes(String(service._id));

          if (serviceAllowed) {
            if (coupon.discountType === "percent") {
              discountAmount = Math.floor(
                (baseTotalPrice * Number(coupon.discountValue || 0)) / 100,
              );
            } else {
              discountAmount = Number(coupon.discountValue || 0);
            }

            if (discountAmount > baseTotalPrice) discountAmount = baseTotalPrice;
            couponId = coupon._id;
            normalizedCouponCode = coupon.code;
            coupon.usedCount += 1;
            await coupon.save();
          }
        }
      }
    }

    const finalPrice = Math.max(baseTotalPrice - discountAmount, 0);
    const normalizedPaymentFlow =
      String(paymentFlow || "").toLowerCase() === "vnpay" ? "vnpay" : "manual";
    const orderCode = await generateOrderCode();

    const newOrder = await Order.create({
      userId: req.user.id,
      serviceId: service._id,
      scheduleId: schedule._id,
      provider_id: service.provider_id,
      orderCode,
      tourSnapshot: {
        name: service.serviceName,
        departureDate: schedule.departureDate,
        pricePerPerson: service.prices,
      },
      customerInfo,
      numPeople,
      originalPrice: baseTotalPrice,
      totalPrice: finalPrice,
      couponCode: normalizedCouponCode,
      couponId,
      discountAmount,
      finalPrice,
      note,
      cancellationPolicySnapshot: normalizeCancellationPolicy(
        service.cancellationPolicy || {},
      ),
      status:
        normalizedPaymentFlow === "vnpay"
          ? "awaiting_payment"
          : "awaiting_confirm",
      paymentStatus: "unpaid",
    });

    schedule.bookedSlots += numPeople;
    if (schedule.bookedSlots >= schedule.maxSlots) {
      schedule.status = "full";
    }
    await schedule.save();

    const behaviorServiceDoc = await service.populate(
      "category",
      "categoryName slug",
    );

    behaviorService
      .recordBehavior({
        userId: req.user.id,
        actionType: "book",
        service: behaviorServiceDoc,
        payload: {
          source: "create_order",
          budgetRange: behaviorServiceDoc.budgetRange || "",
          category:
            behaviorServiceDoc.category?.categoryName ||
            behaviorServiceDoc.category?.slug ||
            "",
          location: behaviorServiceDoc.location || "",
          metadata: {
            orderId: String(newOrder._id),
            paymentFlow: normalizedPaymentFlow,
          },
        },
      })
      .catch((error) => {
        console.error("Loi record booking behavior:", error);
      });

    return res.status(201).json({
      message:
        normalizedPaymentFlow === "vnpay"
          ? "Da tao don cho thanh toan"
          : "Dat tour thanh cong, vui long cho doi tac xac nhan",
      data: newOrder,
    });
  } catch (error) {
    console.error("Loi createOrder:", error);
    return res.status(500).json({ message: "Loi he thong khi dat tour" });
  }
};

// Lich su dat tour cua user
module.exports.getMyOrders = async (req, res) => {
  try {
    const myOrders = await Order.find({ userId: req.user.id })
      .populate("serviceId", "serviceName images")
      .populate("scheduleId", "departureDate")
      .populate("provider_id", "fullName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: myOrders });
  } catch (error) {
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// User huy don cua chinh minh
module.exports.cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Khong tim thay don hang" });
    }

    if (String(order.userId) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Ban khong co quyen huy don nay" });
    }

    if (
      !["awaiting_payment", "awaiting_confirm", "confirmed"].includes(
        order.status,
      )
    ) {
      return res.status(400).json({
        message:
          "Chi co the huy don dang cho thanh toan, cho xac nhan hoac da xac nhan",
      });
    }

    if (order.status !== "cancelled") {
      await releaseScheduleSlots(order);
    }

    const refundPlan = calculateRefundPlan(order, "user");
    const paidAmount = Number(order.finalPrice || order.totalPrice || 0);
    const wasPaid = String(order.paymentStatus || "").toLowerCase() === "paid";
    const refundAmount = wasPaid ? refundPlan.refundAmount : 0;

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = "user";
    order.cancelReason = "Khach huy don";
    order.refundRate = wasPaid ? refundPlan.refundRate : 0;
    order.refundAmount = refundAmount;
    order.refundPolicy = wasPaid
      ? refundPlan.policyLabel
      : "Huy don khi chua thanh toan";
    order.escrowStatus = wasPaid
      ? refundAmount > 0
        ? "held"
        : "released"
      : "none";
    order.settlementStatus = wasPaid
      ? refundAmount > 0
        ? "pending"
        : "settled"
      : "void";
    order.refundStatus = wasPaid
      ? refundAmount > 0
        ? "succeeded"
        : "none"
      : "none";
    if (wasPaid && refundAmount > 0) {
      order.refundRequestedAt = new Date();
      order.paymentStatus = "refunded";
      order.refundedAt = new Date();
      order.refundCompletedAt = new Date();
      order.refundGatewayResponseCode = "00";
      order.refundGatewayMessage = "Hoan tien thanh cong";
      order.refundGatewayTransactionNo = "";
      order.refundRequestId = "";
      order.escrowStatus = "refunded";
      order.settlementStatus = "refunded";
      await order.save();

      await createRefundEntry(
        order,
        refundPlan,
        {
          role: "user",
          id: req.user.id,
          cancelledBy: "user",
        },
      );
    } else {
      await order.save();
    }

    return res.status(200).json({
      message: wasPaid
        ? refundAmount >= paidAmount
          ? "Da huy don va hoan tien 100%"
          : refundAmount > 0
            ? `Da huy don va hoan tien ${Math.round(refundPlan.refundRate * 100)}%`
            : "Da huy don, khong hoan tien"
        : "Da huy don thanh cong",
      data: order,
    });
  } catch (error) {
    console.error("Loi cancelMyOrder:", error);
    return res.status(500).json({ message: "Loi he thong khi huy don" });
  }
};

// Danh sach don hang cho admin
module.exports.getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("serviceId", "serviceName images location")
      .populate("provider_id", "fullName")
      .populate("userId", "fullName email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: orders });
  } catch (error) {
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// Danh sach don cua provider
module.exports.getProviderOrders = async (req, res) => {
  try {
    const orders = await Order.find({ provider_id: req.user.id })
      .populate("serviceId", "serviceName location destination region")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: orders });
  } catch (error) {
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// Provider/Admin cap nhat trang thai don
module.exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateUpdateOrderStatus(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }
    const { status, paymentStatus } = validation.data;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Khong tim thay don hang" });
    }

    if (
      String(order.provider_id) !== String(req.user.id) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Ban khong co quyen xu ly don nay" });
    }

    if (status === "completed" && order.status !== "confirmed") {
      return res.status(400).json({
        message: "Chi co the hoan tat tour khi don hang da duoc xac nhan",
      });
    }

    if (status === "cancelled") {
      if (order.status !== "cancelled") {
        await releaseScheduleSlots(order);
      }

      const refundPlan = calculateRefundPlan(order, "provider");
      const paidAmount = Number(order.finalPrice || order.totalPrice || 0);
      const wasPaid = String(order.paymentStatus || "").toLowerCase() === "paid";

      order.status = "cancelled";
      order.cancelledAt = new Date();
      order.cancelledBy =
        req.user.role === "admin" ? "admin" : "provider";
      order.cancelReason =
        req.user.role === "admin"
          ? "Admin huy don"
          : "Provider tu choi dat cho";
      order.refundRate = wasPaid ? refundPlan.refundRate : 0;
      order.refundAmount = wasPaid ? refundPlan.refundAmount : 0;
      order.refundPolicy = wasPaid
        ? req.user.role === "admin"
          ? "Admin huy don - hoan 100%"
          : "Provider tu choi dat cho - hoan 100%"
        : "Huy tour khi chua thanh toan";
      order.escrowStatus = wasPaid
        ? refundPlan.refundAmount > 0
          ? "held"
          : "released"
        : "none";
      order.settlementStatus = wasPaid
        ? refundPlan.refundAmount > 0
          ? "pending"
          : "settled"
        : "void";
    order.refundStatus = wasPaid
      ? refundPlan.refundAmount > 0
        ? "succeeded"
        : "none"
      : "none";
      if (wasPaid && refundPlan.refundAmount > 0) {
        order.refundRequestedAt = new Date();
        order.paymentStatus = "refunded";
        order.refundedAt = new Date();
        order.refundCompletedAt = new Date();
        order.refundGatewayResponseCode = "00";
        order.refundGatewayMessage = "Hoan tien thanh cong";
        order.refundGatewayTransactionNo = "";
        order.refundRequestId = "";
        order.escrowStatus = "refunded";
        order.settlementStatus = "refunded";
        await order.save();

        await createRefundEntry(
          order,
          refundPlan,
          {
            role: req.user.role === "admin" ? "admin" : "provider",
            id: req.user.id,
            cancelledBy: req.user.role === "admin" ? "admin" : "provider",
          },
        );
      } else {
        await order.save();
      }

      return res.status(200).json({
        message: wasPaid
          ? refundPlan.refundAmount >= paidAmount
            ? req.user.role === "admin"
              ? "Admin da huy don va hoan tien 100%"
              : "Provider da tu choi dat cho va hoan tien 100%"
            : refundPlan.refundAmount > 0
              ? `Cap nhat trang thai don hang thanh cong va hoan tien ${Math.round(refundPlan.refundRate * 100)}%`
              : "Cap nhat trang thai don hang thanh cong, khong hoan tien"
          : "Cap nhat trang thai don hang thanh cong",
        data: order,
      });
    }

    if (status === "completed") {
      const hasPaid = String(order.paymentStatus || "").toLowerCase() === "paid";
      if (!hasPaid) {
        return res.status(400).json({
          message: "Chi co the hoan tat tour khi don hang da thanh toan",
        });
      }
      const alreadySettled =
        String(order.settlementStatus || "").toLowerCase() === "settled";
      order.status = "completed";
      order.settlementStatus = "settled";
      order.escrowStatus = "released";
      order.settledAt = new Date();
      order.paymentStatus = "paid";
      await order.save();

      if (!alreadySettled) {
        await createSettlementEntry(order, {
          role: req.user.role === "admin" ? "admin" : "provider",
          id: req.user.id,
        });
      }

      return res.status(200).json({
        message: "Cap nhat trang thai don hang thanh cong",
        data: order,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { returnDocument: "after" },
    );

    return res.status(200).json({
      message: "Cap nhat trang thai don hang thanh cong",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Loi updateOrderStatus:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
