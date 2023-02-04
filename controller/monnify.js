const axios = require("axios")
const transaction = require("../controller/transactions")
const util = require("../utilities");

require("dotenv").config();



const getAuthToken = async()=>{
    //get feom somewhere if not expired, maybe from cache
    //it expire after 40mins
    const apiKey = process.env.MONNIFY_APIKEY;
    const secretKey = process.env.MONNIFY_SECRET_KEY;
    const baseUrl = process.env.MONNIFY_BASE_URL ||  "https://sandbox.monnify.com";
    // const apiAuthKey = Buffer.from("kdjhvjksdhvuihsduih:jhdjskhjhsdhjgfjhsd").toString("base64")
    const apiAuthKey = Buffer.from(apiKey + ':' + secretKey).toString("base64")

    const url = baseUrl + '/api/v1/auth/login'

    const options = {
        method: "POST",
        headers: { 
            Authorization: `Basic ${apiAuthKey}`
            // Authorization: "Bearer FLWPUBK_TEST-SANDBOXDEMOKEY-X",
        },
        url,
        data: ''
    }

    try {
        const response = await axios(options);
        if(response.data.requestSuccessful){
            const { accessToken, expiresIn } = response.data.responseBody;
            // console.log(accessToken);
            //save somewhere maybe cache
            return accessToken
        }
    } catch (error) {
        console.log(error);
        return {
            message: error.data,
        }
    }
    


}

