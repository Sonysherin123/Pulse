const express = require("express");
const admin_route = express();
const path=require('path');
const bodyParser = require('body-parser')
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));
const auth=require('../middleware/adminauth')
const multer=require('multer');


const adminController = require("../controllers/adminController");
const couponController = require('../controllers/couponController'); // Make sure this is the correct path to your controller file


const category = require('../controllers/categoryController');
const product =require('../controllers/productController');
const order = require('../controllers/ordercontroller');
const wallet= require('../controllers/walletController');



admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

const storage=multer.diskStorage({
    destination:function(req,file,cb){
      cb(null,'./uploads/productImages');
    
    },
    filename:function(req,file,cb){
     
      cb(null,file.originalname);
    }
    });
  
const upload=multer({storage:storage}).array('images', 3);

admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyAdmin);

admin_route.get('/home',auth.isLogin,adminController.LoadHome);

admin_route.get('/category',auth.isLogin,category.loadCategory);
admin_route.post('/category',category.createCategory);

admin_route.get('/edit-cate',auth.isLogin,category.editCategoryLoad );
admin_route.post('/edit-cate',category.updateCategory);

admin_route.get('/delete-cate',auth.isLogin,category.deleteCategory);
admin_route.get('/product',auth.isLogin,product.loadProduct);
admin_route.post('/product',upload,product.addProduct);
admin_route.get('/productlist',product.Loadproduct);

admin_route.get('/logout',auth.isLogin,adminController.loadLogout);

admin_route.get('/active',auth.isLogin,product.activeStatus);

admin_route.get('/edit-pro',auth.isLogin,product.loadEdit);
admin_route.post('/edit-pro',upload,product.editProduct);
admin_route.get('/deleteImage',auth.isLogin,product.deleteimage);


admin_route.get('/userlist',auth.isLogin,adminController.listUser);
admin_route.get('/block-user',auth.isLogin,adminController.blockUser);
admin_route.get('/unblock-user',auth.isLogin,adminController.unblockUser);


admin_route.get('/order', order.loadadminorder);
admin_route.get('/orderDetails', order.loadOrderDetail);
admin_route.post("/orderSave", order.saveOrder)
admin_route.get('/orderDetails', order.loadOrderDetail);
admin_route.get("/addOffer",adminController.addOfferLoad);
admin_route.post("/addOfferPost",adminController.addOffer);
admin_route.post('/deleteoffer',adminController.deleteOffer);
admin_route.get("/catagoryOffer",adminController.loadCategoryOffer);

admin_route.get("/coupon",couponController.loadCouponPage);
admin_route.get("/addCoupon",couponController.loadAddCoupon);
admin_route.post("/addCoupon",couponController.addCoupon);
admin_route.post("/coupon-block",couponController.blockCoupon);
admin_route.get("/coupon-edit",couponController.loadEditCoupon);
admin_route.post("/editCoupon",couponController.editCoupon);

admin_route.get("/sales",adminController.loadSales)
admin_route.get("/salesDate",adminController.dateFilter)
admin_route.get("/date",adminController.sortDate)





admin_route.post('/refund',wallet.addtoWallet);



module.exports = admin_route;