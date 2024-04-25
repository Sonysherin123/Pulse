const User = require('../model/userModel');
const bcrypt = require("bcrypt");
const {generateOTP}=require('../util/otpgenerater');
const {sendInsertOtp}=require('../util/insertotp');
const ProductModel=require('../model/productmodel');
const userModel = require('../model/userModel');
const addressModel = require('../model/addressmodel');
const cartmodel = require('../model/cartmodel');
const categoryModel=require('../model/categorymodel');
const addressmodel = require('../model/addressmodel');


// const Address = require('../models/Address'); // Adjust the path as needed

// const Address = require("../models/addressModel");
// const Product = require("../models/productModel");
// const Cart = require("../models/cartModel")
// const Category = require("../models/categoryModel");
// const Wallet = require("../models/walletModel");
// const Order =require("../models/orderModel")
// // const referalCode = require("../utils/referalCode");
// const Coupon = require('../models/couponModel');



const securePassword = async(password)=>{

    try{
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch(error){
        console.log(error.message);
    }
}

const logout=async(req,res)=>{
    try{
req.session.user=false;
res.redirect('/');
    }
    catch(error){
        console.log('logout',error.message);
    }

}
const loadRegister = async(req,res)=>{
    try{
        res.render('registration',{error:null});
    } catch(error){
        console.log(error.message);
    }
}
const loadLogin = async(req,res)=>{
    try{
        res.render('loginPage',{message:null});
    } catch(error){
        console.log(error.message);
    }
}


const insertUser = async (req, res) => {
    try {
        const { name, email, mobileno, userpassword, confirmpassword } = req.body;
        console.log(name,email,mobileno,userpassword,confirmpassword);

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            
            return res.render('registration',{error:'Email already exists. Please use a different email.'});
        }

        // If passwords match, proceed with user registration
        if (userpassword === confirmpassword) {
            // Generate OTP and timestamp
            const otp = generateOTP();
            console.log(otp,"otp");
            const otpTimestamp = Date.now();
            console.log(otpTimestamp,'time');

            // Store user data and OTP in session
            req.session.Data = { name, email, mobileno, userpassword, confirmpassword, otp, otpTimestamp };
            console.log(req.session.Data,"data saved");
           
            // Send OTP to user's email
            const sentEmailUser = await sendInsertOtp(email, otp);
            console.log(sentEmailUser,"emailsent");
            if (sentEmailUser) {
                console.log("inside sent email");
                // Redirect to OTP verification page
                return res.redirect('/otp');
            }
        } else {
            console.log("else worked in email sent");
            // If passwords don't match, render the register page with an error message
            return res.render('registration', { error: 'Passwords do not match.' });
        }
    } catch (error) {
        console.log(error.message);
        // Handle any errors that occur during registration
        return res.render('registration', { error: 'An error occurred. Please try again later.' });
    }
}

//login user methods started

const loadHome= async(req,res)=>{
    try{
        const product=await ProductModel.find({is_deleted:false});
        console.log(product);
        res.render('home',{product});
    } catch(error){
        console.log(error.message);
    }
}


 const verifyLogin = async(req,res)=>{
     try{
        console.log(req.body)
         const email = req.body.email;
         const password = req.body.password;

        const userData = await User.findOne({email:email,is_admin:false});
         console.log(userData)
        if(userData){
             const passwordMatch = await bcrypt.compare(password,userData.password);
             if(passwordMatch){
                     req.session.user = userData._id;
                     console.log(req.session.user,'------');
                     res.redirect('/home');
                 }else{
                    res.render('loginPage',{message:"Email and Password are incorrect"});
                }
             } else{
                 res.render('loginPage',{message:"Email and Password are incorrect"});
             }
        

     }catch(error){
         console.log(error.message);
     }
 }

 const loadOTP= async(req,res)=>{
    try{
        res.render('OTP' ,{message:null});
    } catch(error){
        console.log(error.message);
    }
}


