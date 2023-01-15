const Transaction = require('./transactions')


exports.createTransaction = async (req, res ) => {  
    //validate reqbody
    try {
        let reqBody = req.body
        const {user_id, amount, }= req.body; 
        const timeNow = Date.now()
        let tnx_ref = "flw"+timeNow;

        reqBody.tnx_ref = tnx_ref;
        console.log({
            user_id: user_id,
            amount: amount,
            tnx_ref: tnx_ref
        });
        
        let addTransaction = await Transaction.query().insert({
             user_id: user_id,
            amount: amount,
            tnx_ref: tnx_ref
        })

        if(addTransaction){
            console.log("Transaction created!")
            res.status(400).json({
                message: "Transaction created!"
            });
            return
        }
        
    } catch (err) {
        console.log(err);
        res.json(err)
        
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
}

exports.updateTransaction = async (req, res) => {
    try {
        //validate reqBody
        let reqBody = req.body;
        const tnx_id = reqBody.tnx_id
        let result = await User.query().update(reqBody).where("tnx_id", tnx_id)
        if(result) {
            res.status(200).json({
                message: "Transaction Updated"
            })
            return
        }
        res.status(200).json({
            message: `Transaction with id: ${tnx_id} not found`
        })
        return;
    } catch (err) {
        console.log(err);
        res.send(err)
        
    }
    
};
  
exports.getTransactionById = async (req, res ) => {
    try {
        const 	tnx_id = req.params.id
        //customers`.`id` = '2'
        let result = await User.query().where({	tnx_id: tnx_id});
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

exports.getTransactionBy = async(field, value) => {
    //always try and validate
    try {
        let result = await User.query().where({	tnx_id: tnx_id});
        if(result.length > 0){  
            res.status(200).json(result);
            return
        }
        res.status(200).json({message: "No transaction found"});
        return
    } catch (err) {
        res.send('err')
    }
}



exports.checkIfExist = async(field, value)=>{
    let result = await User.query().where({field: value});
    if(result.length > 0){
        return true;
    }
    return false;
}