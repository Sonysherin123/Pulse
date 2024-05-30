const User = require("../model/userModel");
require('dotenv').config();
// const Product = require("../model/productmodel");
const  Product= require('../model/productmodel');
const Cart = require("../model/cartmodel");
const Address = require("../model/addressmodel");
const categoryModel=require("../model/categorymodel")
const Order=require("../model/ordermodel");
const crypto=require('crypto')
const coupon=require('../model/couponmodel')
const Wallet=require('../model/walletmodel');
const generateOrder = require("../util/otphandle")
const Razorpay = require('razorpay');
const generateDate = require("../util/dategenerater");


var instance = new Razorpay({
 key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});


const loadCheckOutPage = async (req, res) => {
  try {
      const userData = await User.findOne({ _id: req.session.user });
 
      const cartData = await Cart.findOne({ userId: userData._id }).populate({path:'items.productId',model:'products'});

      if (!cartData) {
          return res.status(404).json({ error: "Cart not found" });
      }

      // Filter out-of-stock items
      const cartItems = cartData.items.filter(item => item.productId.countInStock >= 0);
      
      const address = await Address.find({ userId: userData._id });

      res.render("checkout", { cartItems, cartData, address });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: error.message });
  }
};



const razopayment = async (req, res) => {
  try {
    const { payment, order, addressId, order_num, amount, couponCode, index } = req.body;
    
    const findCoupon = await coupon.findOne({ couponCode: couponCode });

    let hmac = crypto.createHmac("sha256", '7l3JbQrUmZdZ8tocVjWSV07y');
    hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
    hmac = hmac.digest("hex");

    if (hmac == payment.razorpay_signature) {
      const userData = await User.findById(req.session.user);
      const cartData = await Cart.findOne({ userId: userData._id });

      const pdtData = cartData.items;

      for (const item of pdtData) {
        const product = await Product.findById(item.productId);
        product.countInStock -= item.quantity;
        await product.save();
      }

      const orderNum = generateOrder.generateOrder();
      const addressData = await Address.findOne({ "address._id": addressId });
      let address = addressData.address[index];
      const date = generateDate();

      let orderData;
      if (cartData.coupon) {
        orderData = new Order({
          userId: userData._id,
          orderNumber: orderNum,
          userEmail: userData.email,
          items: pdtData,
          totalAmount: amount,
          orderType: "Razorpay",
          orderDate: date,
          status: "Processing", // Initial status
          shippingAddress: address,
          coupon: cartData.coupon,
          discount: cartData.discount
        });
      } else {
        orderData = new Order({
          userId: userData._id,
          orderNumber: orderNum,
          userEmail: userData.email,
          items: pdtData,
          totalAmount: amount,
          orderType: "Razorpay",
          orderDate: date,
          status: "Processing", // Initial status
          shippingAddress: address
        });
      }

      const savedOrder = await orderData.save();
      await Cart.findByIdAndDelete(cartData._id);

      res.json({ status: true, order: savedOrder });
    } 
    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

  
const loadWallet = async (req, res) => {
  try {
    const userWallet = await Wallet.findOne({ userId: req.session.user });

    if (userWallet && userWallet.transactions) {
      userWallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.render("wallet", { userWallet });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};








const addWalletCash = async (req, res) => {
  try {
    const amount = req.body.Amount;
    const orderId = generateOrder.generateOrder();

    var options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "" + orderId,
    };

    instance.orders.create(options, async (err, razopayWallet) => {
      if (!err) {
        res.json({ status: true, wallet: razopayWallet, Amount: amount });
      } else {
        console.log(err.message);
      }
    });

  } catch (error) {
    console.log(error.message);
  }
};



const addCash = async (req, res) => {
  try {
    const { wallet, id, amount } = req.body;
   
    let hmac = crypto.createHmac("sha256", keySecret);

    hmac.update(wallet.razorpay_order_id + "|" + wallet.razorpay_payment_id);
    hmac = hmac.digest("hex");
    if (hmac == wallet.razorpay_signature) {
      const id = generateOrder.generateOrder()
      const date = generateDate();
      const userData = await User.findOne(req.session.user);
      const userInWallet = await Wallet.findOne({ userId: userData._id });
      if (userInWallet) {
        const updateWallet = await Wallet.findByIdAndUpdate(
          { _id: userInWallet._id },
          {
            $inc: {
              balance: amount,
            },
            $push: {
              transactions: {
                id: id,
                date: date,
                amount: amount,
                orderType: 'Razorpay',
                type: 'Credit'
              },
            }
          }
        );
      } else {
        console.log("else enter");
        const newWallet = new Wallet({
          userId: userData._id,
          balance: amount,
          transactions: [
            {
              id: id,
              amount: amount,
              date: date,
              orderType: 'Razorpay',
              type: 'Credit'
            }
          ]
        })
        await newWallet.save()
      }
    }

    res.json({ status: true })
  } catch (error) {
    console.log(error.message);
  }
};

const invoice = async (req, res) => {
  try {
    const id = req.query.id;
    const findOrder = await Order.findById({ _id: id }).populate({ path: 'items.productId', model: 'Product' });

    if (!findOrder) {
      return res.status(404).send('Order not found');
    }

    let pdttotal = 0;
    for (let i = 0; i < findOrder.items.length; i++) {
      pdttotal += findOrder.items[i].subTotal;
    }
    const discountAmount = (pdttotal * (findOrder.discount / 100)).toFixed(2);
    

    const discount = findOrder.discount;

    const vatRate = (discount / 100); 

    const vatAmount = pdttotal * vatRate;
    const totalWithVAT = pdttotal - vatAmount;
    const data = {
      "documentTitle": "INVOICE", 
      "currency": "INR",
      "taxNotation": "gst", 
      "marginTop": 25,
      "marginRight": 25,
      "marginLeft": 25,
      "marginBottom": 25,
      "logo": "/public/assets/images/logo/cc.png", 
      "background": "/public/assets/images/logo/cc.png", 
      "sender": {
          "company": "PULSE",
          "address": "Kongad, Palakkad, Kerala",
          "zip": "678632",
          "city": "Kongad",
          "country": "India" 
      },
      "client": {
          "company": findOrder.shippingAddress[0].name.trim(),
          "address": findOrder.shippingAddress[0].homeAddress,
          "zip": findOrder.shippingAddress[0].pincode,
          "city": findOrder.shippingAddress[0].city,
          "country": findOrder.shippingAddress[0].state 
      },
      "products": findOrder.items.map(item => ({
          "quantity": item.quantity.toString(),
          "description": item.productId.pname,
          "price": item.subTotal / item.quantity,
      })),
      "discountApplied": {
          "couponCode": findOrder.couponCode,
          "couponPercentage": findOrder.couponPercentage
      }
    };

    const result = await easyinvoice.createInvoice(data);
  
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=myInvoice.pdf');
    res.send(Buffer.from(result.pdf, 'base64'));
  } catch (error) {
    console.error('Error generating invoice:', error.message);
    res.status(500).send('Error generating invoice');
  }
};

const continuePayment = async (req,res)=>{
  try{
  
    const id=req.body.id
    
    const findOrder=await Order.findById(id)
  
    const pdtData = [];

     

    const stringOrder_id=findOrder.orderNumber.toString()

    var options={
      amount:findOrder.totalAmount*100,
      currency:"INR",
      receipt:stringOrder_id
    }

    instance.orders.create(options,async(error,razorpayOrder)=>{
 
      if(!error){
    
        res.json({status:true,order:razorpayOrder,orderId:findOrder._id})
        findOrder.status='Processing'
        await findOrder.save();
      }else{
        console.error(error);
      }
    })
  }
  catch(error){
    console.log(error.message);
  }
}


// const continuePayment = async (req, res) => {
//   try {
    
//     const id = req.body.id;
    
//     const findOrder = await Order.findById(id);
//     if (!findOrder) {
//       return res.status(404).json({ status: false, message: "Order not found" });
//     }
    
//     const userData = await User.findById(req.session.user);
//     if (!userData) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     const cartData = await Cart.findOne({ userId: userData._id });
//     if (!cartData) {
//       return res.status(404).json({ status: false, message: "Cart not found" });
//     }

//     const pdtData = [];
//     for (let i = 0; i < findOrder.items.length; i++) {
//       pdtData.push(findOrder.items[i]);
//     }

//     for (const item of findOrder.items) {
//       const product = await Product.findById(item.productId);
//       if (!product) {
//         return res.status(404).json({ status: false, message: `Product with ID ${item.productId} not found` });
//       }
//       if (product.countInStock < item.quantity) {
//         return res.status(400).json({ status: false, message: `Insufficient stock for product ${product.name}` });
//       }
//     }

//     const stringOrder_id = findOrder.orderNumber.toString();

//     var options = {
//       amount: findOrder.totalAmount * 100,
//       currency: "INR",
//       receipt: stringOrder_id
//     };

//     instance.orders.create(options, async (error, razorpayOrder) => {
//       if (!error) {
//         await Cart.findByIdAndDelete(cartData._id);
//         res.json({ status: true, order: razorpayOrder, orderId: findOrder._id });
//       } else {
//         console.error(error);
//         res.status(500).json({ status: false, message: "Error creating Razorpay order" });
//       }
//     });
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ status: false, message: "Internal server error" });
//   }
// };


const paymentFailed =  async(req,res)=>{
  try{
    const {amount,address,couponCode,index}=req.body;
    const userData = await User.findById(req.session.user);
    const cartData = await Cart.findOne({ userId: userData._id });
    const date = generateDate();
    const orderNum = generateOrder.generateOrder();

  
      const addressData = await Address.findOne({ "address._id": address });
      let addressin = addressData.address[index]

      const pdtData = [];

      for (let i = 0; i < cartData.items.length; i++) {
        pdtData.push(cartData.items[i]);
      }
      const orderData = new Order({
        userId: userData._id,
        orderNumber: orderNum,
        userEmail: userData.email,
        items: pdtData,
        totalAmount: amount,
        orderType: "Razorpay",
        orderDate: date,
        status: "Payment Failed",
        shippingAddress: addressin,
        
      });
      const pay = await orderData.save();
      res.json({status:200,order:orderData})
  }catch(error){
    console.log(error.message);
  }
}

const successPayment=async(req,res)=>{
  try {
    const {response,order}=req.body

   
    let hmac = crypto.createHmac("sha256", keySecret);

    hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id);
    hmac = hmac.digest("hex");

    if(hmac == response.razorpay_signature){
      // const userData = await User.findOne(req.session.user);
      // const cartData = await Cart.findOne({ userId: userData._id });
      const updateOrder=await Order.findByIdAndUpdate({_id:order},{
        $set:{
          status:"Processing"
        }
        
      })
      await updateOrder.save();

      const orderup  = await Order.findById({_id:order}) 
      res.json({status:true,order: orderup})

    }

  } catch (error) {
    console.log(error.message)
  }
}





module.exports = {
    loadCheckOutPage,
    razopayment,
    loadWallet,
    addWalletCash,
    addCash,
    invoice,
    continuePayment,
    paymentFailed,
    successPayment

    

}