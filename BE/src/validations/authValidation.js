const {
  validationError,
  normalizeText,
  normalizeEmail,
  isValidEmail,
  isValidPersonName,
} = require("./commonValidation.js");

const isValidBusinessText = (value) => /^[\p{L}\d\s]+$/u.test(value);
const isVietnamPhone = (value) => /^0\d{9}$/.test(value);

const validateRegister = (body = {}) => {
  const {
    fullName,
    businessName,
    email,
    phone,
    password,
    confirmPass,
    role,
    taxCode,
    businessLicense,
    address,
    legalRepresentative,
    bankAccountNumber,
    bankName,
    agreements = {},
  } = body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizeText(phone);
  const normalizedRole = normalizeText(role);
  const normalizedFullName = normalizeText(fullName);
  const normalizedBusinessName = normalizeText(businessName);
  const normalizedTaxCode = normalizeText(taxCode);
  const normalizedBusinessLicense = normalizeText(businessLicense);
  const normalizedAddress = normalizeText(address);
  const normalizedLegalRepresentative = normalizeText(legalRepresentative);
  const normalizedBankAccountNumber = normalizeText(bankAccountNumber);
  const normalizedBankName = normalizeText(bankName);
  const normalizedDisplayName =
    normalizedRole === "provider" ? normalizedBusinessName : normalizedFullName;

  if (
    !normalizedEmail ||
    !normalizedPhone ||
    !password ||
    !confirmPass ||
    !normalizedRole ||
    !normalizedDisplayName
  ) {
    return validationError(400, "Không được để trống thông tin đăng ký");
  }

  if (!["user", "provider"].includes(normalizedRole)) {
    return validationError(400, "Role không hợp lệ");
  }

  if (normalizedRole !== "provider") {
    if (!isValidPersonName(normalizedFullName)) {
      return validationError(400, "Họ tên chỉ được chứa chữ cái");
    }

    if (normalizedFullName.length < 3 || normalizedFullName.length > 30) {
      return validationError(400, "Họ tên phải từ 3 đến 30 ký tự");
    }
  }

  if (!isValidEmail(normalizedEmail)) {
    return validationError(400, "Email không đúng định dạng");
  }

  if (!/^\d+$/.test(normalizedPhone)) {
    return validationError(400, "Số điện thoại chỉ được nhập số");
  }

  if (!isVietnamPhone(normalizedPhone)) {
    return validationError(
      400,
      "Số điện thoại phải đúng 10 số và bắt đầu bằng số 0",
    );
  }

  if (String(password).length < 6 || String(password).length > 10) {
    return validationError(400, "Mật khẩu phải từ 6 đến 10 ký tự");
  }

  if (password !== confirmPass) {
    return validationError(400, "Nhập lại mật khẩu phải trùng với mật khẩu");
  }

  if (normalizedRole === "provider") {
    if (
      !normalizedBusinessName ||
      !normalizedTaxCode ||
      !normalizedBusinessLicense ||
      !normalizedAddress ||
      !normalizedLegalRepresentative ||
      !normalizedBankAccountNumber ||
      !normalizedBankName
    ) {
      return validationError(400, "Không được để trống bất cứ thông tin nhà cung cấp nào");
    }

    if (!isValidBusinessText(normalizedBusinessName)) {
      return validationError(
        400,
        "Tên doanh nghiệp không được chứa ký tự đặc biệt",
      );
    }

    if (normalizedBusinessName.length < 5 || normalizedBusinessName.length > 30) {
      return validationError(400, "Tên doanh nghiệp phải từ 5 đến 30 ký tự");
    }

    if (normalizedAddress.length < 5 || normalizedAddress.length > 30) {
      return validationError(400, "Địa chỉ doanh nghiệp phải từ 5 đến 30 ký tự");
    }

    if (!/^\d+$/.test(normalizedBankAccountNumber)) {
      return validationError(400, "Số tài khoản ngân hàng bắt buộc phải là số");
    }

    if (agreements?.termsAccepted !== true) {
      return validationError(400, "Bạn cần đồng ý điều khoản hợp tác");
    }
  }

  return {
    isValid: true,
    data: {
      fullName: normalizedFullName,
      businessName: normalizedBusinessName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: normalizedRole,
      taxCode: normalizedTaxCode,
      businessLicense: normalizedBusinessLicense,
      address: normalizedAddress,
      legalRepresentative: normalizedLegalRepresentative,
      bankAccountNumber: normalizedBankAccountNumber,
      bankName: normalizedBankName,
      agreements,
      normalizedDisplayName,
    },
  };
};

