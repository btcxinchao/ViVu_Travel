const cron = require("node-cron");
const {
  cleanupExpiredRecommendationCaches,
  markAllRecommendationCachesForRefresh,
} = require("./recommendationCacheService.js");

let started = false;

// Chạy dọn cache hết hạn và đánh dấu cache cần tính lại.
const runCacheReset = async (label) => {
  try {
    await cleanupExpiredRecommendationCaches();
    await markAllRecommendationCachesForRefresh();
    console.log(`Recommendation cache reset completed at ${label}`);
  } catch (error) {
    console.error("Failed to reset recommendation cache:", error);
  }
};

// Khởi động cron job theo lịch cố định trong ngày.
const startRecommendationCacheCronJobs = () => {
  if (started) {
    return;
  }

  started = true;

  const options = {
    timezone: "Asia/Ho_Chi_Minh",
  };

  cron.schedule(
    "0 7 * * *",
    () => runCacheReset("07:00"),
    options,
  );

  cron.schedule(
    "0 16 * * *",
    () => runCacheReset("16:00"),
    options,
  );
};

module.exports = {
  startRecommendationCacheCronJobs,
};