const validateBankAccount = async(accno, bankcode)=>{
    
    let url = process.env.MONNIFY_BASE_URL +`/api/v1/disbursements/account/validate?accountNumber=${accno}&bankCode=${bankcode}`;
    //fetch token somewhere check expiry
    //if expire then call getAuthToken()
    const accessToken = await getAuthToken();
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${accessToken}`
        },
        url,
    }

    try {
        const response = await axios(options);
        if (response.data.requestSuccessful){
            let bankDetails = response.data.responseBody
            return bankDetails
        }else{
            return false
        }
        

    } catch (error) {
        console.log(error.response);
        // if(error.response.status == 404){
        //     return res.status(404).json({
        //         message: error.response.data
        //     })
        // }
        // if(error.response.status == 500){
        //     return res.status(404).json({
        //         message: "Unable to connect to payment Api"
        //     })
        // }
        // return res.status(500).json({
        //     message: "error connecting to api",
        //     error: error.response.data
        // })
        return false;

    }

}

// console.log("oaut2=",getAuthToken());

//for deposit
exports.initializePayment = async(req, res)=>{
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    let {amount,name,userid, email, description} = req.body
    //validate amount
    amount = parseInt(amount)
    if(!(amount > 0)){
        return res.status(400).json({
            message: "pass in a valid amount"
        })
    }
    if(!amount || !name ||!email){
        res.status(400).json({
            message: "All field must be passed"
        })
        return
    }
    //create transaction record
    let ref = util.generateUniqueTnxRef();
    let transRef = await transaction.createTransaction({
        user_id: userid,
        amount: amount,
        tnx_ref: ref,
        transactionType: "Payment",
        paymentMethod: '',
        paymentProvider: "Monnify",
        status: 'Pending',
        paymentStatus: '',
        description: description,
    })
    if(!transRef){
        res.status(500).json({
            message: "Error with DB server, unable to create transaction"
        })
        return
    }

    let redirect_url = process.env.PAYMENT_REDIRECT_URL || "http://localhost:2000/verify_payment/monnify";
    let url = process.env.MONNIFY_BASE_URL + process.env.MONNIFY_PAYMENT_ENDPOINT;

    //get oauth2 token from cache or from monify itself
    const accessToken = await getAuthToken();
    const data = {
        "amount": amount,
        "customerName": name,
        "customerEmail": email,
        "paymentReference": transRef,
        "paymentDescription": (description)? description : "Research Gain Payment",
        "currencyCode": "NGN",
        "contractCode": process.env.MONNIFY_CONTRACT_CODE,
        "redirectUrl": redirect_url,
        "paymentMethods":["CARD","ACCOUNT_TRANSFER"]
    }
  
    const options = {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${accessToken}`
        },
        url,
        data
    }
    try {
        const response = await axios(options)
        console.log(response.data);
        if(response.data.requestSuccessful){
            //update transactions with api_ref
            const api_ref = response.data.responseBody.transactionReference;
            const updateTransaction = await transaction.updateTransaction({api_ref: api_ref}, "tnx_ref", transRef)
            if(!updateTransaction){
                res.status(500).json({
                    message: "Error with DB server, unable to create transaction"
                })
                return
            }
            return res.status(200).json({
                paymentlink: response.data.responseBody.checkoutUrl,
                tnx_ref: response.data.responseBody.paymentReference
            })
        }
        
    } catch (error) {
        console.log(error);
        return res.status(error.response.status).json({
            status: false,
            data :error.response.data,
            message: error.response.statusText,
            statusCode :error.response.status
        })
    }
    
}
//verify the payment
exports.verifyTRansaction = async(req, res)=>{
    if(Object.keys(req.query).length === 0 ){
        res.status(400).json({
            message: "Transaction ref must be passed"
        })
        return
    }
    const {transactionReference} = req.query;
    if(!transactionReference){
        return res.status(200).json({
            message: "Transaction ref must be passed"
        })
    }
    console.log("transactionReference= ", transactionReference);
    //get api_ref from transaction reference
    let transactionDetails = await transaction.getOneTransaction({tnx_ref: transactionReference})
    if(!transactionDetails){
        return res.status(404).json({       
            message: "transaction with refrence not found, redirect to checkout url"
        })
    }
    const api_ref = transactionDetails.api_ref;
    let encodeRef = encodeURI(api_ref)
    console.log("api_ref = ", api_ref);
    console.log("encodeRef = ", encodeRef);

    let url = process.env.MONNIFY_BASE_URL + process.env.MONNIFY_VERIFY_TRANSACTIONS_ENDPOINT +`${encodeRef}`;
    console.log(url);
    const accessToken = await getAuthToken();

    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${accessToken}`,
            "Content-type": "application/json"
        },
        url,
    }

    try {
        const response = await axios(options);
        console.log(response.data.responseBody);
        if(response.data.requestSuccessful){
            const { transactionReference, paymentReference, amountPaid, settlementAmount, paymentStatus, paymentMethod, payment_type, customer } = response.data.responseBody;
            //status = PAID, OVERPAID, PARTIALLY_PAID, PENDING, ABANDONED, CANCELLED, FAILED, REVERSED, EXPIRED
            if(paymentMethod == "CARD"){
                //wonna save card details for future sake
            }
            //update db status (paymentReference = tnx_ref) (api_ref = transactionReference:)
            let updateObject = {
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod,

            }
            
            if(paymentStatus == "PAID" || paymentStatus == "OVERPAID"){
                updateObject.status = "Success"
            }else if(paymentStatus == "PARTIALLY_PAID" || paymentStatus == "PENDING"){
                updateObject.status = "Pending"
            }else{
                updateObject.status = "Failed"
            }
            let updateTnxStatus = await transaction.updateTransaction(updateObject,"api_ref", transactionReference)
            return res.status(200).json({
                paymentStatus: paymentStatus ,
                paymentMethod: paymentMethod, 
                payment_type: payment_type,
                settlementAmount: settlementAmount,
                customer: customer
            });

        }
        return false;

    } catch (error) {
        console.log(error);
        return res.status(error.response.status).json({
            status: false,
            data :error.response.data,
            message: error.response.statusText,
            statusCode :error.response.status
        })
    }

}

//for withraw
exports.initializeTransfer = async(req, res)=>{
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    let {userid, amount,accountNo, bankCode, narration} = req.body
    
    if(!amount || !userid ||!accountNo || !bankCode){
        res.status(400).json({
            message: "All field must be passed"
        })
        return
    }
    //verify bank
    let validBank = await validateBankAccount(accountNo, bankCode)
    if(!validBank){
        return res.status(400).json({
            message: "Invalid account passed",
        })
    }
    console.log("Valid bank proceed to create transaction", validBank);
    let accountName = validBank.accountName;
    //create transaction record in DB
    let ref = util.generateUniqueTnxRef();
    let transRef = await transaction.createTransaction({
        user_id: userid,
        accountNo: accountNo,
        accountName: accountName,
        amount: amount,
        tnx_ref: ref,
        transactionType: "Withdraw",
        paymentMethod: '',
        paymentProvider: "Monnify",
        status: 'Pending',
        paymentStatus: '',
        description: narration,
    })
    if(!transRef){
        res.status(500).json({
            message: "Error with DB server, unable to create transaction"
        })
        return
    }
    console.log("trans ref= ",transRef);

    let url = process.env.MONNIFY_BASE_URL + process.env.MONNIFY_TRANSFER_ENDPOINT;
    //get oauth2 token
    const accessToken = await getAuthToken();
    const data = {
        "amount": amount,
        "destinationAccountName": accountName,
        "destinationAccountNumber": accountNo,
        "destinationBankCode": bankCode,
        "reference": transRef,
        "narration": narration || "Transfer From Research Gain",
        "currency": "NGN",
        "sourceAccountNumber": process.env.MONNIFY_TRANSFER_ACCNO
    }
      
    const options = {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${accessToken}`
        },
        url,
        data
    }
    try {
        const response = await axios(options)
        const { responseBody } = response.data;
        console.log(responseBody);
        //update db with the transaction status
        let updateStatus = await transaction.updateTransaction({paymentStatus: responseBody.status},"tnx_ref", transRef)
    
        return res.status(200).json(responseBody)
        
    } catch (error) {
        console.log(error);
        return res.status(error.response.status).json({
            status: false,
            data :error.response.data,
            message: error.response.statusText,
            statusCode :error.response.status
        })
    }
    
}

