const express = require("express")
const router = express.Router();
const flutterwave = require("../controller/flutterwave")

//make payment
router.post("/pay", flutterwave.makePayment)
router.get("/banks", flutterwave.getFlutterBanks)
router.post("/withdraw", flutterwave.transferFund)
router.get("/verify", flutterwave.verifyPayment)
router.get("/airtime", flutterwave.getAirtimeBills)
router.get("/data", flutterwave.getDataBills)

//add new user
// router.post("/", users.create)

module.exports = router;