const axios = require("axios");
const { response } = require("express");

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

//reeturns networkname
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

exports.makePayment= async(req, res)=>{
    if(Object.keys(req.body).length === 0 ){
        res.status(400).json({
            message: "content cannot be empty"
        })
        return
    }
    //generate unique tnx_ref
    //fetch customer details from db
    //create transaction record with status pending
    let {amount, email, phoneno, name} = req.body
    let country =  ['KES', "MWK", "MAD", "GHS","NGN","ZAR"]
    currency = currency.toUpperCase()
    if(currency && !country.includes(currency)){
        return res.status(400).json({
            message: "Pass in valid currency"
        })
    }
    currency = (currency)? currency: "NGN";
    let redirect_url = process.env.PAYMENT_REDIRECT_URL || "http://localhost:5000/pay/verify";
    const timeNow = Date.now()
    let tnx_ref = "FLW"+timeNow;
    //get customer details from authourization
    const url = process.env.FW_PAYMENT_URL || "https://api.flutterwave.com/v3/payments"
    let data = {
        tx_ref: tnx_ref,
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
    const transaction_id = req.query.transaction_id;
    const status = req.query.status;

    console.log("transaction_id= ", transaction_id);
    const tx_ref =req.query.tx_ref
    //fetch tx_ref from transactions database
    //get useremail, amount, for verification
    if(!transaction_id){
        //payment canceled
        return res.status(200).json({
            message: "Payment Cancealed or pass in valid transaction id"
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
        if (response.data.status == "success"){
            //get payment details
            //update db set status to success
            //get and verify if tx_ref exist in db(select * from transactios where tnx_ref = tx_ref && savedAmount == amount_settled )
            //if exist confirm the amount
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
