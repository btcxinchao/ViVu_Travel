const User = require("../models/User.js");
const Service = require("../models/Service.js");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const behaviorService = require("../services/behaviorService.js");
const {
  validateUpdateProfile,
  validateChangePassword,
  validateRecordBehavior,
  validateUpdateUserStatus,
} = require("../validations/userValidation.js");

// Lấy thông tin cá nhân hiện tại
module.exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("Lỗi getProfile:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Cập nhật thông tin cá nhân (Họ tên, SĐT)
module.exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = validateUpdateProfile(req.body).data;

    // Tìm và cập nhật
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone },
      { returnDocument: "after", runValidators: true },
    ).select("-password");

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi updateProfile:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Thay đổi mật khẩu
module.exports.changePassword = async (req, res) => {
  try {
    const validation = validateChangePassword(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }
    const { oldPassword, newPassword } = validation.data;

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Thay đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi changePassword:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [USER] LAY DANH SACH YEU THICH
module.exports.getFavoriteServices = async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({
        message: "Chỉ khách hàng mới có danh sách yêu thích",
      });
    }

    const user = await User.findById(req.user.id)
      .select("favoriteServices")
      .populate({
        path: "favoriteServices",
        populate: [
          { path: "category", select: "categoryName slug" },
          { path: "provider_id", select: "fullName email phone" },
        ],
      });

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    return res.status(200).json({
      data: Array.isArray(user.favoriteServices) ? user.favoriteServices : [],
    });
  } catch (error) {
    console.error("Loi getFavoriteServices:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [USER] THEM / BO YEU THICH
module.exports.toggleFavoriteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (req.user.role !== "user") {
      return res.status(403).json({
        message: "Chỉ khách hàng mới có thể thêm yêu thích",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Mã dịch vụ không hợp lệ" });
    }

    const service = await Service.findById(serviceId)
      .select("_id serviceName status location budgetRange category")
      .populate("category", "categoryName slug");
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    const user = await User.findById(req.user.id).select("favoriteServices");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const favorites = Array.isArray(user.favoriteServices)
      ? user.favoriteServices.map((item) => String(item))
      : [];
    const isFavorited = favorites.includes(String(serviceId));

    const favoriteUpdate = isFavorited
      ? { $pull: { favoriteServices: service._id } }
      : { $addToSet: { favoriteServices: service._id } };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      favoriteUpdate,
      { new: true, select: "favoriteServices" },
    );

    if (!isFavorited) {
      try {
        await behaviorService.recordBehavior({
          userId: req.user.id,
          actionType: "favorite",
          service,
          payload: {
            source: "favorite_toggle",
          },
        });
      } catch (behaviorError) {
        console.error("Loi record favorite behavior:", behaviorError);
      }
    }

    return res.status(200).json({
      message: isFavorited ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích",
      data: {
        serviceId: service._id,
        isFavorited: !isFavorited,
        favoriteServices: updatedUser?.favoriteServices || [],
      },
    });
  } catch (error) {
    console.error("Loi toggleFavoriteService:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports.recordBehavior = async (req, res) => {
  try {
    const validation = validateRecordBehavior(req.body || {});
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const {
      actionType,
      serviceId,
      category,
      budgetRange,
      location,
      keyword,
      season,
      holiday,
      source,
      metadata,
    } = validation.data;

    let service = null;
    if (serviceId) {
      service = await Service.findById(serviceId).populate("category", "categoryName slug");
    }

    await behaviorService.recordBehavior({
        userId: req.user?.id || null,
        guestId: req.guestId || "",
        actionType,
        service,
        payload: {
        category,
        budgetRange,
        location,
        keyword,
        season,
        holiday,
        source,
        metadata,
        serviceId,
      },
    });

    return res.status(200).json({
      message: "Da luu hanh vi nguoi dung",
    });
  } catch (error) {
    console.error("Loi recordBehavior:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

// [ADMIN] Lấy danh sách tất cả người dùng
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ data: users });
  } catch (error) {
    console.error("Lỗi getAllUsers:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [ADMIN] Khóa/Mở khóa hoặc duyệt Provider
module.exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateUpdateUserStatus(req.body);
    if (!validation.isValid) {
      return res.status(validation.status).json({ message: validation.message });
    }
    const { status, isLocked } = validation.data;

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (status) user.status = status;
    if (typeof isLocked === "boolean") user.isLocked = isLocked;

    await user.save();
    return res
      .status(200)
      .json({ message: "Cập nhật trạng thái thành công", data: user });
  } catch (error) {
    console.error("Lỗi updateUserStatus:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
