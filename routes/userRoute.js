const express = require("express");
const user_route = express();
const path=require('path')
const bodyParser = require('body-parser')
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const auth=require('../middleware/auth');
const checkoutController = require("../controllers/chekoutController");
const orderController = require("../controllers/ordercontroller");
const couponController = require('../controllers/couponController');
const productController = require('../controllers/productController');
const wishlistController = require('../controllers/wishlistController')
var easyinvoice = require('easyinvoice');


user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

user_route.get('/',auth.isLogout,userController.loadLogin);
user_route.post('/',userController.verifyLogin);

user_route.get('/home',auth.isLogin,userController.loadHome);

user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);

user_route.get('/otp',auth.isLogout,userController.loadOTP);
user_route.post('/otp',userController.getOTP);
user_route.post('/resendOTP',userController.resendOtp);

user_route.get('/logout',userController.logout);
user_route.get('/productDetails',auth.isLogin,userController.LoadproductDetails);


user_route.get('/userProfile',auth.isLogin,userController.loaduserprofile);
user_route.post('/userProfile',auth.isLogin,userController.editProfile);


user_route.post('/addAddress',userController.addAddress);
user_route.get('/edit-address',auth.isLogin,userController.renderEditAddress);
user_route.post('/edit-address',userController.editAddress);
user_route.get('/deleteAddress',auth.isLogin,userController.deleteAddress);


user_route.get('/resetPassword',auth.isLogin,userController.loadresetpassword);
// user_route.post('/resetPassword', userController.loadresetpassword);




 user_route.get('/cart',auth.isLogin,cartController.loadCart);
 user_route.post('/addCart',cartController.add_to_cart);
 user_route.post('/cartadd',  cartController  .increment);
 user_route.post('/decrement', cartController.decrement);
 user_route.post('/pro-del', cartController.removeCart);
 user_route.post("/addCartLoad", cartController.loadCartinWish);
 
 user_route.get('/orderPlaced',cartController.loadorderPlaced);
 user_route.get('/order',orderController.orders);
 user_route.get('/orderView',orderController.loadViewOrder);
 user_route.post('/cancelOrder',orderController.cancelOrder);
 user_route.post("/cancelReturn",auth.checkAuth,orderController.cancelReturn);
  user_route.post("/return",orderController.returnRequest);


 user_route.get("/wallet",auth.checkAuth,checkoutController.loadWallet);

user_route.post("/addCash",auth.checkAuth,checkoutController.addWalletCash);

user_route.post("/addAmount",checkoutController.addCash);


 user_route.post('/addToWishlist',wishlistController.addToWishlist);  
user_route.post('/removefromWishlist',wishlistController.removeWishlist);
user_route.get('/wishlist',wishlistController.loadWishlist);





 user_route.get('/checkOutData',auth.isLogin,checkoutController.loadCheckOutPage);
 user_route.post('/checkOutData', auth.checkAuth, cartController.addOrder);

user_route.get("/coupon", auth.checkAuth,couponController.loadCoupon);
user_route.post("/applyCoupon",  auth.checkAuth, couponController.applyCoupon);
user_route.post('/remove_coupon',couponController.removeCoupon); 
user_route.post("/verify-payment",auth.checkAuth,checkoutController.razopayment);
user_route.post('/continuePayment',checkoutController.continuePayment);
user_route.post('/payment-success',checkoutController.successPayment);
user_route.post('/paymentfailed',checkoutController.paymentFailed);



 user_route.get('/shop',userController.loadshop);
 user_route.post('/search',productController.searchProducts);
 user_route.post('/addToWallet',userController.addToWallet);
 
 user_route.get('/pdf',checkoutController.invoice);
user_route.get("/loadInvoice",userController.loadInvoice)

module.exports = user_route;