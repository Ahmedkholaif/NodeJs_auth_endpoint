const moment = require('moment');
const bcrypt = require('bcryptjs');
const validator  = require('validator');

const countryCode = require('country-data').countries;
const del = require('del');
const User = require('../models/User');

const dateFormat = 'YYYY-MM-DD' ;
const createUser = function(req,res){

    const {first_name,last_name,country_code,
        birthdate,phone_number,gender,email,password} = req.body;
    let avatar;
    let errors ={
        first_name:[],
        last_name:[],
        country_code:[],
        birthdate:[],
        phone_number:[],
        gender:[],
        avatar:[],
        email:[],
        password:[],
    };

    //avatar validation
    if(!req.file) {
        errors.avatar=[...errors.avatar,{error:'blank'}];
    }else if (!req.file.originalname.match(/\.(jpg|jpeg|png)$/) && !req.file.mimetype.match(/\/(jpg|jpeg|png)$/) ) {
        del.sync([`${__dirname}/../public/${req.file.filename}`])
        errors.avatar=[...errors.avatar,{error:'invalid content type'}];
    }else{
        delete errors.avatar;
        avatar = `${__dirname}/../public/${req.file.filename}`;
        console.log(avatar);
    }

    //first_name validation
    if(! first_name){
        errors.first_name=[...errors.first_name,{error:'blank'}];
    }else{
        delete errors.first_name;
    }

    //last_name validation
    if(!last_name){
        errors.last_name=[...errors.last_name,{error:'blank'}];
    }else {
        delete errors.last_name;
    }
    
    
    //birthdate validation
    const birthdateform = moment(birthdate).format('YYYY-MM-DD');
    console.log(birthdate);
    if( !birthdate ){
        errors.birthdate = [...errors.birthdate,{error: 'blank'}];
    }else if( ! birthdate.match(/^\d{4}-\d{2}-\d{2}$/) ) {
        errors.birthdate = [...errors.birthdate,{error: 'invalid format',dateFormat}]
    }else if( ! moment(birthdate).isBefore(moment()) || validator.isAfter(birthdate) ){
        errors.birthdate = [...errors.birthdate,{error: 'in the future'}]
    }else {
        delete errors.birthdate;
    }
    
    //country_code validation
    if(! countryCode.hasOwnProperty(country_code.toUpperCase()) ){
        errors.country_code = [...errors.country_code,{error: 'inclusive'}]
    }else{
        delete errors.country_code;
    }
    
    if(! (country_code.toUpperCase() in countryCode) ){
        errors.country_code = [...errors.country_code,{error: 'inclusive22'}]
    }else {
        delete errors.country_code;
    }
    
    //gender validation
    if (! ['male','female'].includes(gender.toLowerCase()) ) {
        errors.gender = [...errors.gender,{error: 'inclusive'}];
    }else {
        delete errors.gender;
    }
    
    //password validation 

    if( password.length < 6){
        errors.password = [...errors.password,{error: 'too short',minimum:6}];
    }else{
        delete errors.password;
    }

    //phone_number validation 
    
    if( ! phone_number){
        errors.phone_number=[...errors.phone_number,{error:'blank'}];
    }else if(! phone_number.match(/^\d*$/)){
        errors.phone_number=[...errors.phone_number,{error:'not a number'}];
    }else if(phone_number.length !== 11) {
        errors.phone_number=[...errors.phone_number,{error:'invalid phone number',count:11}];
    }else if( ! phone_number.match(/^01(0|1|2|5)\d{8}$/) ){
        errors.phone_number=[...errors.phone_number,{error:'invalid'}];
    }else{
        delete errors.phone_number;

    }

    //email validation 

    if ( ! email) {
        errors.email=[...errors.email,{error:'blank'}];
    }else if(! validator.isEmail(email)){
        errors.email=[...errors.email,{error:'Invalid Email'}];
    }else {
        delete errors.email
    }

    //check for errors or proceed
    if (Object.keys(errors).length) 
        return res.status(400).json({errors});
    else {
        User.findOne({phone_number})
        .then( user =>{
            if(user){
                errors.phone_number=[{error:'already taken'}];
                return res.status(400).json({errors});
            } 
            else{
                User.findOne({email})
                .then(user=>{
                    if(user){
                        errors.email=[{error:'already taken'}];
                        return res.status(400).json({errors});
                    }else{
                        //create new user 
                        
                        const user = new User({
                            first_name,
                            last_name,
                            country_code,
                            birthdate,
                            phone_number,
                            gender,
                            email,
                            avatar,
                            password,
                        });
                        user.save()
                        .then(user => {
                            console.log(user);
                            return  res.status(201).json(user);
                        });
                            }
                        })
                    }
        }).catch(err => res.status(404).send({ error:err, err: "Database connection error" }));
    }
    
}


const login = function(req,res){

  const {phone_number,password} = req.body;
  console.log('req.body');
  console.log({phone_number,password});
  if( ! phone_number || ! password)
    return res.status(400).json({errors:'blank phone_number or password'});

  User.findOne({ phone_number })
  .then(user => {
    if (!user) {
      return res.status(404).json({ err: "Invalid phone number Or Password " });
    } else {
        console.log(user);
        bcrypt.compare(password, user.password)
        .then(isMatch => {
        if(isMatch) {
          return user.getAuthToken()
          .then(token => {
            res.header("auth-token", token).send(user);
          });
        } else {
          return res.status(400).json({ err: "Invalid phone number Or Password" });
        }
      })
      .catch(err => {
        console.log(err);  
        res.json({err})});
    }
  });
}

const validatePhoneNumber = function(req,res){
    const {phone_number} = req.body;
    const {user} = req;

    if (phone_number === user.phone_number){
        return res.status(200).json({success:'user validated',user});
    }
    return res.status(401).json({error:'unathorized request'});
}


module.exports={
    createUser,
    login,
    validatePhoneNumber,
}