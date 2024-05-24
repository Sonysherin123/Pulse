const userModel = require('../model/userModel');
const User = require('../model/userModel');
const Order = require('../model/ordermodel');
const Product = require('../model/productmodel');
const bcrypt = require("bcrypt");
const ExcelJS = require('exceljs');
const Category=require('../model/categorymodel');
const chart=require("chart.js");

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

const LoadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id })
    const yValues = [0, 0, 0, 0, 0, 0, 0]
    const order = await Order.find({
      status: { $nin: ["Order Confirmed", "Processing", "Product Dispatched", "Canceled", "Shipped", "Returned", "Return Process", "Payment Failed"] },
    });
    


    

    const totalProductCount = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalCount: { $sum: "$items.quantity" }
        }
      },
      {
        $group: {
          _id: null,
          totalProductCount: { $sum: "$totalCount" }
        }
      }
    ]);

    const totalCount = totalProductCount.length > 0 ? totalProductCount[0].totalProductCount : 0;


    //////////////////************************** Top Selling Products  ***************************//////////////////



    const topSellingProducts = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: "$productDetails._id",
          pname: "$productDetails.pname",
          totalQuantity: 1,
          images: "$productDetails.images",
          brand: "$productDetails.brand"
        },
      },
    ]);


    //////////////////************************** Top Selling Categories  ***************************//////////////////


    const topSellingCategories = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalSales: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          name: "$category.name",
          totalSales: 1,
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);



    //////////////////************************** Top Selling Brands  ***************************//////////////////


    const topSellingBrands = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.brand",
          totalSales: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);





    for (let i = 0; i < order.length; i++) {
      const date = order[i].createdAt
      console.log(date, "date");
      const value = date.getDay()
      console.log(value, "value get");
      yValues[value] += order[i].totalAmount
    }

    const allData = await Category.find({})

    const sales = []

    for (let i = 0; i < allData.length; i++) {
      sales.push(0)
    }


    const allName = allData.map((x) => x.name)
    const allId = allData.map((x) => x._id)



    let productId = []
    let quantity = []

    for (let i = 0; i < order.length; i++) {
      for (let j = 0; j < order[i].items.length; j++) {
        productId.push(order[i].items[j].productId)
        quantity.push(order[i].items[j].quantity)
      }
    }
  

    const productData = []
    for (let i = 0; i < productId.length; i++) {
      productData.push(await Product.findById({ _id: productId[i] }))
    }


    for (let i = 0; i < productData.length; i++) {

      for (let j = 0; j < allId.length; j++) {
        
        if (allId[j] == productData[i].category.toString()) {

          sales[j] += quantity[i]
        }
      }

    }
   

    let productSales = [];

    for (let i = 0; i < productId.length; i++) {
      productSales.push({ salesCount: 1 });
    }

    for (let i = 0; i < productId.length; i++) {
      for (let j = i + 1; j < productId.length; j++) {
        if (productId[i].toString() == productId[j].toString()) {
          productSales[i].salesCount += 1;
        }
      }
    }


    const month = await Order.aggregate([
      {
        $project: {
          _id: { $dateToString: { format: "%m-%Y", date: "$createdAt" } },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: "$_id",
          totalEarnings: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);


    let months = ["01-2024", "02-2024", "03-2024", "04-2024", "05-2024", "06-2024", "07-2024", "08-2024", "09-2024", "10-2024", "11-2024", "12-2024"];
    let array = new Array(months.length).fill(0); 

    for (let i = 0; i < months.length; i++) {
      for (let j = 0; j < month.length; j++) {
        if (month[j]._id == months[i]) {
          array[i] += month[j].totalEarnings;
        }
      }
    }



    const orderData = await Order.find({ status: "Delivered" });
    let sum = 0;
    for (let i = 0; i < orderData.length; i++) {
      sum = sum + orderData[i].totalAmount;
    }
    const product = await Product.find({});
    const category = await Category.find({});
    
    if (order.length > 0) {
      const month = await Order.aggregate([
        { $match: { status: "Delivered" } },
        {
          $addFields: {
            orderDate: {
              $dateFromString: { dateString: "$orderDate", format: "%d-%m-%Y" },
            },
          },
        },
        {
          $addFields: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            totalEarnings: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);


      const dailyEarnings = await Order.aggregate([
        { $match: { status: "Delivered" } },
        {
          $addFields: {
            orderDate: {
              $dateFromString: { dateString: "$orderDate", format: "%d-%m-%Y" },
            },
          },
        },
        {
          $addFields: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
            day: { $dayOfMonth: "$orderDate" },
          },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month", day: "$day" },
            totalEarnings: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);




      const proLength = product.length;
      const catLength = category.length;
      const orderLength = order.length;
      res.render("home", {
        sum,
        proLength,
        topSellingProducts,
        sales,
        catLength,
        orderLength,
        month,
        yValues,
        dailyEarnings,
        topSellingCategories,
        totalCount,
        topSellingBrands,
        allName,
        array

      });
    } else {
      const proLength = product.length;
      const catLength = category.length;
      const orderLength = order.length;
      const month = null;
      const dailyEarnings = null;
      res.render("home", {
        sum,
        proLength,
        topSellingProducts,
        catLength,
        orderLength,
        month,
        sales,
        yValues,
        dailyEarnings,
        topSellingCategories,
        totalCount,
        topSellingBrands,
        allName,
        array
      });
    }

  }
  catch (error) {
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
      
      const findCat = await Category.find({ is_active: true });
  
      
      for (let i = 0; i < findCat.length; i++) {
      
        if (findCat[i].offer && new Date(findCat[i].offer.endDate) < new Date()) {
        
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