const validateProviderRegistrationDetails = (body = {}) => {
  const {
    businessName,
    taxCode,
    businessLicense,
    address,
    legalRepresentative,
    bankAccountNumber,
    bankName,
    agreements = {},
  } = body;

  const normalizedBusinessName = normalizeText(businessName);
  const normalizedTaxCode = normalizeText(taxCode);
  const normalizedBusinessLicense = normalizeText(businessLicense);
  const normalizedAddress = normalizeText(address);
  const normalizedLegalRepresentative = normalizeText(legalRepresentative);
  const normalizedBankAccountNumber = normalizeText(bankAccountNumber);
  const normalizedBankName = normalizeText(bankName);

  if (
    !normalizedBusinessName ||
    !normalizedTaxCode ||
    !normalizedBusinessLicense ||
    !normalizedAddress ||
    !normalizedLegalRepresentative ||
    !normalizedBankAccountNumber ||
    !normalizedBankName
  ) {
    return validationError(400, "Không được để trống bất cứ thông tin nhà cung cấp nào");
  }

  if (!isValidBusinessText(normalizedBusinessName)) {
    return validationError(
      400,
      "Tên doanh nghiệp không được chứa ký tự đặc biệt",
    );
  }

  if (normalizedBusinessName.length < 5 || normalizedBusinessName.length > 30) {
    return validationError(400, "Tên doanh nghiệp phải từ 5 đến 30 ký tự");
  }

  if (normalizedAddress.length < 5 || normalizedAddress.length > 30) {
    return validationError(400, "Địa chỉ doanh nghiệp phải từ 5 đến 30 ký tự");
  }

  if (!/^\d+$/.test(normalizedBankAccountNumber)) {
    return validationError(400, "Số tài khoản ngân hàng bắt buộc phải là số");
  }

  if (agreements?.termsAccepted !== true) {
    return validationError(400, "Bạn cần đồng ý điều khoản hợp tác");
  }

  return {
    isValid: true,
    data: {
      businessName: normalizedBusinessName,
      taxCode: normalizedTaxCode,
      businessLicense: normalizedBusinessLicense,
      address: normalizedAddress,
      legalRepresentative: normalizedLegalRepresentative,
      bankAccountNumber: normalizedBankAccountNumber,
      bankName: normalizedBankName,
      agreements,
    },
  };
};

const validateLogin = (body = {}) => {
  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!email || !password) {
    return validationError(400, "Thiếu email hoặc password");
  }

  return {
    isValid: true,
    data: { email, password },
  };
};

const validateForgotPassword = (body = {}) => {
  const email = normalizeEmail(body.email);

  if (!email) {
    return validationError(404, "Khong ton tai email. Vui long kiem tra lai !");
  }

  if (!isValidEmail(email)) {
    return validationError(400, "Email không đúng định dạng");
  }

  return {
    isValid: true,
    data: { email },
  };
};

const validateResetPassword = (body = {}) => {
  const email = normalizeEmail(body.email);
  const token = normalizeText(body.token);
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!email || !token || !newPassword || !confirmPassword) {
    return validationError(400, "Thieu thong tin");
  }

  if (!isValidEmail(email)) {
    return validationError(400, "Email không đúng định dạng");
  }

  if (newPassword.length < 6 || newPassword.length > 10) {
    return validationError(400, "Mat khau phai tu 6 den 10 ky tu");
  }

  if (newPassword !== confirmPassword) {
    return validationError(400, "Mat khau xac nhan khong khop");
  }

  return {
    isValid: true,
    data: {
      email,
      token,
      newPassword,
    },
  };
};

module.exports = {
  validateRegister,
  validateProviderRegistrationDetails,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
