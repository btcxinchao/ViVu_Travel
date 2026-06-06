const {
  validationError,
  validationSuccess,
  normalizeText,
} = require("./commonValidation.js");

const validateUpdateProfile = (body = {}) =>
  validationSuccess({
    fullName:
      body.fullName !== undefined ? normalizeText(body.fullName) : undefined,
    phone: body.phone !== undefined ? normalizeText(body.phone) : undefined,
  });

const validateChangePassword = (body = {}) => {
  const { oldPassword, newPassword, confirmNewPass } = body;

  if (!oldPassword || !newPassword || !confirmNewPass) {
    return validationError(400, "Vui lòng nhập đầy đủ thông tin");
  }

  if (newPassword !== confirmNewPass) {
    return validationError(400, "Mật khẩu mới không khớp");
  }

  return validationSuccess({ oldPassword, newPassword });
};

const validateRecordBehavior = (body = {}) => {
  if (!body.actionType) {
    return validationError(400, "Thieu actionType");
  }

  return validationSuccess(body);
};

const validateUpdateUserStatus = (body = {}) => {
  const { status, isLocked } = body;

  if (
    status !== undefined &&
    !["active", "pending", "rejected", "inactive", "locked"].includes(status)
  ) {
    return validationError(400, "Trạng thái người dùng không hợp lệ");
  }

  if (isLocked !== undefined && typeof isLocked !== "boolean") {
    return validationError(400, "Giá trị khóa tài khoản không hợp lệ");
  }

  return validationSuccess({ status, isLocked });
};

module.exports = {
  validateUpdateProfile,
  validateChangePassword,
  validateRecordBehavior,
  validateUpdateUserStatus,
};
