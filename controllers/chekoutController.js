const User = require("../model/userModel");
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
  key_id: 'rzp_test_xaGkIpXmOWb28y',
  key_secret: '7l3JbQrUmZdZ8tocVjWSV07y',
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
    console.log(req.body);
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
      if (findCoupon) {
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
          coupon: findCoupon.couponCode,
          discount: findCoupon.discount
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
    // else {
    //   res.status(400).json({ error: "Razorpay signature verification failed." });
    // }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

  
const loadWallet = async (req, res) => {
  try {
    console.log(req.session.user);
    const userWallet = await Wallet.findOne({ userId: req.session.user });
    console.log('.......',userWallet);
    res.render("wallet", { userWallet })
  }
  catch (error) {
    console.log(error.message);
  }
}





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


module.exports = {
    loadCheckOutPage,
    razopayment,
    loadWallet,
    addWalletCash,
    addCash
    

}