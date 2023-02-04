const express = require("express");
const router = express.Router();
const monnify = require("../controller/monnify");
const transaction  = require("../controller/transactions");

router.get("/monnify", async(req, res)=>{
    const query = req.query;
    if(!query){
        return res.status(400).json({
            message: "Payment not initiated, redirect to checkout endpoint "
        })
    }
    const monifyPayRef = query.paymentReference;
    if(!monifyPayRef){
        return res.status(400).json({
            message: "Payment not initiated, it has been canceled, or not paid, redirect to checkout url"
        })
    }
    console.log("ref", monifyPayRef);
    let transactionDetails = await transaction.getOneTransaction({tnx_ref: monifyPayRef})
    if(!transactionDetails){
        return res.status(404).json({       
            message: "transaction with refrence not found, redirect to checkout url"
        })
    }
    const api_ref = transactionDetails.api_ref;
    // const verify = await monnify.verifyTRansaction(api_ref)
    console.log(verify);
    if(verify){
        //update payment status
        //responseBody
        //paymentStatus: =>PAID, OVERPAID, PARTIALLY_PAID, PENDING, ABANDONED, CANCELLED, FAILED, REVERSED, EXPIRED.
        return res.status(200).json(verify)

    }
    return res.json({message: query})
})

router.get("fluterwave/", async(req, res)=>{

})

module.exports = router;

