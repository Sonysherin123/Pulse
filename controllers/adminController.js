const userModel = require('../model/userModel');
const User = require('../model/userModel');
const Order = require('../model/ordermodel');
const Product = require('../model/productmodel');
const bcrypt = require("bcrypt");
const ExcelJS = require('exceljs');
const Category=require('../model/categorymodel')

const sortDate = async (req, res) => {
    try {
      const sort = req.query.value;
      let orderDateQuery = {};
  
      const currentDate = new Date();
  
      const currentDateString = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`
      if (sort === "Day") {
  
        orderDateQuery = currentDateString;
      } else if (sort === "Week") {
        const firstDayOfWeek = new Date(currentDate);
        firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
        const lastDayOfWeek = new Date(currentDate);
        lastDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6); 
        const firstDayOfWeekString = `${firstDayOfWeek.getDate()}-${firstDayOfWeek.getMonth() + 1}-${firstDayOfWeek.getFullYear()}`;
        const lastDayOfWeekString = `${lastDayOfWeek.getDate()}-${lastDayOfWeek.getMonth() + 1}-${lastDayOfWeek.getFullYear()}`;
        orderDateQuery = {
          $gte: firstDayOfWeekString,
          $lte: lastDayOfWeekString
        };
      } else if (sort === "Month") {
        orderDateQuery = {
          $regex: `-${currentDate.getMonth() + 1}-`
        };
      } else if (sort === "Year") {
        orderDateQuery = {
          $regex: `-${currentDate.getFullYear()}$`
        };
      }
  
      const order = await Order.find({
        status: { $nin: ["Ordered", "Canceled", "Shipped"] },
        orderDate: orderDateQuery
      }).sort({ _id: -1 });
  
  
      res.render("adminSales", { order });
    } catch (error) {
      console.log(error.message);
    }
  };

const dateFilter = async (req, res) => {
    try {
      const date = req.query.value;
      const date2 = req.query.value1;
      
      const parts = date.split("-");
      const parts1 = date2.split("-");
  
      const day = parseInt(parts[2], 10);
      const day1 = parseInt(parts1[2], 10);
  
      const month = parseInt(parts[1], 10);
      const month1 = parseInt(parts1[1], 10);
  
      const rotatedDate = day + "-" + month + "-" + parts[0];
      const rotatedDate1 = day1 + "-" + month1 + "-" + parts1[0];
  
      const order = await Order.find({
        status: { $in: ["Delivered"] },
        orderDate: {
          $gte: rotatedDate,
          $lte: rotatedDate1
        }
      }).sort({ _id: -1 });
  
      res.render("adminSales", { order });
    } catch (error) {
      console.log(error.message);
    }
  };

const loadLogin = async(req,res)=>{
    try{
        res.render('adminlogin');
    } catch(error){
        console.log(error.message);
    }
}
const LoadHome = async(req,res)=>{
    try{
        res.render('home');
    }catch(error){
        console.log(error.message);

    }
}
const verifyAdmin = async (req, res) => {
    try {
  
      const email = req.body.email;
      const password = req.body.password;
      console.log(password,email)
      const userData = await User.findOne({ email: email });
    
      if (userData) {
  
        const passwordMatch = await bcrypt.compare(password, userData.password);
        
        console.log(passwordMatch)
  
        if (passwordMatch) {
    
          if (!userData.is_admin) {
          
            res.render('adminlogin', { message: 'Email and password is Incorrect.' });
        
          }
          else {
           
            req.session.user_id = userData._id;
            res.redirect('/admin/home')
          }
  
        }
        else {
          res.render('adminlogin', { message: 'Email and password is Incorrect.' });
        }
  
      }
      else {
        res.render('adminlogin', { message: 'Email and password is Incorrect.' });
      }
  
    }
    catch (error) {
      console.log(error.message);
    }
  }
  const loadLogout = async(req,res)=>{
    try{
        req.session.user_id =false;
        res.redirect('/admin')
    } catch(error){
        console.log(error.message);
    }
  };
  const blockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById(id);
  
        if (userData) {
            // Update the user's status to blocked
            userData.isBlocked = true;
            await userData.save();
  
            // Redirect to the user listing page after blocking
            res.redirect('/admin/userlist');
        } 
    } catch (error) {
        console.log(error.message);
        // Handle the error appropriately, e.g., render an error page
        res.status(500).send('Internal Server Error');
    }
  };
  const unblockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById(id);
  
        if (userData) {
            // Update the user's status to unblocked
            userData.isBlocked = false;
            await userData.save();
          console.log("123");
            // Redirect to the user listing page after unblocking
            res.redirect('/admin/userlist');
        } else {
            // If user data is not found, you may want to handle this case as well
            res.status(404).send('User not found');
            console.log("456");
  
        }
    } catch (error) {
        console.log(error.message);
        // Handle the error appropriately, e.g., render an error page
        res.status(500).send('Internal Server Error');
        console.log("789");
    }
  };
  const listUser = async(req,res)=>{
    try{
      const perPage=5;
      const page = parseInt(req.query.page) || 1;
      const totalusers= await userModel.countDocuments({});
      const totalPage=Math.ceil(totalusers / perPage)
        const userData = await User.find({is_admin:0}).skip(perPage * (page - 1)).limit(perPage);
       
        res.render('userlist',{users:userData,page,totalPage});
    }catch(error){
        console.log(error.message);
    }
};


const loadSales = async (req, res) => {
        try {
          const order = await Order.find({
            status: { $in: ["Delivered"] },
      
          }).sort({ _id: -1 });
          
          res.render("adminSales", { order });
        } catch (error) {
          console.log(error.message);
        }
      };

const addOfferLoad=async(req,res)=>{
        try {
            const catData = await Category.find({
                is_active: true });
                console.log(catData,"catdata");
            res.render("addOffer",{catData})
        } catch (error) {
           console.log(error.message) 
        }
      }
      

const addOffer = async (req, res) => {
    try {
      const { discount, startDate, endDate, catname } = req.body;
  
      const findCat = await Category.findOne({ name: catname });
  
      if (findCat.offer) {
        const currentDateTime = new Date();
        const offerEndDate = new Date(findCat.offer.endDate);
  
        if (currentDateTime > offerEndDate) {
          findCat.offer = undefined;
          await findCat.save();
        }
      }
  
      const updateCat = await Category.findByIdAndUpdate(
        { _id: findCat._id },
        {
          $set: {
            offer: {
              discount: discount,
              startDate: startDate,
              endDate: endDate,
            },
          },
        }
      );
  
      res.json({ status: true });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ status: false, error: error.message });
    }
  };
  const loadCategoryOffer = async (req, res) => {
    try {
      // Find all categories that are not blocked
      const findCat = await Category.find({ is_active: true });
  
      // Loop through each category
      for (let i = 0; i < findCat.length; i++) {
        // Check if the category has an offer and if the offer has expired
        if (findCat[i].offer && new Date(findCat[i].offer.endDate) < new Date()) {
          // If offer has expired, remove the offer from the category and save it
          findCat[i].offer = undefined;
          await findCat[i].save();
        }
      }
  
      
      res.render("offerCategory", { findCat });
    } catch (error) {
      
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  

const deleteOffer=async(req,res)=>{
  try {
    console.log('hi');
      const id=req.body.id
      const findCat=await Category.findByIdAndUpdate({_id:id},{
          $unset:{offer:""}
      })

      res.json({status:true})
  } catch (error) {
      console.log(error.message)
  }
}
  
  
      
      

module.exports = {
    loadLogin,
    verifyAdmin,
    LoadHome,
    loadLogout,
    blockUser,
    unblockUser,
    listUser,
    loadSales,
    dateFilter,
    sortDate,
    addOfferLoad,
    addOffer,
    loadCategoryOffer,
    deleteOffer

}