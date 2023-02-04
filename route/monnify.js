const express = require("express")
const router = express.Router();
const monnify = require("../controller/monnify")

router.post("/pay", monnify.initializePayment)
router.post("/transfer", monnify.initializeTransfer)
router.get("/verifypayment", monnify.verifyTRansaction)
router.get("/verifywithdraw", monnify.verifyTransfer)
router.post("/verify/webhook", monnify.handleWebhook)
router.get("/banks", monnify.getBanks)
router.get("/verifyaccount", monnify.verifyBankAccount)

router.get("/verify/webhook", (req, res)=>{
    return res.status(200).json({message: "cannot process request"})
})

module.exports = router;