exports.verifyTransfer = async(req, res)=>{
    if(Object.keys(req.query).length === 0 ){
        res.status(400).json({
            message: "Transaction ref must be passed"
        })
        return
    }
    const {transactionReference} = req.query;
    if(!transactionReference){
        return res.status(200).json({
            message: "Transaction ref must be passed"
        })
    }

    let url = process.env.MONNIFY_BASE_URL + process.env.MONNIFY_TRANSFER_ENDPOINT + `/summary?reference=${transactionReference}`;
    
    const accessToken = await getAuthToken();

    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${accessToken}`,
            "Content-type": "application/json"
        },
        url,
    }

    try {
        const response = await axios(options);
        console.log(response.data.responseBody);
        if(response.data.requestSuccessful){
            const { apiTransactionReference, paymentReference, amountPaid, settlementAmount, status, paymentMethod, payment_type, customer } = response.data.responseBody;
            //status = SUCCESS, FAILED, PENDING, OTP_EMAIL_DISPATCH_FAILED, PENDING_AUTHORIZATION
            if(paymentMethod == "CARD"){
                //wonna save card details for future sake
            }
            //update db status (paymentReference = tnx_ref) (api_ref = transactionReference:)
            let updateObject = {
                paymentStatus: status,
                paymentMethod: paymentMethod,

            }
            if(status == "SUCCESS"){
                updateObject.status = "Success"
            }else if(status == "PENDING" || status == "PENDING_AUTHORIZATION"){
                updateObject.status = "Pending"
            }else{
                updateObject.status = "Failed"
            }
            console.log(transactionReference);
            let updateTnxStatus = await transaction.updateTransaction(updateObject,"tnx_ref", transactionReference)
            console.log("updated", updateTnxStatus);
            return res.status(200).json({
                status: true,
                reqBody: response.data.responseBody,
                // paymentStatus: paymentStatus ,
                // paymentMethod: paymentMethod, 
                // payment_type: payment_type,
                // settlementAmount: settlementAmount,
                // customer: customer
            });

        }
        return false;

    } catch (error) {
        console.log(error);
        return res.status(error.response.status).json({
            status: false,
            data :error.response.data,
            message: error.response.statusText,
             statusCode :error.response.status
        })
    }

}

exports.getBanks = async(req, res)=>{
    let url = process.env.MONNIFY_BASE_URL +"/api/v1/banks";
    //fetch token somewhere check expiry
    //if expire then call getAuthToken()
    const accessToken = await getAuthToken();
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${accessToken}`
        },
        url,
    }

    try {
        const response = await axios(options);
        if (response.data.requestSuccessful){
            let banks = response.data.responseBody
            return res.status(200).json({
                banks: banks,
                message: "bank retrieved"
            })
        }
        

    } catch (error) {
        console.log(error);
        // return res.status(500).json(error)
    }

}

exports.verifyBankAccount = async(req, res)=>{
    if(Object.keys(req.query).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    const {accountNumber, bankCode} = req.query;
    if(!accountNumber || !bankCode){
        return res.status(200).json({
            message: "all fields must be passed"
        })
    }
    let url = process.env.MONNIFY_BASE_URL +`/api/v1/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`;
    //fetch token somewhere check expiry
    //if expire then call getAuthToken()
    const accessToken = await getAuthToken();
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${accessToken}`
        },
        url,
    }

    try {
        const response = await axios(options);
        if (response.data.requestSuccessful){
            let banks = response.data.responseBody
            return res.status(200).json({
                bankDetails: banks,
                message: "Bank account validated"
            })
        }else{
            return res.status(400).json({
                message: "Invalid bank "
            })
        }
        

    } catch (error) {
        console.log(error.response.data);
        if(error.response.status == 404){
            return res.status(404).json({
                message: error.response.data
            })
        }
        if(error.response.status == 500){
            return res.status(404).json({
                message: "Unable to connect to payment Api"
            })
        }
        return res.status(500).json({
            message: "error connecting to api",
            error: error.response.data
        })

    }

}

exports.handleWebhook = async(req, res)=>{
    //so as to avoid repeatedly sending this particular notification
    // res.status(200);

    const webhookData = req.body
    //get payment reference
    //fetch db by paymentReference
    //if paymentStatus == "PAID"
    //update db change status to paid
    /***
     * paymentReference: 'MON1673704426015'
     * paidOn: '2023-01-14 14:54:42.301
     * destinationAccountInformation: {
      bankCode: '035',
      bankName: 'Wema bank',
      accountNumber: '5000343968'
      paymentMethod: 'CARD',
    currency: 'NGN',
    settlementAmount: '490.00',
    paymentStatus: 'PAID',

    }
     */
    console.log(webhookData);  
    return res.status(200).json(webhookData)
}