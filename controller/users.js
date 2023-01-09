const User = require("../model/users");

const isExist = async(field, value)=>{
  let row =  await User.query().findOne("email", email)
  return row
}

exports.createUser = async (req, res ) => {  
    const {email, firstName, lastName,}= req.body;
    let isUserExist = await User.query().findOne("email", email);
    if (isUserExist) {
        console.log("Email Exist")
      return res.status(400).json({
        message: "email already exist"
      });
    }

    let insetUser = await User.query().insert({
        email: email,
        firstName: firstName,
        lastName: lastName,
        age: age
    })

    if(insetUser){
        console.log("User registered!")
        return res.status(400).json({
            message: "User registerd"
        });
    }

};

exports.getAllUser = async (req, res)=>{
    let result = await User.query();
    return res.status(200).json(result);
}

exports.updateUser = async (survey, user, planId) => {
    let result = await User.query()
    return result;
};
  
exports.getUserById = async (userId) => {
    const userId = req.params.id
    let results = await User.query().findById(userId);
    return results;
};

exports.getUserByEmail = async (req, res) => {
    try {
        user_id = User.query().select().where('id')
        const user_id = jwt.verify(req.params.token, process.env.JWT_SECRET)
        await User.query().update({isEmailConfirmed: true}).where({user_id})
    } catch (error) {
        res.send('error')
    }
    console.log("Email successfully verified!")
}

exports.deleteUserById = async(req, res)=>{
    const userId = req.params.id
    let result = await User.query().deleteById(userId)
    if (result) return res.status(200).json({
        message: "user Deleted"
    })
    console.log(result);

}

exports.deleteAllUser = async(req, res)=>{
    let result = await User.query().delete()
    if(result) return res.status(200).json({
        message: "User Card Deleted"
    })
    
}

