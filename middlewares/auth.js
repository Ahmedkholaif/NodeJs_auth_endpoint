const User = require('../models/User');

const authenticate = (req,res,next )=> {
    const token =req.header('auth-token');

    if(token){
        User.findByToken(token)
        .then(user=>{
            if(!user){
                return Promise.reject();
            }else {
                req.token=token;
            req.user = user;
            next();
            }
        })
        .catch((e)=>{
            return res.status(400).send({
                error:"Authentication Failed"
            });
        });
    }else {
        return res.status(400).json({error:"Authentication failed"})
    }
}

module.exports={
    authenticate,
}