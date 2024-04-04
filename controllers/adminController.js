const userModel = require('../model/userModel');
const User = require('../model/userModel');
const bcrypt = require("bcrypt");

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
}



module.exports = {
    loadLogin,
    verifyAdmin,
    LoadHome,
    loadLogout,
    blockUser,
    unblockUser,
    listUser
}