const express = require("express");
const router = express.Router();
const vnpayController = require("../controllers/vnpayController.js");

router.post("/create-qr", vnpayController.createQr);
router.get("/check-payment-vnpay", vnpayController.checkPayment);

module.exports = router;
