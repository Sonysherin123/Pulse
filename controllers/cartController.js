const User = require("../model/userModel");
const Product = require("../model/productmodel");

const Cart = require("../model/cartmodel");
const Address = require("../model/addressmodel");
const categoryModel=require("../model/categorymodel")
const order=require('../model/ordermodel')
const generateDate = require("../util/dategenerater");
const generateOrder = require("../util/otphandle")
const Coupon=require('../model/couponmodel');
const Razorpay=require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_ca6f519OHo30qU',
    key_secret: 'VwPfNUhPxTUpIN8R27IbwWI8',
  });
  

const loadCart = async (req, res) => {
    try {
        const userId=req.session.user;
        console.log(userId);
        let userCart = await Cart.findOne({ userId: userId }).populate({path:'items.productId',model:'Products'}) || null;
       
        console.log(userCart);
        if(userCart !==null){
            
        if( userCart.items.length>0){
            res.render('cart',{cartData:userCart})
        }}
      
    } catch (error) {
        console.log(error.message);
    }
}

const add_to_cart = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.body.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let userCart = await Cart.findOne({ userId: userId });

        if (!userCart) {
            userCart = new Cart({
                userId: userId,
                items: [{
                    productId: product._id,
                    subTotal: product.price,
                    quantity: 1
                }],
                total: product.price,
            });

            await userCart.save();
            return res.json({ status: true });
        } else {
            const existingCartItem = userCart.items.find(item => item.productId.toString() === productId);

            if (existingCartItem) {
                if (existingCartItem.quantity < product.countInStock && existingCartItem.quantity < 5) {
                    existingCartItem.quantity += 1;
                    existingCartItem.subTotal = existingCartItem.quantity * product.price;
                } else {
                    return res.status(400).json({ message: 'Maximum quantity per person reached' });
                }
            } else {
                userCart.items.push({
                    productId: productId,
                    quantity: 1,
                    subTotal: product.price,
                });
            }

            userCart.total = userCart.items.reduce((total, item) => total + item.subTotal, 0);
            await userCart.save();
            return res.redirect('/cart');
        }

    } catch (err) {
        console.log('Error adding to cart:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const increment = async (req, res) => {
    try {
        console.log("User ID:", req.session.user); // Log session user ID
        const { pdtId, qty } = req.body;
        const quantity = parseInt(qty);
        const pdtData = await Product.findById(pdtId); 
        // console.log(pdtData);
        const stock = pdtData.countInStock;
        const prices = pdtData.price; 

        const filter = { userId: req.session.user, 'items.productId': pdtData._id };
        console.log("Filter:", filter); // Log filter object

        const findCart = await Cart.findOne({ userId: req.session.user });
        console.log("Cart:", findCart); // Log findCart object

        if (!findCart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        if (stock > quantity) {
            if (quantity < 5) {
                const update = { 
                    $inc: { 
                        "items.$.quantity": 1, 
                        "items.$.subTotal": prices, 
                        "total": prices // Increment total by the price of the product
                    } 
                };
                
                const updatedCart = await Cart.findOneAndUpdate(filter, update, { new: true });
                res.json({ status: true, total: updatedCart.total });
            } else {
                res.json({ status: "minimum" });
            }
        } else {
            res.json({ status: "stock" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message }); // Sending error response
    }
}


const decrement = async (req, res) => {
    try {
        console.log("User ID:", req.session.user); // Log session user ID
        const { pdtId, qty } = req.body;
        const pdtIdString = pdtId.toString();
        const quantity = parseInt(qty);
        const pdtData = await Product.findById(pdtIdString); 
        const prices = pdtData.price;

        const filter = { userId: req.session.user, 'items.productId': pdtIdString };
        console.log("Filter:", filter); // Log filter object

        const findCart = await Cart.findOne({ userId: req.session.user });
        console.log("Cart:", findCart); // Log findCart object

        if (!findCart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        if (quantity > 1) {
            const update = {
                $inc: { "items.$.quantity": -1, "items.$.subTotal": -prices, "total": -prices }
            };

            const updatedCart = await Cart.findOneAndUpdate(filter, update, { new: true });
            res.json({ status: true, total: updatedCart.total });
        } else {
            res.json({ status: "minimum" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
}


const removeCart = async (req, res) => {
    try {
        const id = req.body.id;
        const sbt = req.body.sbt;
    
        const delePro = await Cart.findOneAndUpdate({ userId: req.session.user}, {
            $pull: { items: { productId: id } },
            $inc: { "total": -sbt }
        });
        
        if (!delePro) {
            return res.status(404).json({ error: "Cart not found" });
        }

        const findPro = await Cart.findOne({ userId: req.session.user});

        if (!findPro) {
            return res.status(404).json({ error: "Cart not found" });
        }

        res.json({ status: true, total: findPro.total });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};
// const addOrder = async (req, res) => {
//     try {
        
//         const { addressId, paymentOption, totalDis, index } = req.body;

//         if (!addressId || !paymentOption) {
//             return res.json({ status: "Fill in all the required options" });
//         }

//         if (paymentOption === "Cash On Delivery") {
//             const userData = await User.findById(req.session.user);
//             const cartData = await Cart.findOne({ userId: userData._id });

//             if (!cartData) {
//                 return res.json({ status: "No cart found for the user" });
//             }

//             const pdtData = cartData.items;
//             const orderNum = generateOrder.generateOrder();
//             const addressData = await Address.findOne({
//                 userId: req.session.user,
//                 address: { $elemMatch: { _id: addressId } }
//             });
            
          
//             if (!addressData) {
//                 return res.json({ status: "Address not found" });
//             }

//             const address = addressData.address[index];
//             const date = generateDate();

//             for (const item of pdtData) {
//                 const product = await Product.findById(item.productId);

//                 if (!product) {
//                     return res.json({ status: "Product not found" });
//                 }

//                 product.countInStock -= item.quantity;
//                 await product.save();
//             }
           
//             const orderData = new order({
//                 userId: userData._id,
//                 orderNumber: orderNum,
//                 userEmail: userData.email,
//                 items: pdtData,
//                 totalAmount: totalDis,
//                 orderType: paymentOption,
//                 orderDate: date,
//                 status: "Processing",
//                 shippingAddress: address
//             });

//             await orderData.save();
//             cartData.items=[];
//             cartData.total=0;
//             await cartData.save()
         
//             return res.json({ status: true, order: orderData });
//         } else {
//             return res.json({ status: "Invalid payment option" });
//         }
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ status: "Internal Server Error" });
//     }
// };

const addOrder = async (req, res) => {
    try {
        const { addressId, cartid, checkedOption,paymentOption,totalDis,code, index } = req.body;


        const findCoupon = await Coupon.findOne({couponCode:code})

        if(!addressId || !paymentOption){
            res.json({status:"fill the options"})
        }
        else if(paymentOption == "Cash On Delivery"){
            const userData = await User.findById(req.session.user);
            const cartData = await Cart.findOne({ userId: userData._id });
    
            const pdtData = [];
    
            for (let i = 0; i < cartData.items.length; i++) {
                pdtData.push(cartData.items[i]);
            }
    
            const orderNum = generateOrder.generateOrder();
    
            const addressData = await Address.findOne({ "address._id": addressId });
    
            let address = addressData.address[index]
    
            const date = generateDate()


            for (const item of cartData.items) {
                const product = await Product.findById(item.productId);
                product.countInStock -= item.quantity; 
                await product.save();
            }

              if(findCoupon){
                const orderData = new order({
                    userId: userData._id,
                    orderNumber: orderNum,
                    userEmail: userData.email,
                    items: pdtData,
                    totalAmount:totalDis,
                    orderType: paymentOption,
                    orderDate: date,
                    status: "Processing",
                    shippingAddress: address,
                    coupon : findCoupon.couponCode,
                    discount : findCoupon.discount
                });
        
                await orderData.save();


                const updateCoupon = await Coupon.findByIdAndUpdate({_id:findCoupon._id},
                    {
                        $push:{
                            users : userData._id
                        }
                    })
        
                    res.json({ status: true, order: orderData });
                    await Cart.findByIdAndDelete({ _id: cartData._id });
        
              }else{
                const orderData = new order({
                    userId: userData._id,
                    orderNumber: orderNum,
                    userEmail: userData.email,
                    items: pdtData,
                    totalAmount:totalDis,
                    orderType: paymentOption,
                    orderDate: date,
                    status: "Processing",
                    shippingAddress: address,
                    
                });
        
                await orderData.save();

                res.json({ status: true, order: orderData });
            await Cart.findByIdAndDelete({ _id: cartData._id });
              }
    
            
    
    
            
    
        }
        else if(paymentOption == "Razorpay"){
            const userData = await User.findById(req.session.user);
            const cartData = await Cart.findOne({ userId: userData._id });
            
            const pdtData = [];
    
            for (let i = 0; i < cartData.items.length; i++) {
                pdtData.push(cartData.items[i]);
            }
    
            const orderNum = generateOrder.generateOrder();
            const stringOrder_id=orderNum.toString()
            const addressData = await Address.findOne({ "address._id": addressId });
            let address = addressData.address[index]
            const date = generateDate()
        
            // for (const item of cartData.items) {
            //     const product = await Product.findById(item.productId);
            //     product.countInStock -= item.quantity; // Reduce countInStock by the ordered quantity
            //     await product.save();
            //     // console.log(product,"saved");
            // }

            var options = {
                amount: totalDis * 100,
                currency: "INR",
                receipt: stringOrder_id
              };

              let amount = Number(totalDis)
           
              instance.orders.create(options, function(err, razpayOrder) {
                if(!err){
                    console.log(razpayOrder ,"order razooo");
                    res.json({status:"razorpay",order:razpayOrder,orderNumber:orderNum,total:amount,code:code,address:addressId})
                }
                else{                   
                     console.log("error else ");

                    console.error(err.message);
                }
              });
        }
        



    } catch (error) {
        console.log(error);
    }
};

const loadorderPlaced = async (req, res) => {
    try {
        const id = req.query.id;
      
        const orders = await order.findOne({ orderNumber: id });
        const pdt = [];

        for (let i = 0; i < orders.items.length; i++) {
            pdt.push(orders.items[i].productId)
        }

        const pdtData = [];
        for (let i = 0; i < pdt.length; i++) {
            pdtData.push(await Product.findById({ _id: pdt[i] }))
        }
        res.render('orderPlaced', { orders, pdtData })

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




module.exports = {
    loadCart,
    add_to_cart,
    increment,
    decrement,
    removeCart,
    addOrder,
    loadorderPlaced
}