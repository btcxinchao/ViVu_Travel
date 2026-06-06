const {
  validationError,
  validationSuccess,
  normalizeText,
} = require("./commonValidation.js");

const SCHEDULE_STATUSES = ["open", "full", "closed"];
const MAX_SCHEDULE_SLOTS = 500;

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const validateScheduleDate = (departureDate) => {
  const selectedDate = normalizeDateOnly(departureDate);
  if (!selectedDate) {
    return validationError(400, "Ngày khởi hành không hợp lệ");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    return validationError(400, "Ngày khởi hành không được ở quá khứ");
  }

  return validationSuccess({ departureDate });
};

const validateScheduleRange = (departureDate, endDate, tourDays = null) => {
  const departure = normalizeDateOnly(departureDate);
  const end = normalizeDateOnly(endDate);

  if (!endDate) {
    return validationError(400, "Vui lòng nhập ngày về");
  }

  if (!end) {
    return validationError(400, "Ngày về không hợp lệ");
  }

  if (tourDays === 1 && end.getTime() !== departure.getTime()) {
    return validationError(400, "Tour 1 ngày phải có ngày về trùng ngày đi");
  }

  if (tourDays !== 1 && end <= departure) {
    return validationError(400, "Ngày về phải sau ngày đi");
  }

  return validationSuccess({ endDate });
};

const validateMaxSlots = (maxSlots, bookedSlots = 0) => {
  const normalizedMaxSlots = Number(maxSlots);

  if (!/^[1-9]\d*$/.test(String(maxSlots || ""))) {
    return validationError(400, "Số chỗ chỉ được nhập số và phải lớn hơn 0");
  }

  if (!Number.isInteger(normalizedMaxSlots)) {
    return validationError(400, "Số chỗ tối đa không hợp lệ");
  }

  if (normalizedMaxSlots > MAX_SCHEDULE_SLOTS) {
    return validationError(
      400,
      `Số chỗ tối đa không được vượt quá ${MAX_SCHEDULE_SLOTS}`,
    );
  }

  if (normalizedMaxSlots < bookedSlots) {
    return validationError(
      400,
      `Số chỗ tối đa không thể nhỏ hơn số khách đã đặt (${bookedSlots})`,
    );
  }

  return validationSuccess({ maxSlots: normalizedMaxSlots });
};

const validateCreateSchedule = (body = {}, tourDays = null) => {
  const { serviceId, departureDate, endDate, maxSlots, status } = body;
  const normalizedStatus = normalizeText(status) || "open";

  if (!serviceId) {
    return validationError(400, "Vui lòng chọn dịch vụ");
  }

  if (!departureDate) {
    return validationError(400, "Vui lòng nhập ngày đi");
  }

  if (!maxSlots) {
    return validationError(400, "Vui lòng nhập số chỗ tối đa");
  }

  const maxSlotsValidation = validateMaxSlots(maxSlots);
  if (!maxSlotsValidation.isValid) return maxSlotsValidation;

  if (!SCHEDULE_STATUSES.includes(normalizedStatus)) {
    return validationError(400, "Trạng thái lịch không hợp lệ");
  }

  const dateValidation = validateScheduleDate(departureDate);
  if (!dateValidation.isValid) return dateValidation;

  const rangeValidation = validateScheduleRange(departureDate, endDate, tourDays);
  if (!rangeValidation.isValid) return rangeValidation;

  return validationSuccess({
    serviceId,
    departureDate,
    endDate,
    maxSlots: maxSlotsValidation.data.maxSlots,
    status: normalizedStatus,
  });
};

const validateUpdateSchedule = (body = {}, bookedSlots = 0, tourDays = null) => {
  const { maxSlots, status, departureDate, endDate } = body;
  const normalizedStatus =
    status !== undefined ? normalizeText(status) : undefined;
  let normalizedMaxSlots;

  if (maxSlots !== undefined) {
    const maxSlotsValidation = validateMaxSlots(maxSlots, bookedSlots);
    if (!maxSlotsValidation.isValid) return maxSlotsValidation;
    normalizedMaxSlots = maxSlotsValidation.data.maxSlots;
  }

  if (
    normalizedStatus !== undefined &&
    !SCHEDULE_STATUSES.includes(normalizedStatus)
  ) {
    return validationError(400, "Trạng thái lịch không hợp lệ");
  }

  if (departureDate !== undefined) {
    const dateValidation = validateScheduleDate(departureDate);
    if (!dateValidation.isValid) return dateValidation;
  }

  if (departureDate !== undefined || endDate !== undefined) {
    const rangeValidation = validateScheduleRange(departureDate, endDate, tourDays);
    if (!rangeValidation.isValid) return rangeValidation;
  }

  return validationSuccess({
    maxSlots: normalizedMaxSlots,
    status: normalizedStatus,
    departureDate,
    endDate,
  });
};

module.exports = {
  validateCreateSchedule,
  validateUpdateSchedule,
};
