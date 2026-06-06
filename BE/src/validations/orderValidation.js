const { validationError, validationSuccess } = require("./commonValidation.js");

const ORDER_STATUSES = [
  "awaiting_payment",
  "awaiting_confirm",
  "confirmed",
  "completed",
  "cancelled",
];

const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

const validateCreateOrder = (body = {}) => {
  const {
    scheduleId,
    numPeople,
    customerInfo,
    note,
    paymentFlow,
    couponCode,
  } = body;
  const parsedPeople = Number(numPeople);

  if (!scheduleId) {
    return validationError(400, "Thieu lich khoi hanh");
  }

  if (!Number.isInteger(parsedPeople) || parsedPeople < 1) {
    return validationError(400, "So luong khach khong hop le");
  }

  if (
    !customerInfo ||
    !String(customerInfo.name || "").trim() ||
    !String(customerInfo.email || "").trim() ||
    !String(customerInfo.phone || "").trim()
  ) {
    return validationError(
      400,
      "Vui long nhap day du ho ten, email va so dien thoai",
    );
  }

  return validationSuccess({
    scheduleId,
    numPeople: parsedPeople,
    customerInfo,
    note,
    paymentFlow,
    couponCode,
  });
};

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus: (body = {}) => {
    const { status, paymentStatus } = body;

    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      return validationError(400, "Trang thai don hang khong hop le");
    }

    if (paymentStatus !== undefined && !PAYMENT_STATUSES.includes(paymentStatus)) {
      return validationError(400, "Trang thai thanh toan khong hop le");
    }

    return validationSuccess({ status, paymentStatus });
  },
};
