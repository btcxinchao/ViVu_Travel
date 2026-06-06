const User = require("../models/User.js");
const Provider = require("../models/Provider.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Session = require("../models/Session.js");
const mailer = require("../utils/mailer.js");
const { cloudinary } = require("../config/cloudinary.js");
const {
  validateRegister,
  validateProviderRegistrationDetails,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require("../validations/authValidation.js");

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL = 15 * 60 * 1000;
const DATA_URL_IMAGE_PATTERN = /^data:image\/(png|jpe?g|webp);base64,/i;

const uploadBusinessLicense = async (businessLicense) => {
  const value = String(businessLicense || "").trim();

  if (!DATA_URL_IMAGE_PATTERN.test(value)) {
    return value;
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Missing Cloudinary config. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in BE/.env",
    );
  }

  const result = await cloudinary.uploader.upload(value, {
    folder: "vivu-travel/provider-licenses",
    resource_type: "image",
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
  });

  return result.secure_url;
};

// Dang ky tai khoan user/provider va tao ho so provider neu can.
module.exports.register = async (req, res) => {
  try {
    const validation = validateRegister(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const {
      businessName,
      email,
      phone,
      password,
      role,
      taxCode,
      businessLicense,
      address,
      legalRepresentative,
      bankAccountNumber,
      bankName,
      agreements = {},
      normalizedDisplayName,
    } = validation.data;

    const duplicate = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (duplicate) {
      const duplicateMessage =
        duplicate.email === email
          ? "Email đã tồn tại trong hệ thống"
          : "Số điện thoại đã được đăng ký";
      return res.status(409).json({ message: duplicateMessage });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const status = role === "provider" ? "pending" : "active";

    const newUser = await User.create({
      fullName: normalizedDisplayName,
      email,
      phone,
      password: hashedPassword,
      role,
      status,
    });

    if (role === "provider") {
      try {
        const businessLicenseUrl = await uploadBusinessLicense(businessLicense);

        await Provider.create({
          providerID: newUser._id,
          businessName: String(businessName).trim(),
          taxCode: String(taxCode).trim(),
          businessLicense: businessLicenseUrl,
          address: String(address).trim(),
          legalRepresentative: String(legalRepresentative).trim(),
          bankAccountNumber: String(bankAccountNumber).trim(),
          bankName: String(bankName).trim(),
          status: "pending",
          agreements: {
            termsAccepted: agreements?.termsAccepted === true,
            policyAccepted: true,
            complaintPolicyAccepted: true,
            infoCommitment: true,
          },
        });
      } catch (providerError) {
        await User.findByIdAndDelete(newUser._id);
        console.error("Loi tao ho so provider:", providerError);
        if (providerError.message?.includes("Missing Cloudinary config")) {
          return res.status(500).json({
            message:
              "Thiếu cấu hình Cloudinary. Vui lòng kiểm tra CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong BE/.env.",
          });
        }

        return res.status(500).json({
          message:
            "Không thể tạo hồ sơ nhà cung cấp. Vui lòng thử lại sau.",
        });
      }
    }

    return res.status(201).json({
      message:
        role === "provider"
          ? "Đăng kí đối tác thành công. Hồ sơ của bạn đang chờ admin duyệt."
          : "Đăng ký thành công",
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("Loi register:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// User da dang nhap dang ky tro thanh provider, giu lai email/phone/password hien co.
module.exports.registerProviderForCurrentUser = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    if (req.user.role !== "user") {
      return res.status(400).json({
        message: "Chỉ tài khoản khách hàng mới có thể đăng ký làm đối tác",
      });
    }

    const validation = validateProviderRegistrationDetails(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const existingProvider = await Provider.findOne({ providerID: req.user.id });
    if (existingProvider) {
      return res.status(409).json({
        message: "Tài khoản này đã có hồ sơ đối tác",
      });
    }

    const {
      businessName,
      taxCode,
      businessLicense,
      address,
      legalRepresentative,
      bankAccountNumber,
      bankName,
      agreements = {},
    } = validation.data;

    const businessLicenseUrl = await uploadBusinessLicense(businessLicense);

    const providerProfile = await Provider.create({
      providerID: req.user.id,
      businessName,
      taxCode,
      businessLicense: businessLicenseUrl,
      address,
      legalRepresentative,
      bankAccountNumber,
      bankName,
      status: "pending",
      agreements: {
        termsAccepted: agreements?.termsAccepted === true,
        policyAccepted: true,
        complaintPolicyAccepted: true,
        infoCommitment: true,
      },
    });

    const currentUser = await User.findById(req.user.id).select("-password");

    return res.status(201).json({
      message: "Đăng ký provider thành công, đang chờ admin duyệt.",
      data: {
        id: currentUser._id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone,
        role: currentUser.role,
        status: currentUser.status,
        providerProfile: {
          id: providerProfile._id,
          businessName: providerProfile.businessName,
          legalRepresentative: providerProfile.legalRepresentative,
          status: providerProfile.status,
        },
      },
    });
  } catch (error) {
    console.error("Loi register provider for current user:", error);
    if (error.message?.includes("Missing Cloudinary config")) {
      return res.status(500).json({
        message:
          "Thiếu cấu hình Cloudinary. Vui lòng kiểm tra CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong BE/.env.",
      });
    }

    return res.status(500).json({
      message: "Không thể tạo hồ sơ nhà cung cấp. Vui lòng thử lại sau.",
    });
  }
};

// Dang nhap, kiem tra mat khau va cap access token + refresh token.
module.exports.login = async (req, res) => {
  try {
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Email hoặc password không chính xác",
      });
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Email hoặc password không chính xác",
      });
    }

    if (user.role === "provider" && user.status === "pending") {
      return res.status(403).json({
        message: "Tài khoản đối tác đang chờ admin duyệt",
      });
    }

    if (user.role === "provider" && user.status === "rejected") {
      return res.status(403).json({
        message: "Tài khoản đối tác đã bị từ chối",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt",
      });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    const providerProfile =
      user.role === "provider"
        ? await Provider.findOne({ providerID: user._id }).select(
            "businessName legalRepresentative status",
          )
        : null;

    return res.status(200).json({
      message: "Dang nhap thanh cong",
      data: {
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          providerProfile: providerProfile
            ? {
                id: providerProfile._id,
                businessName: providerProfile.businessName,
                legalRepresentative: providerProfile.legalRepresentative,
                status: providerProfile.status,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Loi login:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// Tao lai access token tu refresh token trong cookie.
module.exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token khong ton tai." });
    }

    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      return res.status(403).json({
        message: "Token khong hop le hoac da het han",
      });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      return res.status(403).json({ message: "Token da het han." });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(404).json({ message: "Nguoi dung khong ton tai" });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Loi refreshToken:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// Dang xuat va xoa refresh session hien tai.
module.exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await Session.deleteOne({ refreshToken: token });
      res.clearCookie("refreshToken");
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error("Loi logout:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// Tao token dat lai mat khau va gui email huong dan cho user.
module.exports.forgotPassword = async (req, res) => {
  try {
    const validation = validateForgotPassword(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const successMessage = "Đã gửi";
    const { email } = validation.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "Khong ton tai email. Vui long kiem tra lai !",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Luu hash token trong DB, khong luu token thuc.
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL);
    user.resetPasswordUsedAt = null;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      email,
    )}`;

    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: "Dat lai mat khau",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="color:#f97316">Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản VIVU Travel.</p>
          <p>Hãy click vào liên kết sau để tạo mật khẩu mới:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Liên kết có hiệu lực trong 15 phút.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: successMessage });
  } catch (error) {
    console.error("Loi forgotPassword:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Kiem tra token + email, sau do cap nhat mat khau moi.
module.exports.resetPassword = async (req, res) => {
  try {
    const validation = validateResetPassword(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const { email, token, newPassword } = validation.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Token phai khop, chua het han va dung voi email cua user.
    const user = await User.findOne({
      email,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token khong hop le hoac da het han" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    user.resetPasswordUsedAt = new Date();
    await user.save();

    await Session.deleteMany({ userId: user._id });

    return res.status(200).json({ message: "Dat lai mat khau thanh cong" });
  } catch (error) {
    console.error("Loi resetPassword:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};