const active = async (req, res) => {
    try {
       
        const id = req.query.id;
        const userlist=await User.findById(id);
        if(userlist.is_active){
            await userlist.findByIdAndUpdate(id, { is_active: false });
        }else{
            await userlist.findByIdAndUpdate(id, { is_active: true });
        }
       
        res.redirect('/admin/userlist');
    } catch (error) {
        console.log(error.message);
    }
}
const LoadproductDetails=async(req,res)=>{
    try{
        console.log("enter detaikls");
        const id=req.query.id;
        console.log(id,"asdssd");
        const product=await ProductModel.findById(id).populate('category');
        console.log(product,"pdttttttttttttt");
        const products=await ProductModel.find({category:product.category._id});
        console.log(products,);
        res.render('productdetails',{product,products});

    }catch(error){
        console.log(error.message);
    }
}


const getOTP=async(req,res)=>{

    
            // console.log("ssjtgjuykdfg")
            try{
                const otpInBody = req.body.otp;
                console.log(otpInBody,'otp...............................');
                console.log(req.session.Data.otp);
                const otp = req.session.Data.otp;
                const otpTimestamp = req.session.Data.otpTimestamp;
                const currentDate = Date.now();
                if(otpInBody === otp && (currentDate - otpTimestamp)<= 20000 ){
                    // const {name, email, mobileno, userpassword, confirmpassword, otp, otpTimestamp} = req.session.Data
                    const {name, email, mobileno, userpassword} = req.session.Data

         
                    
                    const passwordHash = await securePassword(req.session.Data.userpassword);
                    const existingUser = await User.findOne({email:email})
                    if(!existingUser){
                        const user = new User({
                            name: name,
                            email: email,
                            mobile: mobileno,
                            password: passwordHash,
                            is_admin: 0,
                            is_verified: true,
                            is_blocked: false
                        });
                        await user.save();
                    }
                    return res.redirect('/'); 
                }
                else{
                    // return res.status(400).json({error:"otp invalid"}); 
                    if((currentDate - otpTimestamp) > 20000){
                        req.session.Data.otp =null;
                        return res.render('OTP',{message: "otp expired"})
                    }
                    else{
                        return res.render('OTP',{message: "Otp incorrect"})

                    }
                }
    }
    catch(error){
        console.log('getOTP',error.message);
        return res.render('OTP',{message: "error occured"})

    }

}

