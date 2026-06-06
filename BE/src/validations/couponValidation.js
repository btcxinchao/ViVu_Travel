const {
  validationError,
  validationSuccess,
  normalizeText,
} = require("./commonValidation.js");

const normalizeCode = (value) => normalizeText(value).toUpperCase();

const normalizeServiceIds = (serviceIds) =>
  Array.isArray(serviceIds) ? serviceIds : [];

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const validateDiscountValue = (discountType, discountValue) => {
  const normalizedValue = Number(discountValue);
  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return validationError(400, "Gia tri giam phai lon hon 0");
  }

  if (discountType === "percent" && (normalizedValue < 1 || normalizedValue > 100)) {
    return validationError(400, "Phan tram giam gia phai tu 1 den 100");
  }

  return validationSuccess(normalizedValue);
};

const validateCouponDates = (startDate, endDate, requireStartDate = true) => {
  if (requireStartDate && !startDate) {
    return validationError(400, "Vui lòng nhập ngày bắt đầu");
  }

  if (!endDate) {
    return validationError(400, "Vui lòng nhập ngày hết hạn");
  }

  const normalizedStartDate = normalizeDateOnly(startDate || new Date());
  const normalizedEndDate = normalizeDateOnly(endDate);

  if (!normalizedStartDate) {
    return validationError(400, "Ngày bắt đầu không hợp lệ");
  }

  if (!normalizedEndDate) {
    return validationError(400, "Ngày hết hạn không hợp lệ");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (normalizedStartDate < today) {
    return validationError(400, "Ngày bắt đầu không được ở quá khứ");
  }

  if (normalizedEndDate < normalizedStartDate) {
    return validationError(400, "Ngày hết hạn phải từ ngày bắt đầu trở lên");
  }

  return validationSuccess({
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
  });
};

const validateCreateCoupon = (body = {}) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderValue,
    maxUsage,
    startDate,
    endDate,
    serviceIds = [],
  } = body;

  if (!code || !discountType || discountValue === undefined || !startDate || !endDate) {
    return validationError(400, "Thieu thong tin ma giam gia");
  }

  const normalizedDiscountType = String(discountType);
  if (!["percent", "fixed"].includes(normalizedDiscountType)) {
    return validationError(400, "Loai giam gia khong hop le");
  }

  const discountValueValidation = validateDiscountValue(
    normalizedDiscountType,
    discountValue,
  );
  if (!discountValueValidation.isValid) return discountValueValidation;

  const dateValidation = validateCouponDates(startDate, endDate);
  if (!dateValidation.isValid) return dateValidation;

  return validationSuccess({
    code: normalizeCode(code),
    discountType: normalizedDiscountType,
    discountValue: discountValueValidation.data,
    minOrderValue: Number(minOrderValue || 0),
    maxUsage: Number(maxUsage || 1),
    startDate: dateValidation.data.startDate,
    endDate: dateValidation.data.endDate,
    serviceIds: normalizeServiceIds(serviceIds),
  });
};

const validateUpdateCoupon = (body = {}) => {
  const data = {};

  if (body.startDate !== undefined || body.endDate !== undefined) {
    const dateValidation = validateCouponDates(
      body.startDate,
      body.endDate,
      body.startDate !== undefined,
    );
    if (!dateValidation.isValid) return dateValidation;
    data.startDate = dateValidation.data.startDate;
    data.endDate = dateValidation.data.endDate;
  }

  if (body.code !== undefined) data.code = normalizeCode(body.code);
  if (body.discountType !== undefined) {
    data.discountType = String(body.discountType);
    if (!["percent", "fixed"].includes(data.discountType)) {
      return validationError(400, "Loai giam gia khong hop le");
    }
  }
  if (body.discountValue !== undefined) {
    const discountType = data.discountType || body.discountType || body.currentDiscountType;
    const discountValueValidation = validateDiscountValue(
      String(discountType || "percent"),
      body.discountValue,
    );
    if (!discountValueValidation.isValid) return discountValueValidation;
    data.discountValue = discountValueValidation.data;
  }
  if (body.minOrderValue !== undefined) data.minOrderValue = Number(body.minOrderValue);
  if (body.maxUsage !== undefined) data.maxUsage = Number(body.maxUsage);
  if (body.status !== undefined) data.status = String(body.status);
  if (body.serviceIds !== undefined) data.serviceIds = normalizeServiceIds(body.serviceIds);

  return validationSuccess(data);
};

const validateCouponCheck = (body = {}) => {
  const { code, serviceId, amount } = body;

  if (!code || !serviceId || amount === undefined) {
    return validationError(400, "Thieu thong tin");
  }

  return validationSuccess({
    code: normalizeCode(code),
    serviceId,
    amount: Number(amount || 0),
  });
};

module.exports = {
  normalizeCode,
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCouponCheck,
};
