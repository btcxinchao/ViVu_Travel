const authRoute = require("./authRoute.js");
const userRoute = require("./userRoute.js");
const serviceRoute = require("./serviceRoute.js");
const scheduleRoute = require("./scheduleRoute.js");
const categoryRoute = require("./categoryRoute.js");
const orderRoute = require("./orderRoute.js");
const reviewRoute = require("./reviewRoute.js");
const statsRoute = require("./statsRoute.js");
const adminRoute = require("./adminRoute.js");
const vnpayRoute = require("./vnpayRoute.js");
const providerRoute = require("./providerRoutes.js");
const aiRoute = require("./aiRoute.js");
const couponRoute = require("./couponRoute.js");

module.exports = function (app) {
  app.use("/api/auth", authRoute);
  app.use("/api/users", userRoute);
  app.use("/api/services", serviceRoute);
  app.use("/api/schedules", scheduleRoute);
  app.use("/api/categories", categoryRoute);
  app.use("/api/orders", orderRoute);
  app.use("/api/reviews", reviewRoute);
  app.use("/api/stats", statsRoute);
  app.use("/api/admin", adminRoute);
  app.use("/api/provider", providerRoute);
  app.use("/api/ai", aiRoute);
  app.use("/api/coupons", couponRoute);
  app.use("/api", vnpayRoute);
};
