const express = require('express');

const router = express.Router();

const multer = require('multer');

const upload = multer({dest: `${__dirname}/../public`});

// const bodyParser = require('body-parser');

const userController = require('../controllers/userController');

const {authenticate} = require('../middlewares/auth');

// @@ post create user
router.post ('/',upload.single('avatar'),userController.createUser);

//@@ post login 
router.post ('/login',userController.login);

//@@ post validation token/phone
router.post ('/validate', authenticate , userController.validatePhoneNumber);


module.exports = router ;