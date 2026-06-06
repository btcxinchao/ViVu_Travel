const {
  VNPay,
  ignorelogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
const Order = require("../models/Order.js");
const { createEscrowHoldEntry } = require("../services/escrowLedgerService.js");
const { normalizeCreateQrPayload } = require("../validations/vnpayValidation.js");
const formatVND = (amount) => {
  const number = Number(amount);

  return `${number.toLocaleString("vi-VN")}đ`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatVnpayTime = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Không có";

  if (/^\d{14}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(8, 10);
    const minute = raw.slice(10, 12);
    const second = raw.slice(12, 14);
    return `${hour}:${minute}:${second} ${day}/${month}/${year}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleString("vi-VN", {
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const formatVnpayDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Không có";

  if (/^\d{14}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Không có";

  return parsed.toLocaleDateString("vi-VN");
};

const formatVnpayClock = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Không có";

  if (/^\d{14}$/.test(raw)) {
    const hour = raw.slice(8, 10);
    const minute = raw.slice(10, 12);
    const second = raw.slice(12, 14);
    return `${hour}:${minute}:${second}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Không có";

  return parsed.toLocaleTimeString("vi-VN", { hour12: false });
};

const getFrontendBaseUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";

const buildQueryUrl = (baseUrl, params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
};

module.exports.createQr = async (req, res) => {
  try {
    const port = process.env.PORT || 5000;
    const { amountVnd, orderInfo, txnRef } =
      normalizeCreateQrPayload(req.body).data;
    const vnpAmount = Math.max(Math.floor(amountVnd * 100), 0);

    const vnpay = new VNPay({
      tmnCode: "C39XK6SG",
      secureSecret: "4Y14DKK7PRH0PJ1L9H6PRUGI37EHWPH9",
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignorelogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpayRespone = await vnpay.buildPaymentUrl({
      vnp_Amount: amountVnd,
      vnp_IpAddr: "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `http://localhost:${port}/api/check-payment-vnpay`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(200).json({
      vnpayRespone,
      requestData: {
        amount: amountVnd,
        vnpAmount,
        orderInfo,
        txnRef,
        orderType: ProductCode.Other,
      },
    });
  } catch (error) {
    console.error("Loi create-qr:", error);
    return res.status(500).json({
      message:
        error?.code === "MODULE_NOT_FOUND"
          ? "Chua cai package vnpay trong backend"
          : "Khong tao duoc link thanh toan",
    });
  }
};

module.exports.checkPayment = async (req, res) => {
  const vnpay = new VNPay({
    tmnCode: "C39XK6SG",
    secureSecret: "4Y14DKK7PRH0PJ1L9H6PRUGI37EHWPH9",
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: "SHA512",
    loggerFn: ignorelogger,
  });

  let verifyResult = null;
  try {
    verifyResult = await vnpay.verifyReturnUrl(req.query);
  } catch (error) {
    console.error("Loi verifyReturnUrl:", error);
  }

  const responseCode = String(
    verifyResult?.vnp_ResponseCode ?? req.query?.vnp_ResponseCode ?? "",
  );
  const transactionStatus = String(
    verifyResult?.vnp_TransactionStatus ??
      req.query?.vnp_TransactionStatus ??
      "",
  );
  const isVerified = Boolean(verifyResult?.isVerified);
  const hasSuccessfulResponseCode = responseCode === "00";
  const hasSuccessfulTransactionStatus =
    transactionStatus === "" || transactionStatus === "00";
  const isSuccess =
    isVerified && hasSuccessfulResponseCode && hasSuccessfulTransactionStatus;

  const vnp_Amount = String(
    verifyResult?.vnp_Amount ?? req.query?.vnp_Amount ?? "",
  );
  const vnp_BankCode = String(
    verifyResult?.vnp_BankCode || req.query?.vnp_BankCode || "",
  );
  const vnp_OrderInfo = String(
    verifyResult?.vnp_OrderInfo || req.query?.vnp_OrderInfo || "",
  );
  const vnp_TransactionNo = String(
    verifyResult?.vnp_TransactionNo ||
      req.query?.vnp_TransactionNo ||
      req.query?.vnp_BankTranNo ||
      "",
  );
  const vnp_TxnRef = String(
    verifyResult?.vnp_TxnRef || req.query?.vnp_TxnRef || "",
  );
  const vnp_PayDate = String(
    verifyResult?.vnp_PayDate || req.query?.vnp_PayDate || "",
  );
  let didUpdateOrder = false;
  let paymentAmount = String(Math.floor(Number(vnp_Amount || 0) / 100));
  let displayAmountVnd = Number(paymentAmount || 0);
  let orderCode = "";

  if (vnp_TxnRef) {
    try {
      const order = await Order.findById(vnp_TxnRef);
      if (order) {
        const wasAlreadyPaid =
          String(order.paymentStatus || "").toLowerCase() === "paid";
        let shouldRecordEscrow = false;
        orderCode =
          order.orderCode ||
          `OD${String(order._id).replace(/\D/g, "").slice(-4).padStart(4, "0")}`;
        if (!order.orderCode) {
          order.orderCode = orderCode;
        }
        paymentAmount = String(order?.totalPrice ?? paymentAmount ?? "");
        displayAmountVnd = Number(order?.totalPrice ?? displayAmountVnd ?? 0);
        if (isSuccess) {
          order.paymentStatus = "paid";
          order.paidAt = new Date();
          order.escrowStatus = "held";
          order.escrowedAt = new Date();
          order.settlementStatus = "pending";
          order.paymentInfo = {
            paymentMethod: "vnpay",
            transactionNo: vnp_TransactionNo,
            bankCode: vnp_BankCode,
            payDate: vnp_PayDate,
            orderInfo: vnp_OrderInfo,
            amount: Number(order?.totalPrice ?? 0),
          };
          if (order.status === "awaiting_payment") {
            order.status = "awaiting_confirm";
          }
          didUpdateOrder = true;
          shouldRecordEscrow = !wasAlreadyPaid;
        } else if (order.status === "awaiting_payment") {
          order.paymentStatus = "unpaid";
        }
        await order.save();
        if (shouldRecordEscrow) {
          await createEscrowHoldEntry(order, {
            role: "system",
          });
        }
      }
    } catch (error) {
      console.error("Loi cap nhat don hang sau thanh toan:", error);
    }
  }

  const dashboardUrl = buildQueryUrl(`${getFrontendBaseUrl()}/user/dashboard`, {
    vnpayStatus: isSuccess ? "success" : "failed",
    orderId: vnp_TxnRef,
    orderCode,
    verified: isVerified ? "1" : "0",
    updated: didUpdateOrder ? "1" : "0",
    paymentAmount,
    paymentTxnNo: vnp_TransactionNo,
    paymentBank: vnp_BankCode,
    paymentTime: vnp_PayDate,
    paymentOrderInfo: vnp_OrderInfo,
  });

  const title = isSuccess ? "Thanh toán thành công" : "Kết quả thanh toán";

  const displayOrderCode =
    orderCode ||
    `OD${String(vnp_TxnRef || "")
      .replace(/\D/g, "")
      .slice(-4)
      .padStart(4, "0")}`;

  return res.status(200).send(`<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>

  <body style="margin:0;font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
      <div style="width:100%;max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:22px;padding:30px;box-shadow:0 12px 35px rgba(15,23,42,0.08);">

        <div style="width:72px;height:72px;margin:0 auto 18px;border-radius:50%;background:${isSuccess ? "#ecfdf5" : "#fef2f2"};display:flex;align-items:center;justify-content:center;">
          ${
            isSuccess
              ? `<svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#16a34a" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
              : `<svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                  <path d="M15 9l-6 6M9 9l6 6" stroke="#dc2626" stroke-width="2.8" stroke-linecap="round"/>
                </svg>`
          }
        </div>

        <div style="text-align:center;">
          <div style="display:inline-block;padding:7px 14px;border-radius:999px;background:${isSuccess ? "#dcfce7" : "#fee2e2"};color:${isSuccess ? "#166534" : "#b91c1c"};font-size:13px;font-weight:700;">
            ${isSuccess ? "Đã xác nhận" : "Thanh toán thất bại"}
          </div>

          <h1 style="margin:16px 0 8px;font-size:30px;line-height:1.25;color:#111827;">
            ${isSuccess ? "Thanh toán thành công" : "Thanh toán chưa thành công"}
          </h1>

          <p style="margin:0;color:#64748b;font-size:15px;line-height:1.6;">
            ${
              isSuccess
                ? "Cảm ơn bạn đã thanh toán. Thông tin giao dịch của bạn được hiển thị bên dưới."
                : "Giao dịch chưa được xác nhận thành công. Bạn có thể quay về dashboard bằng nút bên dưới."
            }
          </p>
        </div>

        ${
          isSuccess
            ? `
        <div style="margin-top:26px;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
          <div style="padding:18px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
              Hóa đơn thanh toán
            </div>

          </div>

          <div style="padding:20px;">
            <div style="display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #e5e7eb;">
              <span style="color:#64748b;font-size:14px;">Mã đơn hàng</span>
              <strong style="color:#111827;font-size:14px;text-align:right;word-break:break-word;">${escapeHtml(displayOrderCode || "Không có")}</strong>
            </div>

            <div style="display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #e5e7eb;">
              <span style="color:#64748b;font-size:14px;">Mã giao dịch VNPay</span>
              <strong style="color:#111827;font-size:14px;text-align:right;word-break:break-word;">${escapeHtml(vnp_TransactionNo || "Không có")}</strong>
            </div>

            <div style="display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #e5e7eb;">
              <span style="color:#64748b;font-size:14px;">Phương thức thanh toán</span>
              <strong style="color:#111827;font-size:14px;text-align:right;">VNPay</strong>
            </div>

            <div style="display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #e5e7eb;">
              <span style="color:#64748b;font-size:14px;">Ngân hàng</span>
              <strong style="color:#111827;font-size:14px;text-align:right;">${escapeHtml(vnp_BankCode || "Không có")}</strong>
            </div>

            <div style="display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #e5e7eb;">
              <span style="color:#64748b;font-size:14px;">Thời gian thanh toán</span>
              <strong style="color:#111827;font-size:14px;text-align:right;">${escapeHtml(`${formatVnpayDate(vnp_PayDate)} ${formatVnpayClock(vnp_PayDate)}`.trim())}</strong>
            </div>

            <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:16px;width:100%;padding:18px 0 4px;margin-top:4px;">
              <span style="min-width:0;color:#111827;font-size:15px;font-weight:700;line-height:1.4;">
                Tổng thanh toán
              </span>

              <strong style="color:#15803d;font-size:22px;font-weight:800;text-align:right;white-space:nowrap;display:block;">
                ${formatVND(displayAmountVnd)}
              </strong>
            </div>
          </div>
        </div>`
            : ""
        }

        <div style="margin-top:24px;display:flex;justify-content:center;">
          <a href="${dashboardUrl}" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 20px;border-radius:12px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
            Về Dashboard
          </a>
        </div>

      </div>
    </div>
  </body>
</html>`);
};
