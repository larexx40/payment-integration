const User = require("../model/users");

const isExist = async(field, value)=>{
  let row =  await User.query().findOne("email", email)
  return row
}

exports.createUser = async (req, res ) => {  
    try {
        const {email, firstName, lastName, age}= req.body;
        console.log({
            email: email,
            firstName: firstName
        });
        let isUserExist = await User.query().select('user_id').where("email", email);
        if (isUserExist.length > 0) {
            console.log("Email Exist")
            res.status(400).json({
                message: "email already exist"
            });
            return
        }
        console.log("Proceed to create")
        let insetUser = await User.query().insert({
            email: email,
            firstName: firstName,
            lastName: lastName,
            age: age
        })

        if(insetUser){
            console.log("User registered!")
            res.status(400).json({
                message: "User registerd"
            });
            return
        }
        
    } catch (err) {
        console.log(err);
        res.json(err)
        
    }
    

};

exports.getAllUser = async (req, res)=>{
    try {
        let result = await User.query();
        res.status(200).json(result);
        return
        
    } catch (err) {
        console.log(err);
        res.send(err)
        
    }
}

exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id
        let result = await User.query().update({
            email: email,
            firstName: firstName,
            lastName: lastName,
            age: age
        }).where("id", userId)
        if(result) {
            res.status(200).json({
                message: "User Updated"
            })
            return
        }
        res.status(200).json({
            message: `User with id: ${userId} not found`
        })
        return;
    } catch (err) {
        console.log(err);
        res.send(err)
        
    }
    
};
  
exports.getUserById = async (req, res ) => {
    try {
        const userId = req.params.id
        //customers`.`id` = '2'
        let result = await User.query().where({user_id: userId});
        if(result.length > 0) {
            res.status(200).json(result)
            console.log({message: "Customer retrieved", result});
            return
        }
        return res.status(200).json({ "Sorry": `user with id: ${userId} not found` })
            
        
    return res.status(200).json(result);
    } catch (err) {
        //catch all the error esponse
        console.log(err);
        res.send(err)
        
    }
    
};

exports.getUserByEmail = async (req, res) => {
    try {
        user_id = User.query().select().where('id')
        const user_id = jwt.verify(req.params.token, process.env.JWT_SECRET)
        await User.query().update({isEmailConfirmed: true}).where({user_id})
    } catch (err) {
        res.send('err')
    }
}

exports.deleteUserById = async(req, res)=>{
    try {
        const userId = req.params.id
        let result = await User.query().deleteById(userId)
        if (result == 0) return res.status(404).json({"message": `User with id: ${userId} not found`})
        return res.status(200).json({
            message: "user Deleted"
        })
        console.log(result);
        
    } catch (err) {
        console.log(err);
        res.send(err)
        
    }

}

exports.deleteAllUser = async(req, res)=>{
    try {
        let result = await User.query().delete()
        if(result) return res.status(200).json({
            message: "User Card Deleted"
        })
        
    } catch (err) {
        console.log(err);
        res.send(err)
        
    }
    
    
}

exports.checkIfExist = async(field, value)=>{
    let result = await User.query().where({field: value});
    if(result.length > 0){
        return true;
    }
    return false;
}

