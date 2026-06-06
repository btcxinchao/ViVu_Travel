const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const splitLines = (value = "") =>
  String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const isValidImageUrl = (value) => {
  if (!String(value || "").trim()) return true;

  try {
    const url = new URL(value);
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url.pathname);
  } catch {
    return false;
  }
};

export { normalizeText, splitLines, isValidImageUrl };
