import * as XLSX from "xlsx";

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

const getCellValue = (row, ...keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const toNumber = (value) => {
  const normalized = Number(String(value || "").trim());
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
};

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

  if (allowed.includes(text)) return text;
  return "activity";
};

export async function parseItineraryExcelFile(file) {
  if (!file) return [];

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName =
    workbook.SheetNames[1] || workbook.SheetNames[0] || null;

  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  const groups = new Map();

  for (const row of rows) {
    const day = toNumber(getCellValue(row, "day", "Day", "ngay", "Ngày"));
    if (!day) continue;

    const title = String(
      getCellValue(row, "title", "Title", "tieu_de", "Tiêu đề"),
    ).trim();
    const description = String(
      getCellValue(row, "description", "Description", "mo_ta", "Mô tả"),
    ).trim();
    const meals = splitList(
      getCellValue(row, "meals", "Meals", "bua_an", "Bữa ăn"),
    );
    const accommodation = String(
      getCellValue(row, "accommodation", "Accommodation", "luu_tru", "Lưu trú"),
    ).trim();

    const activityTime = String(
      getCellValue(
        row,
        "activity_time",
        "time",
        "Time",
        "gio",
        "Giờ",
      ),
    ).trim();
    const activityTitle = String(
      getCellValue(
        row,
        "activity_title",
        "activity",
        "activityName",
        "title_activity",
      ),
    ).trim();
    const activityDescription = String(
      getCellValue(
        row,
        "activity_description",
        "activityDetail",
        "detail",
        "mo_ta_hoat_dong",
      ),
    ).trim();
    const activityType = normalizeActivityType(
      getCellValue(row, "activity_icon", "icon", "type", "loai"),
    );

    if (!groups.has(day)) {
      groups.set(day, {
        day,
        title,
        description,
        meals: [],
        accommodation,
        activities: [],
      });
    }

    const current = groups.get(day);
    if (!current.title && title) current.title = title;
    if (!current.description && description) current.description = description;
    if (!current.accommodation && accommodation) current.accommodation = accommodation;

    for (const meal of meals) {
      if (!current.meals.includes(meal)) {
        current.meals.push(meal);
      }
    }

    if (activityTime || activityTitle || activityDescription) {
      current.activities.push({
        time: activityTime,
        title: activityTitle || current.title || `Ngày ${day}`,
        description: activityDescription,
        type: activityType,
        icon: activityType,
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.day - b.day);
}
