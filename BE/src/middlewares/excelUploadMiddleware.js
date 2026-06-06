const multer = require("multer");

// Middleware nhận file Excel vào bộ nhớ để BE đọc và parse lịch trình.
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const fileName = String(file.originalname || "").toLowerCase();
    const isExcelFile =
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".csv");

    if (!isExcelFile) {
      return cb(new Error("Chỉ hỗ trợ file Excel .xlsx, .xls hoặc .csv"));
    }

    return cb(null, true);
  },
});

module.exports = { excelUpload };
