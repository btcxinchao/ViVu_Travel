const XLSX = require("xlsx");

// Hàm tách một ô dữ liệu thành mảng, dùng cho các cột như meals.
const splitList = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item || "").split(/[,;\n]/g))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[,;\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

// Hàm lấy giá trị đầu tiên hợp lệ theo nhiều tên cột khác nhau trong Excel.
const getCellValue = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

// Hàm đổi dữ liệu ngày sang số để nhóm lịch trình theo từng ngày.
const toNumber = (value) => {
  const normalized = Number(String(value || "").trim());
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
};

// Hàm chuẩn hoá loại hoạt động trong lịch trình về đúng enum BE đang dùng.
const normalizeActivityType = (value) => {
  const text = String(value || "").trim().toLowerCase();
  const allowed = [
    "transport",
    "sightseeing",
    "food",
    "hotel",
    "activity",
    "photo",
  ];

  return allowed.includes(text) ? text : "activity";
};

const stripDayPrefix = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";

  return text
    .replace(/^\s*(ngày|ngay|day)\s*\d+\s*[:\-–]?\s*/i, "")
    .trim();
};

// Hàm đọc file Excel và chuyển dữ liệu Sheet 2 thành mảng itinerary đúng schema Service.
const parseItineraryExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0] || null;

  if (!sheetName) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  const groupedDays = new Map();

  for (const row of rows) {
    const day = toNumber(getCellValue(row, ["day", "Day", "ngay", "Ngày"]));
    if (!day) continue;

    const title = String(
      getCellValue(row, ["title", "Title", "tieu_de", "Tiêu đề"]),
    ).trim();
    const description = String(
      getCellValue(row, ["description", "Description", "mo_ta", "Mô tả"]),
    ).trim();
    const meals = splitList(
      getCellValue(row, ["meals", "Meals", "bua_an", "Bữa ăn"]),
    );
    const accommodation = String(
      getCellValue(row, [
        "accommodation",
        "Accommodation",
        "hotel",
        "Hotel",
        "hotel_name",
        "hotelName",
        "ten_hotel",
        "Ten hotel",
        "ten_khach_san",
        "Ten khach san",
        "khach_san",
        "Khach san",
        "khách sạn",
        "Khách sạn",
        "stay",
        "Stay",
        "luu_tru",
        "Lưu trú",
      ]),
    ).trim();

    const hotelName = String(
      getCellValue(row, [
        "hotel_name",
        "hotelName",
        "ten_hotel",
        "Ten hotel",
        "ten_khach_san",
        "Ten khach san",
      ]),
    ).trim();

    const activityTime = String(
      getCellValue(row, [
        "activity_time",
        "time",
        "Time",
        "gio",
        "Giờ",
      ]),
    ).trim();
    const activityTitle = String(
      getCellValue(row, [
        "activity_title",
        "activity",
        "activityName",
        "title_activity",
      ]),
    ).trim();
    const activityDescription = String(
      getCellValue(row, [
        "activity_description",
        "activityDetail",
        "detail",
        "mo_ta_hoat_dong",
      ]),
    ).trim();
    const activityType = normalizeActivityType(
      getCellValue(row, ["activity_icon", "icon", "type", "loai"]),
    );

    if (!groupedDays.has(day)) {
      groupedDays.set(day, {
        day,
        title,
        description,
        meals: [],
        accommodation,
        hotelName,
        activities: [],
      });
    }

    const currentDay = groupedDays.get(day);
    if (!currentDay.title && title) currentDay.title = title;
    if (!currentDay.description && description) {
      currentDay.description = description;
    }
    if (!currentDay.accommodation && accommodation) {
      currentDay.accommodation = accommodation;
    }
    if (!currentDay.hotelName && hotelName) {
      currentDay.hotelName = hotelName;
    }

    for (const meal of meals) {
      if (!currentDay.meals.includes(meal)) {
        currentDay.meals.push(meal);
      }
    }

    if (activityTime || activityTitle || activityDescription) {
      currentDay.activities.push({
        time: activityTime,
        title: stripDayPrefix(
          activityTitle || currentDay.title || `Hoạt động ngày ${day}`,
        ),
        description: activityDescription,
        type: activityType,
      });
    }
  }

  return [...groupedDays.values()].sort((a, b) => a.day - b.day);
};

module.exports = {
  parseItineraryExcelBuffer,
};
