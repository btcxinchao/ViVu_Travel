export const toMoney = (value) => Math.max(0, Math.floor(Number(value || 0)));

export const formatVND = (value) => `${toMoney(value).toLocaleString("vi-VN")}đ`;
