const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const validator  = require('validator');
const keys = require('../config/keys');


const userSchema = new mongoose.Schema({
    
    "first_name": {
        type: "string",
        required: true
    },
    "last_name": {
        type: "string",
        required: true
    },
    "country_code":{
        type:"string"
    },
    "phone_number": {
        type: String,
        // validate: {
        // validator: function(phone) {
        //     return /^01[0|1|2|5]\d{8}$/.test(phone);
        // },
        // message: props => `${props.value} is not a valid phone number!`
        // },
        required: [true, 'User phone number required']
    },
    "gender":{
        type:"string"
    },
    "birth_date":{
        type:"string"
    },
    "password":{
        type:"string",required:true,minlength:6
    }
    ,
    "avatar":{
        type:"string"
    },
    "email": {
        type: "string",
        validate:{
            validator: validator.isEmail,
            error:`not a valid email`
        }
    },
    "tokens":[{
        access:{
            type:"string",required:true
        },
        token:{
            type:"string",required:true
        }
    }]
});

//mongo middleware --password encryption
userSchema.pre('save',function (next){  // middleware
    let user = this ;
    if(user.isModified('password')) {
        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(user.password,salt,(err,hash)=>{
                user.password=hash;
                next();
            })
        })
    }
    else {
        next();
    }
});

// override the data sent back to the user

userSchema.methods.toJSON =function () {
    const user = this;
    let userObject = user.toObject();

    return _.pick(userObject,['_id','first_name','last_name','country_code','phone_number','gender','birthdate','email']);
}

userSchema.methods.getAuthToken = function () {
    const user =this;
    let access = 'auth';
    const pay_load = {_id: user._id,email:user.email};
    let token =jwt.sign({pay_load,access},keys.secret).toString(); 
    user.tokens.push({access,token});
   
    return user.save()
    .then(()=>{
        return token;
    });
}

userSchema.methods.removeToken = function (token) {
    const user = this;
    return user.updateOne({
        $pull:{
            tokens: {token}
        }
    });
}
userSchema.statics.findByToken = function(token) {
    const User=this;

    let decoded;
    try {
        decoded = jwt.verify(token,keys.secret);
    }catch(e) {
        return Promise.reject();
    }

    return User.findOne({
        '_id':decoded.pay_load._id,
        'tokens.token':token,
        'tokens.access':'auth'
    });
}



const User = new mongoose.model('User', userSchema);

// new User({
//     phone:'01517463682',
// }).save()
// .then(user=>console.log({user}))
// .catch(err=>console.log({err}));

module.exports = User;