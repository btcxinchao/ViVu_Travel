const User = require("../models/User");
const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    providerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    taxCode: {
      type: String,
      required: true,
    },

    //điều khoản / giấy chứng nhận đk doanh nghiệp
    businessLicense: {
      type: String, // link ảnh (Cloudinary)
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    //tên người đại diện pháp luật
    legalRepresentative: {
      type: String,
      required: true,
    },

    bankAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    // trạng thái duyệt
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // phần checkbox xác nhận
    agreements: {
      termsAccepted: {
        type: Boolean,
        required: true,
        // Đã đọc và đồng ý Điều khoản hợp tác
      },
      policyAccepted: {
        type: Boolean,
        required: true,
        // Đồng ý Quy chế hoạt động của nền tảng
      },
      complaintPolicyAccepted: {
        type: Boolean,
        required: true,
        // Đồng ý Chính sách xử lý khiếu nại / hoàn hủy
      },
      infoCommitment: {
        type: Boolean,
        required: true,
        // Cam kết thông tin cung cấp là đúng
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Provider", providerSchema);
