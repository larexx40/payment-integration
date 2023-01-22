const Transaction = require('../model/transactions')
const util = require("../utilities");

exports.createTransaction = async (user_id, amount, paymentProvider, paymentType, status, description) => {  
    if(!user_id || !amount || !paymentProvider || !paymentType){
        return false
    }
    let ref = util.generateUniqueTnxRef();
    
    try {
        let addTransaction = await Transaction.query().insert({
            user_id: user_id,
            amount: amount,
            tnx_ref: ref,
            paymentType: paymentType,
            paymentMethod: '',
            paymentProvider: paymentProvider,
            status: status,
            paymentStatus: '',
            description: description,
        })

        if(addTransaction){
            return addTransaction.tnx_ref
        }else{
            console.log("Unable to creat transaction!")
        }
        
    } catch (err) {
        console.log(err);
    }
    

};

exports.getAllTransaction = async (req, res)=>{
    try {
        let result = await Transaction.query();
        if(result.length > 0){  
            res.status(200).json(result);
            return
        }

        res.status(200).json({message: "No transaction found"});
        return
        
    } catch (err) {
        console.log(err);
        res.send(err)
        
    }
};

exports.updateTransaction = async (updateObject, whereField, whereValue) => {
    let result = await Transaction.query().update(updateObject).where(whereField, whereValue)
    if(!result) {
        return false
    }
    return result;
};
  
exports.getTransactionById = async (req, res ) => {
    try {
        const 	tnx_id = req.params.id
        //customers`.`id` = '2'
        let result = await Transaction.query().where({	tnx_id: tnx_id});
        if(result.length > 0) {
            res.status(200).json(result)
            console.log({message: "Transaction retrieved", result});
            return
        }
        return res.status(200).json({ "Sorry": `Transaction with id: ${tnx_id} not found` })
            
    } catch (err) {
        //catch all the error esponse
        console.log(err);
        res.send(err)
        
    }
    
};

exports.getOneTransaction = async(whereObject) => {
        let result = await Transaction.query().findOne(whereObject);
        if(result){  
            return result;
        }
        return false;
};

exports.getTransactionByRef = async(ref) => {
    let result = await Transaction.query().findOne({tnx_ref: ref});
    if(result){  
        return result;
    }
    return false;
};

exports.deleteTransactionById = async(req, res)=>{
    const id = req.params.id;
    if(!id){
        return res.status(400).json({
            message: 'id must be passed'
        })
    }
    try {
        let result=  await Transaction.query().deleteById(id)
    } catch (error) {
        console.log(err);
        return res.send(err)
        
    }
}


exports.checkIfExist = async(field, value)=>{
    let result = await User.query().where({field: value});
    if(result.length > 0){
        return true;
    }
    return false;
}


