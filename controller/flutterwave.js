const axios = require("axios");
const transaction = require("../controller/transactions")
const util = require("../utilities");

require("dotenv").config();

const getBills = async(billType)=>{
    if(!billType){
        return false;
    }
    if (billType !== 'airtime' && billType !== "data"){
        return false
    }
    let params = billType+"=1";
    //https://api.flutterwave.com/v3/bill-categories?airtime=1
    let url = `https://api.flutterwave.com/v3/bill-categories?${params}`;
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
    }
    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            let bills = response.data.data
            return bills;
        }


    } catch (error) {
        console.log(error);
        return false
    }
}

//returns networkname
const validatePhonenumber =async(phoneno)=>{
    if(!phoneno){
        return false
    }

    let url = `https://api.flutterwave.com/v3/bill-items/AT099/validate?code=BIL099&&customer=${phoneno}`
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
        // data
    }

    try {
        const response = await axios(options);
        console.log(response.data);
        if (response.data.status == "success"){
            //return payment link and redirect user there
            console.log("data", response.data.data);
           let  networkName = response.data.data.name
            return networkName
        }

    } catch (error) {
        console.log(error);
        return false
    }

}

//pay for survey or analysis
exports.makePayment= async(req, res)=>{
    let allowedCurrency =  ["NGN",'KES', "MWK", "MAD", "GHS",'UGX', 'TZS', 'USD', "ZAR"]
    // let allowedCountry = ['NG', 'GH', 'KE', 'UG', 'ZA','TZ']
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    let {amount,name,userid, email, phoneno, description, currency} = req.body
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
    
    //generate unique tnx_ref
    //fetch customer details from db
    //create transaction record with status pending
    currency = (currency && allowedCurrency.includes(currency.toUpperCase()) )? currency.toUpperCase() : allowedCurrency[0]
    
    let ref = util.generateUniqueTnxRef();
    let transRef = await transaction.createTransaction({
        user_id: userid,
        amount: amount,
        tnx_ref: ref,
        transactionType: "Payment",
        paymentMethod: '',
        paymentProvider: "Flutterwave",
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
    console.log("trans ref= ",transRef);
    let redirect_url = process.env.PAYMENT_REDIRECT_URL || "http://localhost:2000/pay/verify";
    //get customer details from authourization
    const url = process.env.FW_PAYMENT_URL || "https://api.flutterwave.com/v3/payments"
    let data = {
        tx_ref: ref,
        amount: amount,
        currency: currency,
        redirect_url: redirect_url,
        customer: {
            email: email,
            phonenumber: phoneno,
            name: name
        },
        customizations: {
            title: "Research Gains Survey",
            logo: process.env.APP_LOGO || "http://www.piedpiper.com/app/themes/joystick-v27/images/logo.png"
        }
    }

    const options = {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
        data
    }

    try {
        const response = await axios(options);
        console.log(response.data);
        if (response.data.status == "success"){
            //return payment link and redirect user there
            console.log("payment link", response.data.data.link);
            return res.status(200).json({
                status: true,
                paymentlink: response.data.data.link
            })
        }
        //else return issue with flutterwave response

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

exports.verifyPayment = async(req, res)=>{
    // const {status, transaction_id, tx_ref} = req.query
    const {transaction_id, status, tx_ref}= req.query


    console.log("transaction_id= ", transaction_id);
    //fetch tx_ref from transactions database
    //get useremail, amount, for verification
    // status=successful&tx_ref=IVLJM1675478918042&transaction_id=4132861
    if(!transaction_id && status !== 'successful'){
        //payment canceled
        return res.status(200).json({
            status: false,  
            message: "Payment Cancealed, proceed to make payment"
        })
    }
    if(status === 'failed'){
        //payment canceled
        return res.status(200).json({
            status: false,  
            message: "Payment failed, try again"
        })
    }

    //get api_ref from transaction reference
    let transactionDetails = await transaction.getOneTransaction({tnx_ref: tx_ref})
    if(!transactionDetails){
        return res.status(404).json({ 
            status: false,      
            message: "transaction with refrence not found"
        })
    }

    
    let url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
    }

    try {
        const response = await axios(options);
        const { status, currency, id, amount, customer, tx_ref, payment_type, amount_settled } = response.data.data;
        if (payment_type == "card"){
            // you might want to save card details
            let userCardDetails = response.data.data.card;
        }

        if (status == "success" && amount === transactionDetails.amount){
            //get payment details
            //update db set status to success
            //get and verify if tx_ref exist in db(select * from transactios where tnx_ref = tx_ref && savedAmount == amount_settled )
            //if exist confirm the amount
            let updateObject = {
                paymentStatus: status,
                paymentMethod: payment_type,

            }

            if(status == "PAID" || status == "OVERPAID"){
                updateObject.status = "Success"
            }else if(status == "PARTIALLY_PAID" || status == "PENDING"){
                updateObject.status = "Pending"
            }else{
                updateObject.status = "Failed"
            }

            return res.status(200).json({
                status: true,
                message: "Payment Successful"
            })
        }else{
            return res.status(500).json({message: "Error with flutterwave"})
        }
        //else payment not successful

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

exports.getFlutterBanks = async(req, res)=>{
    //get couuntry from ip or anywhere sha
    let country = ['NG', 'GH', 'KE', 'UG', 'ZA','TZ']
    let url = `https://api.flutterwave.com/v3/banks/${country[0]}`;
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
    }

    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            let banks = response.data.data
            return res.status(200).json({
                status: true,
                banks: banks,
                message: "bank retrieved"
            })
        }

        // {
        //     "id": 177,
        //     "code": "058",
        //     "name": "GTBank Plc"
        // },
        

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

exports.verifyBankAccount = async(req, res)=>{
    //validate reqBody
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }

    const {account_number, account_bank}= req.body;
    const data ={
        account_number: account_number,
        account_bank: account_bank
    }

    let url = `https://api.flutterwave.com/v3/accounts/resolve`;
    const options = {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
        data
    }
    console.log({input: data});

    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            //check if user fullname == account name
            return res.status(200).json({
                status: true,
                accountNumber : account_number,
                accountName: response.data.data.account_name,
                message: "bank retrieved"
            })
        }
        // else{
        //     return res.status(200).json({
        //         message: response.data.data.message
        //     });
        // }
        

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

//transfer funds to user
exports.transferFund = async(req, res)=>{
    //validate reqBody
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    const {account_number, account_bank, amount, currency}= req.body;

    let country =  ['KES', "MWK", "MAD", "GHS","NGN",'UGX', 'TZS', 'USD', "ZAR"]
    currency = currency.toUpperCase()
    if(currency && !country.includes(currency)){
        return res.status(400).json({
            message: "Pass in valid currency"
        })
    }
    currency = (currency)? currency: "NGN";
    //person.hasOwnProperty('firstName');

    const timeNow = Date.now()
    let tnx_ref = "FLW"+timeNow;

    let url = `https://api.flutterwave.com/v3/transfers`;
    const data = {
        account_bank: account_bank,
        account_number: account_number,
        amount: amount,
        currency: currency || "NGN",
        narration: "Withraw From Reaserch Gains",
        // reference: generateTransactionReference(),
        reference: tnx_ref
    }
    const options = {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
        data: data
    }
    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            //use transaction id to verify from paystack
            console.log(response.data);
            return res.status(200).json({
                accountNumber : account_number,
                accountName: response.data.data.full_name,
                amount: response.data.data.amount,
                reference: response.data.data.reference,
                status: response.data.data.status,
                message: response.data.message,
                status_message: response.data.data.complete_message,
                transaction_id: response.data.data.id
            })
        }else{
            return res.status(200).json({
                status: true,
                message: response.data.data.message
            });
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

exports.getAirtimeBills = async(req, res)=>{
    let allowedCountry = ['NG', 'GH', 'KE', 'UG', 'ZA','TZ']
    let country = (req.query.country && allowedCountry.includes(req.query.country.toUpperCase()) )? req.query.county.toUpperCase() : allowedCountry[0]
    let url = `https://api.flutterwave.com/v3/bill-categories?airtime=1&country=${country}`;
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
    }
    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            let bills = response.data.data
            let plans = [];
            if(bills){
                bills.forEach(element => {
                    // console.log(element.biller_name);
                    plans.push({
                        name: element.name,
                        billerCode: element.biller_code,
                        billerName: element.biller_name,
                        itemCode: element.item_code,
                        amount: element.amount,
                    });
                });
            }        
            return res.status(200).json({status: true,
                bills: plans,
                message: "bill retrieved"
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

exports.getDataBills = async(req, res)=>{
    let network = (req.query.network)?req.query.network.toUpperCase():'';
    console.log(network);
    if(network !== "MTN" && network !=="GLO" && network !== "AIRTEL" && network !== "9MOBILE" && network !== "ETISALAT"){
        res.status(400).json({
            message: "Invalid network passed"
        })
        return
    }
    let billerCode = {
        MTN: "BIL104",
        GLO: "BIL105",
        AIRTEL: "BIL106",
        ETISALAT: "BIL107"
    }
    let allowedCountry = ['NG', 'GH', 'KE', 'UG', 'ZA','TZ']
    let country = (req.query.country && allowedCountry.includes(req.query.country.toUpperCase()) )? req.query.country.toUpperCase() : allowedCountry[0]
    let networkCode = ''
    if(network == "MTN"){
        networkCode = "&biller_code="+billerCode.MTN;
    }
    if(network == "GLO"){
        networkCode = `&biller_code=${billerCode.GLO}`;
    }
    if(network == "AIRTEL"){
        networkCode = `&biller_code=${billerCode.AIRTEL}`;
    }
    if(network == "9MOBILE" || network == "ETISALAT"){
        networkCode = `&biller_code=${billerCode.ETISALAT}`;
    }
    let url = `https://api.flutterwave.com/v3/bill-categories?data_bundle=1&country=${country}${networkCode}`;
    console.log(url);
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
    }
    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            let bills = response.data.data
            let details = {};
            let plans = []
            if(bills){
                bills.forEach(element => {
                    // console.log(element.biller_name);
                    plans.push({
                        billerCode: element.biller_code,
                        billerName: element.biller_name,
                        name: element.name,
                        itemCode: element.item_code,
                        amount: element.amount,
                    });
                });
            }           

            // console.log(plans);
            return res.status(200).json({
                status: true,
                bills: (bills)? plans: "no dataplan found",
                message: "bills retrieved"
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

exports.validatePhonenumber =async(req, res)=>{
    if(!req.query){
        return res.status(400).json({
            message: "pass in parameter"
        })
    }
    if(!req.query.phoneno){
        return res.status(400).json({
            message: "Pass in phone number"
        })
    }

    let phoneno = req.query.phoneno;

    let url = `https://api.flutterwave.com/v3/bill-items/AT099/validate?code=BIL099&&customer=${phoneno}`
    const options = {
        method: "GET",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
        // data
    }

    try {
        const response = await axios(options);
        console.log(response.data);
        if (response.data.status == "success"){
            //return payment link and redirect user there
            console.log("data", response.data.data);
            //networkName = response.data.data.name
            return res.status(200).json({
                status: true,
                data: response.data.data
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

exports.buyData = async(req, res)=>{
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    let {phoneno, amount,type, country} = req.body
    let allowedCountry = ['NG', 'GH', 'KE', 'UG', 'ZA','TZ']
    country = (country && allowedCountry.includes(country.toUpperCase()) )? country.toUpperCase() : allowedCountry[0]
    if(!amount || !phoneno){
        res.status(400).json({
            message: "All field must be passed"
        })
        return
    }
    //validate phone number
    let validPhoneno = await validatePhonenumber(phoneno)
    if(!validPhoneno){
        return res.status(400).json({
            status: false,
            message: "Invalid Phone no."
        })
    }
    let url = `https://api.flutterwave.com/v3/bills`;
    let ref = util.generateUniqueTnxRef();
    //billername and type=>getbillsdate bllerName & name
    const data = {
        "amount": amount,
        // "biller_name": "MTN 50 MB",
        "country": country,
        "customer": phoneno,
        "package_data": "DATA",
        "recurrence": "ONCE",
        "reference": ref,
        "type": type
    };
    console.log(data);
    const options = {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
        data: data
    }
    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            //use transaction id to verify from paystack
            console.log(response.data);
            return res.status(200).json({
                status: true,
                data: response.data.data
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

exports.buyAirtime = async(req, res)=>{
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    let {phoneno, amount,type, country} = req.body
    let allowedCountry = ['NG', 'GH', 'KE', 'UG', 'ZA','TZ']
    country = (country && allowedCountry.includes(country.toUpperCase()) )? country.toUpperCase() : allowedCountry[0]
    if(!amount || !phoneno){
        res.status(400).json({
            message: "All field must be passed"
        })
        return
    }
    let validPhoneno = await validatePhonenumber(phoneno)
    if(!validPhoneno){
        return res.status(400).json({
            status: false,
            message: "Invalid Phone no."
        })
    }
    let url = `https://api.flutterwave.com/v3/bills`;
    let ref = util.generateUniqueTnxRef();
    //billername and type=>getbillsdate bllerName & name
    const data = {
        "amount": amount,
        // "biller_name": "MTN 50 MB",
        "country": country,
        "customer": phoneno,
        "package_data": "DATA",
        "recurrence": "ONCE",
        "reference": ref,
        "type": type
    };
    console.log(data);
    const options = {
        method: "POST",
        headers: { 
            Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
        },
        url,
        data: data
    }
    try {
        const response = await axios(options);
        if (response.data.status == "success"){
            //use transaction id to verify from paystack
            console.log(response.data);
            return res.status(200).json({
                status: true,
                data: response.data.data
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





//call verify endpoint maybe every 30mins to verify payment and update status to paid







// const makePayment= async()=>{
//     //generate unique tnx_ref
//     //fetch customer details from db
//     //create transaction record with status pending
//     const timeNow = Date.now()
//     let tnx_ref = "flw"+timeNow;
//     console.log("paymentref",tnx_ref);
//         const url = "https://api.flutterwave.com/v3/payments"
//         let data = {
//             tx_ref: tnx_ref,
//             amount: "100",
//             currency: "NGN",
//             redirect_url: "http://localhost:5000/pay/verify",
//             customer: {
//                 email: "user@gmail.com",
//                 phonenumber: "080****4528",
//                 name: "Yemi Desola"
//             },
//             customizations: {
//                 title: "Pied Piper Payments",
//                 logo: "http://www.piedpiper.com/app/themes/joystick-v27/images/logo.png"
//             }
//         }

//         const options = {
//             method: "POST",
//             headers: { 
//                 Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY_TEST}`
//             },
//             url,
//             data
//         }

//         try {
//             const response = await axios(options);
//             console.log(response.data);
//             if (response.data.status == "success"){
//                 //return payment link and redirect user there
//                 console.log("payment link", response.data.data.link);
//                 return {paymentlink: response.data.data.link}
//             }
//             //else return issue with flutterwave response

//         } catch (err) {
//             console.log(err);
//         }

// }

// console.log(makePayment());