const resendOtp=async(req,res)=>{
    try{
console.log('in resend');
 const newOTP = generateOTP(); 
 const otpTimestamp = Date.now();
//   await sendInsertOtp(req.session.Data.email, newOTP);

req.session.Data.otpTimestamp=otpTimestamp;
console.log(req.session.Data.otpTimestamp);
 req.session.Data.otp = newOTP;
console.log(req.session.Data.otp,"session newotp");
 console.log(newOTP,"new otp");
 res.status(200).json({message: "otp sent success" , newOTP});
    }
    catch(error){
console.log('resendotp',error.message);
    }
}
const loaduserprofile = async(req,res)=>{
    try{
        const userData = await userModel.findById(req.session.user);
        const address = await addressModel.findOne(
            { 'userId': req.session.user }
        );

        res.render('userProfile', { userData,address});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

 const  editProfile = async(req,res)=>{
    try{

        await userModel.findByIdAndUpdate({_id:req.session.user},{$set:{
            name : req.body.name,
        
            mobile : req.body.mobile,
            email : req.body.email
        }})
        res.redirect('/userProfile')
    }catch(error){
        console.log(error);
    }
};

const addAddress = async (req, res) => {
    try {
        console.log("heloo")
        const { addressType, name, city, homeAddress, landMark, state, pincode, phone, altPhone } = req.body;
        console.log( addressType, name, city, homeAddress, landMark, state, pincode, phone, altPhone);

        const existingAddresses = await addressModel.findOne({ userId: req.session.user});

        if (existingAddresses && existingAddresses.address.length >= 3) {
            req.flash('error', 'You can only have up to 3 addresses.');
            return res.redirect('/userProfile');
        }

        if (phone === altPhone) {
            // req.flash('error', 'Phone and Alternate Phone must be different.');
            return res.redirect('/userProfile');
        }

        const pincodeRegex = /^[1-9][0-9]{5}(?:\s[0-9]{3})?$/;
        if (!pincodeRegex.test(pincode)) {
            // req.flash('error', 'Pincode must be a 6-digit number.');
            return res.redirect('/userProfile');
        }

        const newAddress = {
            addressType,
            name,
            city,
            homeAddress,
            landMark,
            state,
            pincode,
            phone,
            altPhone
        };

        if (existingAddresses) {
            existingAddresses.address.push(newAddress);
            await existingAddresses.save();
        } else {
            const address = new addressModel({
                userId: req.session.user,
                address: [newAddress]
            });
            await address.save();
        }

        res.redirect('/userProfile');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const renderEditAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;
      

        const address = await addressModel.findOne({ userId: req.session.user, 'address._id': addressId });
      
        if (!address) {
            console.log('Address not found');
            return res.status(404).send('Address not found');
        }

        const addressData = address.address.find(addr => addr._id.toString() === addressId);
        
        res.render('editaddress', { address: addressData, addressId: addressId });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



const editAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;
        const { name, addressType, city, homeAddress, landMark, state, pincode, phone, altPhone } = req.body;

        // Validate pincode format
        const pincodeRegex = /^[1-9][0-9]{5}(?:\s[0-9]{3})?$/;
        if (!pincodeRegex.test(pincode)) {
            req.flash('error', 'Pincode must be a 6-digit number.');
            return res.redirect('/edit-address?addressId=' + addressId);
        }

        // Construct updated address object
        const updatedAddress = {
            name,
            addressType,
            city,
            homeAddress,
            landMark,
            state,
            pincode,
            phone,
            altPhone
        };
        
        // Update the address in the database
        const result = await addressmodel.findOneAndUpdate(
            { 'address._id': addressId }, 
            { $set: { 'address.$': updatedAddress } }, 
            { new: true } 
        );

        // Check if the address was found and updated
        if (!result) {
            console.log('Address not found');
            return res.status(404).send('Address not found');
        }

        // Redirect to the user profile page with the manage address section anchor
        res.redirect('/userProfile#manageaddress');
    } catch (error) {
        // Handle internal server error
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



const deleteAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;

        
        const address = await addressmodel.findOne({ userId: req.session.user});
        console.log('..........afsfsrasfdsd',addressId,);
        
        if (!address) {
            console.log('Address not found');
            return res.status(404).send('Address not found');
        }

        
        address.address = address.address.filter(addr => addr._id.toString() !== addressId);

        
        await address.save();

      
        res.redirect('/userProfile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const loadresetpassword = async(req,res)=>{
try{
    res.render('resetPassword')
}catch(error){
    console.log(error);
}
};
// const loadshop = async (req, res) => {
//     try {
 
//         const product = await ProductModel.find().populate('category');

//         const categories = await categoryModel.find();

//         res.render('shop', { product, categories });
//     } catch (error) {
//         console.log(error);
//     }
// };

const loadshop = async (req, res) => {
    try {
        console.log("hai");
        const product = await ProductModel.find().populate('category');
        console.log("hello");
        console.log(product);
        // Define findWish (assuming it's obtained from somewhere)
        const findWish = {}; // Example: You should replace this with your actual data
        const categories = await categoryModel.find();
        // Assuming sortby and selectedCategory are variables you want to pass to the view
        const sortby = req.query.sortby || 'all'; // Default value 'all' if not provided in query
        const selectedCategory = req.query.category || ''; // Default value '' if not provided in query

        res.render('shop', { product, categories, sortby, selectedCategory, findWish });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const addToWallet=async(req,res)=>{
    var instance = new Razorpay({
      key_id: 'rzp_test_ca6f519OHo30qU',
      key_secret: 'VwPfNUhPxTUpIN8R27IbwWI8',
    });
  
   
    const amount = Number(req.body.amount);
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount provided.",
      });
    }
  
    var options = {
      amount: amount * 100,  
      currency: "INR",
    };
  
  
    try {
      const razorpayOrder = await instance.orders.create(options);
      console.log(razorpayOrder);
      res.status(201).json({
        success: true,
        message: "Wallet updated successfully.",
        order: razorpayOrder,
      });
    } catch (orderError) {
    
      console.error('Razorpay Order Creation Error:', orderError);
      res.status(500).json({
        success: false,
        message: "Failed to create order with Razorpay.",
      });
    }
  
  
  }
  



module.exports = {
    loadRegister,
    insertUser,
    loadLogin,
    verifyLogin,
    loadHome,
    loadOTP,
    active,
    getOTP,
    logout,
    LoadproductDetails,
    resendOtp,
    loaduserprofile,
    editProfile,
    addAddress,
    loadresetpassword,
    editAddress,
    deleteAddress,
    renderEditAddress,
    loadshop,
    addToWallet
    
    
}