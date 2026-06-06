const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User.js");

const buildUserPayload = (user) => ({
  id: user._id.toString(),
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  role: user.role,
  status: user.status,
});

const attachUserFromToken = async (token) => {
  const decodedUser = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) return reject(err);
      return resolve(decoded);
    });
  });

  const user = await User.findById(decodedUser.userId).select("-password");
  if (!user) {
    const error = new Error("Người dùng không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Tai khoan da bi khoa");
    error.statusCode = 403;
    throw error;
  }

  return buildUserPayload(user);
};

const verifyToken = function (req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Khong tim thay token" });
    }

    attachUserFromToken(token)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((error) => {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
          return res.status(403).json({
            message: "Access token het han hoac khong dung",
          });
        }

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
          message:
            statusCode === 404
              ? "Nguoi dung khong ton tai"
              : statusCode === 403
                ? "Tai khoan da bi khoa"
                : "Loi he thong",
        });
      });
  } catch (error) {
    console.error("Loi he thong trong authMiddleware:", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

const optionalVerifyToken = function (req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const guestId =
      String(req.headers["x-guest-id"] || req.query?.guestId || req.body?.guestId || "").trim() ||
      crypto.randomUUID();

    req.guestId = guestId;
    req.isGuestIdGenerated = !String(req.headers["x-guest-id"] || req.query?.guestId || req.body?.guestId || "").trim();

    if (!token) {
      return next();
    }

    attachUserFromToken(token)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(() => next());
  } catch (error) {
    return next();
  }
};

const authorizeRoles = (...roles) => {
  return function (req, res, next) {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Ban khong co quyen thuc hien hanh dong nay.",
        });
      }
      next();
    } catch (error) {
      console.error("Loi khi xac minh role:", error);
      return res.status(500).json({ message: "Loi he thong" });
    }
  };
};

module.exports = {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
};
