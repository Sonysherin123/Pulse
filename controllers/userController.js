const User = require('../model/userModel');
const bcrypt = require("bcrypt");
const {generateOTP}=require('../util/otpgenerater');
const {sendInsertOtp}=require('../util/insertotp');
const Product = require('../model/productmodel');
const addressModel = require('../model/addressmodel');
const cartmodel = require('../model/cartmodel');
const categoryModel=require('../model/categorymodel');
const wishlistModel = require('../model/wishlistmodel');
const Order=require('../model/ordermodel')



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

        
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            
            return res.render('registration',{error:'Email already exists. Please use a different email.'});
        }

    
        if (userpassword === confirmpassword) {

            const otp = generateOTP();
            console.log(otp,"otp");
            const otpTimestamp = Date.now();
            console.log(otpTimestamp,'time');

        
            req.session.Data = { name, email, mobileno, userpassword, confirmpassword, otp, otpTimestamp };
            console.log(req.session.Data,"data saved");
           
            
            const sentEmailUser = await sendInsertOtp(email, otp);
            console.log(sentEmailUser,"emailsent");
            if (sentEmailUser) {
                console.log("inside sent email");
                
                return res.redirect('/otp');
            }
        } else {
            console.log("else worked in email sent");
            
            return res.render('registration', { error: 'Passwords do not match.' });
        }
    } catch (error) {
        console.log(error.message);
        
        return res.render('registration', { error: 'An error occurred. Please try again later.' });
    }
}

//login user methods started

const loadHome= async(req,res)=>{
    try{
        const product=await Product.find({is_deleted:false});
        const cartItems = await cartmodel.distinct("items.productId", { userId: req.session.user });
const cartQty = cartItems.length || null;

const wishlistProducts = await wishlistModel.distinct("products.productId", { user_id: req.session.user });
const wishQty = wishlistProducts.length || null;


        console.log(cartQty,wishQty);
        res.render('home',{product,cartQty,wishQty});
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
        const product=await Product.findById(id).populate('category');
        console.log(product,"pdttttttttttttt");
        const products=await Product.find({category:product.category._id});
        console.log(products,);
        res.render('productdetails',{product,products});

    }catch(error){
        console.log(error.message);
    }
}


