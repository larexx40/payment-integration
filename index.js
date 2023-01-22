const express = require("express");
const flutterwave = require("./route/flutterwave");
const userRouter = require("./route/users");
const transactionRouter = require("./route/transactions")
const monnifyRouter = require("./route/monnify")
const verifyRouter = require("./route/verifyPayment");
const knex = require("./util/database");
const { json } = require("express");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 2000;

// //parse request of content-type = application/json
// app.use(express.json())
// //parse request of content-type = application/x-www-form-urlencoded
// app.use(express.urlencoded({extended: true}))

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//add your router
app.use("/flutterwave", flutterwave)
app.use("/user", userRouter)
app.use("/transaction", transactionRouter)
app.use("/monnify", monnifyRouter)
app.use("/verify_payment", verifyRouter)

app.get("/", (req, res)=>{
    res.json({message: "OK Welcome back to node"})
});

app.get("/larry", (req, res)=>{
    res.json({message: "After long time break, happy to be back"})
});

// app.get("/pay/verify", async  (req, res)=>{
//     const query = req.query;
//     console.log(query);
//     if(!query){
//         return res.status(400).json({
//             message: "Payment canceled"
//         })
//     }
//     const monifyPayRef = query.paymentReference;
//     const flwPayRef = query.transaction_id;
//     if(!monifyPayRef && !flwPayRef){
//         return res.status(400).json({
//             message: "Payment not initiated, it has been canceled"
//         })
//     }
//     if(monifyPayRef){

//         //validate with monnify
//         //fetch apiref from db with parref
//         const verify = await verifyPayment()
//         return res.status(200).json(verify)

//     }
//     return res.json({message: query})
// });

app.listen(port, ()=>{
    console.log(`app running at listening at http://localhost:${port}`);
})
