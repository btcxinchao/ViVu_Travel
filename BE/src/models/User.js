const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected", "inactive", "locked"],
      default: "active",
    },
    role: {
      type: String,
      enum: ["user", "admin", "provider"],
      default: "user",
    },
    isLocked: { type: Boolean, default: false },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
    resetPasswordUsedAt: { type: Date, default: null },
    favoriteServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
