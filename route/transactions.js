const express = require("express")
const router = express.Router();
const Transaction = require("../controller/transactions");

router.get("/", Transaction.getAllTransaction);
// router.get("/filter", Transaction.getTransactionBy);
router.post("/", Transaction.createTransaction);
router.get("/:id", Transaction.getTransactionById);
// router.delete("/delete", Transaction.deleteAllTransaction)
router.delete("/delete/:id", Transaction.deleteTransactionById)

module.exports = router;