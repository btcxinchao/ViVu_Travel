const {
  VNPay,
  ignorelogger,
  VnpLocale,
  dateFormat,
} = require("vnpay");

const buildVnpayClient = () =>
  new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || "C39XK6SG",
    secureSecret: process.env.VNPAY_SECRET || "4Y14DKK7PRH0PJ1L9H6PRUGI37EHWPH9",
    vnpayHost: process.env.VNPAY_HOST || "https://sandbox.vnpayment.vn",
    testMode: String(process.env.VNPAY_TEST_MODE || "true").toLowerCase() === "true",
    hashAlgorithm: "SHA512",
    loggerFn: ignorelogger,
    endpoints: {
      paymentEndpoint: "paymentv2/vpcpay.html",
      queryDrRefundEndpoint: "merchant_webapi/api/transaction",
    },
  });

const buildRefundPayload = (order, refundPlan, actor = {}) => {
  const amountVnd = Number(refundPlan?.refundAmount || 0);
  const rawPaidAmount = Number(order?.paymentInfo?.amount || order?.totalPrice || 0);
  const vnpAmount = Math.max(Math.floor(amountVnd * 100), 0);
  const requestId = `RF${Date.now()}${String(order?._id || "").slice(-4)}`;
  const transactionDate = dateFormat(order?.paidAt || order?.createdAt || new Date());
  const createDate = dateFormat(new Date());

  return {
    vnp_RequestId: requestId,
    vnp_Version: "2.1.0",
    vnp_Command: "refund",
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || "C39XK6SG",
    vnp_TransactionType:
      amountVnd >= rawPaidAmount ? "02" : "03",
    vnp_TransactionNo: String(order?.paymentInfo?.transactionNo || ""),
    vnp_TransactionDate: transactionDate,
    vnp_IpAddr: String(
      actor.ip || "127.0.0.1",
    ),
    vnp_Amount: vnpAmount,
    vnp_OrderInfo: `Hoan tien don ${order?.orderCode || order?._id || ""}`,
    vnp_TxnRef: String(order?._id || ""),
    vnp_Locale: VnpLocale.VN,
    vnp_CreateBy: String(actor.name || actor.id || "system"),
    vnp_CreateDate: createDate,
  };
};

const requestVnpayRefund = async (order, refundPlan, actor = {}) => {
  const payload = buildRefundPayload(order, refundPlan, actor);
  const vnpay = buildVnpayClient();
  const response = await vnpay.refund(payload, {
    withHash: true,
  });

  const responseCode = String(response?.vnp_ResponseCode || "");
  const transactionStatus = String(response?.vnp_TransactionStatus || "");
  const isVerified = Boolean(response?.isVerified);
  const success =
    isVerified &&
    (responseCode === "00" ||
      transactionStatus === "00" ||
      transactionStatus === "06");

  return {
    success,
    payload,
    response,
    responseCode,
    transactionStatus,
    message:
      response?.vnp_Message ||
      response?.message ||
      (success ? "Refund accepted by VNPay" : "Refund failed"),
  };
};

module.exports = {
  buildRefundPayload,
  requestVnpayRefund,
};