const getOTP=async(req,res)=>{

    
            // console.log("ssjtgjuykdfg")
            try{
                const otpInBody = req.body.otp
                const otp = req.session.Data.otp;
                const otpTimestamp = req.session.Data.otpTimestamp;
                const currentDate = Date.now();
                console.log(currentDate-otpTimestamp)
                if(otpInBody === otp && (currentDate - otpTimestamp)<= 600000 ){
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
                    if((currentDate - otpTimestamp) > 60000){
                        req.session.Data.otp =null;
                        return res.render('OTP',{message: "otp expired"})
                    }
                    else{
                        return res.render('OTP',{message: "Incorrect Otp"})

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
        const userData = await User.findById(req.session.user);
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

        await User.findByIdAndUpdate({_id:req.session.user},{$set:{
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
        const result = await addressModel.findOneAndUpdate(
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

        
        const address = await addressModel.findOne({ userId: req.session.user});
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
 
//         const product = await Product.find().populate('category');

//         const categories = await categoryModel.find();

//         res.render('shop', { product, categories });
//     } catch (error) {
//         console.log(error);
//     }
// };

// const loadshop = async (req, res) => {
//     try {
//         const sortby = req.query.sortby || null;
//         const category = req.query.category || null;

//         const perPage = 8;
//         let page = parseInt(req.query.page) || 1;
//         let sortQuery = {};

//         // Validate page number to prevent out-of-range errors
//         if (page < 1) {
//             page = 1;
//         }

//         // Calculate total number of products
//         const totalpdts = await productModel.countDocuments({});
//         // Calculate total number of pages
//         const totalPage = Math.ceil(totalpdts / perPage);

//         switch (sortby) {
//             case 'name_az':
//                 sortQuery = { pname: 1 };
//                 break;
//             case 'name_za':
//                 sortQuery = { pname: -1 };
//                 break;
//             case 'price_low_high':
//                 sortQuery = { offprice: 1 };
//                 break;
//             case 'price_high_low':
//                 sortQuery = { offprice: -1 };
//                 break;
//             case 'rating_lowest':
//                 sortQuery = { rating: 1 };
//                 break;
//             default:
//                 sortQuery = { all: -1 }; // Setting a default sorting option
//                 break;
//         }

//         let productData;

//         if (category) {
//             // Fetch products based on category, pagination, and sorting
//             productData = await productModel.find({ category: category })
//                 .sort(sortQuery)
//                 .skip(perPage * (page - 1))
//                 .limit(perPage);
//         } else {
//             // Fetch products based on pagination and sorting
//             productData = await productModel.find({})
//                 .sort(sortQuery)
//                 .skip(perPage * (page - 1))
//                 .limit(perPage);
//         }

//         // Fetch user and category data
//         const userData = req.session.user ? await User.findById(req.session.user) : null;
//         const categoryData = await categoryModel.find({});

//         // Fetch wishlist data if user is logged in
//         let findWish = {};
//         if (req.session.user && req.session.user._id) {
//             const wishlistData = await Wishlist.findOne({ user_id: req.session.user._id });
//             if (wishlistData) {
//                 for (let i = 0; i < productData.length; i++) {
//                     findWish[productData[i]._id] = wishlistData.products.some(p => p.productId.equals(productData[i]._id));
//                 }
//             }
//         }

//         for (let i = 0; i < productData.length; i++) {
//             const product = productData[i];
//             let offerPrice = product.offprice; // Initialize offer price with original price
//             let discountPercentage = product.discountPercentage; // Initialize discount percentage with original value
//             if (categoryData && categoryData.length > 0 && product.category) {
//                 const category = categoryData.find(cat => cat._id.toString() === product.category.toString());
//                 if (category && category.offer && new Date(category.offer.startDate) <= new Date() && new Date(category.offer.endDate) >= new Date()) {
//                     const productPrice = product.price;
//                     const productDiscountPercentage = product.discountPercentage;
//                     const categoryDiscount = category.offer.discount;
//                     const maxDiscount = Math.max(productDiscountPercentage, categoryDiscount);
//                     offerPrice = productPrice - (productPrice * maxDiscount / 100);
//                     discountPercentage = maxDiscount;
//                 }
//             }

//             productData[i].offprice = offerPrice;
        
//         }


//       const categories = await categoryModel.find({ is_blocked: false });
//         res.render('shop', { user: userData, product: productData, category: categoryData,categories, page, totalPage, sortby, findWish, selectedCategory: req.query.category  });

//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };
const loadshop = async (req, res) => {
    try {
        const sortby = req.query.sortby || null;
        const category = req.query.category || null;

        const perPage = 8;
        let page = parseInt(req.query.page) || 1;

        // Validate page number to prevent out-of-range errors
        if (page < 1) {
            page = 1;
        }

        // Initialize sortQuery with default value
        let sortQuery = {};

        // Determine sorting order based on the sortby parameter
        switch (sortby) {
            case 'name_az':
                sortQuery = { name: 1 };
                break;
            case 'name_za':
                sortQuery = { name: -1 };
                break;
            case 'price_low_high':
                sortQuery = { price: 1 };
                break;
            case 'price_high_low':
                sortQuery = { price: -1 };
                break;
            case 'rating_lowest':
                sortQuery = { rating: 1 };
                break;
            // Add more cases if needed
            default:
                // Default sorting
                sortQuery = { _id: -1 };
                break;
        }

        // Construct query based on category (if provided)
        const query = category ? { category: category } : {};

        // Fetch total number of products
        const totalpdts = await Product.countDocuments(query);
        // Calculate total number of pages
        const totalPage = Math.ceil(totalpdts / perPage);

        // Fetch products based on query, pagination, and sorting
        const productData = await Product.find(query)
            .sort(sortQuery)
            .skip(perPage * (page - 1))
            .limit(perPage);

        // Fetch user data if logged in
        const userData = req.session.user ? await User.findById(req.session.user) : null;
        // Fetch category data
        const categoryData = await categoryModel.find({});

        // Fetch wishlist data if user is logged in
        let findWish = {};
        if (req.session.user && req.session.user._id) {
            const wishlistData = await Wishlist.findOne({ user_id: req.session.user._id });
            if (wishlistData) {
                for (let i = 0; i < productData.length; i++) {
                    findWish[productData[i]._id] = wishlistData.products.some(p => p.productId.equals(productData[i]._id));
                }
            }
        }

        // Modify productData to include offer price
        for (let i = 0; i < productData.length; i++) {
            const product = productData[i];
            // Modify offer price here
            productData[i].offprice = calculateOfferPrice(product, categoryData);
        }

        // Fetch categories
        const categories = await categoryModel.find({ is_active: true });

        // Render the shop page with data
        // res.render('shop', { user: userData, product: productData, category: categoryData, categories, page, totalPage, sortby, findWish, selectedCategory: req.query.category });
        // Render the shop page with data
        res.render('shop', { user: userData, product: productData, category: categoryData, categories, page, totalPage: totalPage, sortby, findWish, selectedCategory: req.query.category });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};





// Function to calculate offer price
function calculateOfferPrice(product, categoryData) {
    let offerPrice = product.price; // Initialize offer price with original price
    if (categoryData && categoryData.length > 0 && product.category) {
        const category = categoryData.find(cat => cat._id.toString() === product.category.toString());
        if (category && category.offer && new Date(category.offer.startDate) <= new Date() && new Date(category.offer.endDate) >= new Date()) {
            const productPrice = product.price;
            const productDiscountPercentage = product.discountPercentage;
            const categoryDiscount = category.offer.discount;
            const maxDiscount = Math.max(productDiscountPercentage, categoryDiscount);
            offerPrice = productPrice - (productPrice * maxDiscount / 100);
        }
    }
    return offerPrice;
}


// Function to calculate offer price
function calculateOfferPrice(product, categoryData) {
    let offerPrice = product.offprice; // Initialize offer price with original price
    if (categoryData && categoryData.length > 0 && product.category) {
        const category = categoryData.find(cat => cat._id.toString() === product.category.toString());
        if (category && category.offer && new Date(category.offer.startDate) <= new Date() && new Date(category.offer.endDate) >= new Date()) {
            const productPrice = product.price;
            const productDiscountPercentage = product.discountPercentage;
            const categoryDiscount = category.offer.discount;
            const maxDiscount = Math.max(productDiscountPercentage, categoryDiscount);
            offerPrice = productPrice - (productPrice * maxDiscount / 100);
        }
    }
    return offerPrice;
}



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


  const loadInvoice=async(req,res)=>{
    try {
      const id=req.query.id
      const findOrder=await Order.findById({_id:id})
  
  
      const proId = [];
  
      for (let i = 0; i < findOrder.items.length; i++) {
        proId.push(findOrder.items[i].productId);
      }
  
      const proData = [];
  
      for (let i = 0; i < proId.length; i++) {
        proData.push(await Product.findById({ _id: proId[i] }));
      }
  
      
      
  
  
  
      res.render("invoice",{proData, findOrder})
      
    } catch (error) {
      console.log(error.message)
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
    addToWallet,
    loadInvoice
    
    
    
}