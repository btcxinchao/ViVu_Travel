const validationError = (status, message) => ({
  isValid: false,
  status,
  message,
});

const validationSuccess = (data = {}) => ({
  isValid: true,
  data,
});

const normalizeText = (value) => String(value || "").trim();

const normalizeEmail = (email) =>
  normalizeText(email).toLowerCase();

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));

const isValidPersonName = (value) => /^[\p{L}\s]+$/u.test(value);

const parseArrayField = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      // Fall through to delimiter parsing for plain text input.
    }

    return text
      .split(/[,;\n]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

module.exports = {
  validationError,
  validationSuccess,
  normalizeText,
  normalizeEmail,
  isValidEmail,
  isValidPersonName,
  parseArrayField,
};
