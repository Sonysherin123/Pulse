const express = require("express");
const user_route = express();
const path=require('path')
const bodyParser = require('body-parser')
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const auth=require('../middleware/auth');


user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

user_route.get('/',auth.isLogout,userController.loadLogin);
user_route.post('/',userController.verifyLogin);

user_route.get('/home',auth.isLogin,userController.loadHome);

user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);

user_route.get('/otp',auth.isLogout,userController.loadOTP);
user_route.post('/otp',userController.getOTP);

user_route.get('/logout',userController.logout);
user_route.get('/productDetails',auth.isLogin,userController.LoadproductDetails);
user_route.post('/resendOTP',userController.resendOtp);

user_route.get('/userProfile',auth.isLogin,userController.loaduserprofile);
user_route.post('/userProfile',auth.isLogin,userController.editProfile);


// user_route.post('/userProfile',auth.isLogin,userController.userProfile)
user_route.post('/add-address',userController.addAddress);




user_route.get('/resetpassword',userController.loadresetpassword);


 user_route.get('/cart',cartController.loadCart);
 user_route.get('/cart',cartController.add_to_cart);



module.exports = user_route;