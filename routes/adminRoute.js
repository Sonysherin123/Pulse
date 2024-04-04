const express = require("express");
const admin_route = express();
const path=require('path');
const bodyParser = require('body-parser')
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));
const auth=require('../middleware/adminauth')
const multer=require('multer');

const adminController = require("../controllers/adminController");

const category = require('../controllers/categoryController');
const product =require('../controllers/productController');

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

admin_route.get('/logout',adminController.loadLogout);

admin_route.get('/active',product.activeStatus);

admin_route.get('/editProduct',product.loadEdit);
admin_route.post('/editproduct',upload,product.editProduct);

admin_route.get('/userlist',adminController.listUser);
admin_route.get('/block-user',auth.isLogin,adminController.blockUser);
admin_route.get('/unblock-user',auth.isLogin,adminController.unblockUser);

module.exports = admin_route;