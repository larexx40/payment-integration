const axios = require("axios")

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

// console.log("oaut2=",getAuthToken());

exports.initializePayment = async(req, res)=>{
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    let {amount,name, email, description} = req.body
    if(!amount || !name ||!email){
        res.status(400).json({
            message: "All field must be passed"
        })
        return
    }
    let redirect_url = process.env.PAYMENT_REDIRECT_URL || "http://localhost:2000/pay/verify";
    const timeNow = Date.now()
    let tnx_ref = "MON"+timeNow;
    let url = process.env.MONNIFY_BASE_URL + process.env.MONNIFY_PAYMENT_ENDPOINT;

    //get oauth2 token
    const accessToken = await getAuthToken();
    const data = {
        "amount": amount,
        "customerName": name,
        "customerEmail": email,
        "paymentReference": tnx_ref,
        "paymentDescription": description || "Research Gain Payment",
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
        const { responseBody } = response.data;
    
        // return res.status(200).json(responseBody)

        if(response.data.requestSuccessful){
            return res.status(200).json({
                paymentlink: response.data.checkoutUrl,
                tnx_ref: response.data.paymentReference
            })
        }
        
    } catch (error) {
        console.log(error);
        // return res.status(500).json(error)
    }
    
}

exports.initializeTransfer = async(req, res)=>{
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    let {amount,destinationAccountNumber, destinationAccountName, destinationBankCode, narration} = req.body
    
    if(!amount || !destinationAccountName ||!destinationAccountNumber || !destinationBankCode){
        res.status(400).json({
            message: "All field must be passed"
        })
        return
    }
    let redirect_url = process.env.PAYMENT_REDIRECT_URL || "http://localhost:2000/pay/verify";
    const timeNow = Date.now()
    let tnx_ref = "MON"+timeNow;
    let url = process.env.MONNIFY_BASE_URL + process.env.MONNIFY_TRANSFER_ENDPOINT;
    //get oauth2 token
    const accessToken = await getAuthToken();
    const data = {
        "amount": amount,
        "destinationAccountName": destinationAccountName,
        "destinationAccountNumber": destinationAccountNumber,
        "destinationBankCode": destinationBankCode,
        "reference": tnx_ref,
        "narration": narration || "Transfer From Research Gain",
        "currency": "NGN",
        "sourceAccountNumber": process.env.MONNIFY_TRANSFER_ACCNO
    }

    // {
    //     "amount": 20,
    //     "reference":"ben9-jlo00hdhdjjdfjoj--i",
    //     "narration":"Test01",
    //     "destinationBankCode": "057",
    //     "destinationAccountNumber": "2085096393",
    //     "currency": "NGN",
    //     "sourceAccountNumber": "8016472829",
    //     "destinationAccountName": "Marvelous Benji"
    // }

      
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
    
        return res.status(200).json(responseBody)

        // if(response.data.requestSuccessful){
        //     return res.status(200).json({
        //         paymentlink: response.data.checkoutUrl
        //     })
        // }
        
    } catch (error) {
        console.log(error);
        // return res.status(500).json(error)
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
        console.log(error);
        return res.status(500).json({
            message: "error connecting to api"
        })
    }

}



exports.handleWebhook = async(req, res)=>{
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