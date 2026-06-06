const { validationSuccess } = require("./commonValidation.js");

const normalizeCreateQrPayload = (body = {}) =>
  validationSuccess({
    amountVnd: Math.max(Math.floor(Number(body?.amount || 50000)), 0),
    orderInfo: String(body?.orderInfo || "Thanh toan demo VNPAY"),
    txnRef: String(body?.txnRef || Date.now()),
  });

module.exports = {
  normalizeCreateQrPayload,
};
