const userModel = require('../model/userModel');
const User = require('../model/userModel');
const Order = require('../model/ordermodel');
const Product = require('../model/productModel');
const bcrypt = require("bcrypt");
// const { generatePDF } = require('../utils/pdfGenerator');


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




 async function salesReport(date) {
    try {
        const currentDate = new Date();
        let orders = [];
        for (let i = 0; i < date; i++) {
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(currentDate);
            endDate.setDate(currentDate.getDate() - i);
            endDate.setHours(23, 59, 59, 999);

            const dailyOrders = await Order.find({
                status: "Delivered",
                orderDate: {
                    $gte: startDate,
                    $lt: endDate,
                },
            });

            orders = [...orders, ...dailyOrders];
        }

        let productEntered = [];
        for (let i = 0; i < date; i++) {
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(currentDate);
            endDate.setDate(currentDate.getDate() - i);
            endDate.setHours(23, 59, 59, 999);

            const product = await Product.find({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate,
                },
            });

            productEntered = [...productEntered, ...product];
        }

        let users = await User.countDocuments();

        let totalRevenue = 0;
        orders.forEach((order) => {
            totalRevenue += order.totalAmount;
        });

        let totalOrderCount = await Order.find({
            status: "Delivered",
        });

        let Revenue = 0;
        totalOrderCount.forEach((order) => {
            Revenue += order.totalAmount;
        });

        let stock = await Product.find();
        let totalCountInStock = 0;
        stock.forEach((product) => {
            totalCountInStock += product.countInStock;
        });

        let averageSales = orders.length / date;
        let averageRevenue = totalRevenue / date;

        return {
            users,
            totalOrders: orders.length,
            totalRevenue,
            totalOrderCount: totalOrderCount.length,
            totalCountInStock,
            averageSales,
            averageRevenue,
            Revenue,
            productEntered: productEntered.length,
            totalOrder: orders
        };
    } catch (err) {
        console.log('salesreport', err.message);
        throw err;
    }
}

async function salesReportmw(startDate, endDate) {
    try {
        let orders = await Order.find({
            status: "Delivered",
            orderDate: {
                $gte: startDate,
                $lte: endDate,
            },
        });

        let productEntered = await Product.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        });

        let usersCount = await User.countDocuments();

        let totalRevenue = orders.reduce((total, order) => total + order.totalAmount, 0);

        let totalOrderCount = orders.length;

        let stock = await Product.find();
        let totalCountInStock = stock.reduce((total, product) => total + product.countInStock, 0);

        let daysInRange = (endDate - startDate) / (1000 * 60 * 60 * 24);
        let averageSales = totalOrderCount / daysInRange;
        let averageRevenue = totalRevenue / daysInRange;

        return {
            usersCount,
            totalOrders: totalOrderCount,
            totalRevenue,
            totalCountInStock,
            averageSales,
            averageRevenue,
            productEntered: productEntered.length,
            totalOrder: orders
        };
    } catch (err) {
        console.error('salesReport error', err.message);
        throw err;
    }
}

const getWeeksInMonth = (currentDate) => {
    // Implementation of getWeeksInMonth function
};

const getMonthsInYear = (currentMonth) => {
    // Implementation of getMonthsInYear function
};

function getMonthName(month) {
    // Implementation of getMonthName function
}

const pdf = async (req, res) => {
    try {
        let title = "";
        const currentDate = new Date();

        switch (req.query.type) {
            case 'daily':
                let dailySalesData = await salesReport(1);
                generatePDF([dailySalesData], "Daily Sales Report", res);
                break;
            case 'weekly':
                let weeklySalesData = [];
                const weeks = getWeeksInMonth(currentDate);
                for (const week of weeks) {
                    const data = await salesReportmw(week.start, week.end);
                    weeklySalesData.push({ ...data, period: `Week ${weeks.indexOf(week) + 1}, ${getMonthName(currentDate.getMonth())}` });
                }
                generatePDF(weeklySalesData, "Weekly Sales Report", res);
                break;
            case 'monthly':
                let monthlySalesData = [];
                const months = getMonthsInYear(currentDate.getMonth());
                for (const { month, year } of months) {
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);
                    const data = await salesReportmw(monthStart, monthEnd);
                    monthlySalesData.push({ ...data, period: `${getMonthName(month)} ${currentDate.getFullYear()}` });
                }
                generatePDF(monthlySalesData, "Monthly Sales Report", res);
                break;
            case 'yearly':
                let yearlySalesData = [await salesReport(365)];
                generatePDF(yearlySalesData, "Yearly Sales Report", res);
                break;
            default:
                res.status(400).send('Invalid report type specified.');
                return;
        }
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).send('Error generating PDF.');
    }
};





module.exports = {
    loadLogin,
    verifyAdmin,
    LoadHome,
    loadLogout,
    blockUser,
    unblockUser,
    listUser,
    salesReport,
    pdf
    

}