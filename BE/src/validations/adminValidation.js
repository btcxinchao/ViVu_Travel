const {
  validationError,
  validationSuccess,
  normalizeText,
  normalizeEmail,
  isValidPersonName,
} = require("./commonValidation.js");

const ACCOUNT_ROLES = ["user", "provider", "admin"];
const SERVICE_STATUSES = ["active", "inactive", "pending", "rejected"];

const validateChangeUserRole = (body = {}) => {
  const role = normalizeText(body.role);

  if (!ACCOUNT_ROLES.includes(role)) {
    return validationError(400, "Vai trò không hợp lệ");
  }

  return validationSuccess({ role });
};

const validateAddAccount = (body = {}) => {
  const fullName = normalizeText(body.fullName);
  const email = normalizeEmail(body.email);
  const phone = normalizeText(body.phone);
  const password = String(body.password || "");
  const role = normalizeText(body.role);

  if (!fullName || !email || !phone || !password || !role) {
    return validationError(400, "Thiếu thông tin bắt buộc");
  }

  if (!isValidPersonName(fullName)) {
    return validationError(400, "Họ và tên chỉ được chứa chữ cái");
  }

  if (fullName.length < 3 || fullName.length > 30) {
    return validationError(400, "Họ và tên phải từ 3 đến 30 ký tự");
  }

  if (email.length < 3 || email.length > 30) {
    return validationError(400, "Email phải từ 3 đến 30 ký tự");
  }

  if (!/^\d{10}$/.test(phone)) {
    return validationError(400, "Số điện thoại phải đúng 10 số");
  }

  if (password.length < 6) {
    return validationError(400, "Mật khẩu phải có ít nhất 6 ký tự");
  }

  if (!ACCOUNT_ROLES.includes(role)) {
    return validationError(400, "Vai trò không hợp lệ");
  }

  return validationSuccess({ fullName, email, phone, password, role });
};

const validateServiceStatus = (body = {}) => {
  const status = normalizeText(body.status);

  if (!SERVICE_STATUSES.includes(status)) {
    return validationError(
      400,
      "Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive, pending, rejected",
    );
  }

  return validationSuccess({ status });
};

const validateAdminServiceQuery = (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const rawLimit = parseInt(query.limit, 10);
  const hasPagination = Number.isFinite(rawLimit) && rawLimit > 0;
  const limit = hasPagination ? rawLimit : 0;
  const skip = (page - 1) * limit;
  const status = normalizeText(query.status) || "all";
  const keyword = normalizeText(query.keyword);

  return validationSuccess({
    page,
    rawLimit,
    hasPagination,
    limit,
    skip,
    status,
    keyword,
  });
};

module.exports = {
  validateChangeUserRole,
  validateAddAccount,
  validateServiceStatus,
  validateAdminServiceQuery,
};
