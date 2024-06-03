const User = require("../model/userModel");
const Product = require('../model/productmodel');

const Cart = require("../model/cartmodel");
const Address = require("../model/addressmodel");
const categoryModel=require("../model/categorymodel")
const order=require('../model/ordermodel')
const generateDate = require("../util/dategenerater");
const generateOrder = require("../util/otphandle")
const Coupon=require('../model/couponmodel');
const Razorpay=require('razorpay');
const ordermodel = require("../model/ordermodel");
const walletmodel = require("../model/walletmodel");

var instance = new Razorpay({
    key_id: 'rzp_test_xaGkIpXmOWb28y',
    key_secret: '7l3JbQrUmZdZ8tocVjWSV07y',
  });
  

// const loadCart = async (req, res) => {
//     try {
//         const userId=req.session.user;
//         console.log(userId);
//         let userCart = await Cart.findOne({ userId: userId }).populate({path:'items.productId',model:'products'}) || null;
       
//         console.log(userCart);
//         if(userCart !==null){
            
//         if( userCart.items.length>0){
//             res.render('cart',{cartData:userCart})
//         }}
      
//     } catch (error) {
//         console.log(error.message);
//     }
// }
// const loadCart = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         console.log(userId);
//         let userCart = await Cart.findOne({ userId: userId }).populate({ path: 'items.productId', model: 'products' }) || null;

//         console.log(userCart);
//         if (userCart !== null) {
//             if (userCart.items.length > 0) {
//                 // Filter out-of-stock items
//                 const validItems = userCart.items.filter(item => item.productId.countInStock > 0);

//                 // If there are no valid items, show an alert
//                 if (validItems.length === 0) {
//                     return res.send('<script>alert("All items in your cart are currently out of stock."); window.location.href = "/cart";</script>');
//                 }

//                 // Update the cart with valid items
//                 userCart.items = validItems;
//                 res.render('cart', { cartData: userCart });
//             }
//         }

//     } catch (error) {
//         console.log(error.message);
//     }
// }
const loadCart = async (req, res) => {
    try {
        const userId = req.session.user;
        
        let userCart = await Cart.findOne({ userId: userId }).populate({ path: 'items.productId', model: 'products' }) || null;

        console.log(userCart);
        if (userCart !== null) {
            if (userCart.items.length > 0) {
                
                const validItems = userCart.items.filter(item => item.productId.countInStock > 0);

                
                if (validItems.length === 0) {
                    return res.send('<script>alert("All items in your cart are currently out of stock."); window.location.href = "/cart";</script>');
                }

                
                userCart.items = validItems;
            }
        } else {
            
            userCart = { items: [] };
        }
        
        
        res.render('cart', { cartData: userCart });

    } catch (error) {
        console.log(error.message);
    }
}


const loadCartinWish = async (req, res) => {
    try {
        
        const userId = req.session.user;
        const productId = req.body.id;

        
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        
        const pdtData = await Product.findById(productId);
        if (!pdtData) {
            return res.status(404).json({ message: 'Product not found' });
        }

        
        let userCart = await Cart.findOne({ userId: userId });
        if (!userCart) {
        
            userCart = new Cart({
                userId: userId,
                items: [{
                    productId: pdtData._id,
                    subTotal: pdtData.price,
                    quantity: 1,
                }],
                total: pdtData.price,
            });
        } else {
            
            const existingCartItem = userCart.items.find(item => item.productId.toString() === productId);

            if (existingCartItem) {
                if (existingCartItem.quantity < pdtData.countInStock && existingCartItem.quantity < 5) {
                    
                    existingCartItem.quantity += 1;
                    existingCartItem.subTotal = existingCartItem.quantity * pdtData.price;
                } else {
                    
                    return res.status(400).json({ message: 'Maximum quantity per person reached' });
                }
            } else {
                
                userCart.items.push({
                    productId: productId,
                    quantity: 1,
                    subTotal: pdtData.price,
                });
            }

            
            userCart.total = userCart.items.reduce((total, item) => total + item.subTotal, 0);
        }

        
        await userCart.save();

        
        await Wishlist.findOneAndUpdate({ user_id: userId }, { $pull: { products: { productId: productId } } });

        // Redirect to the cart page
        return res.redirect('/cart');
    } catch (error) {
        console.log('Error adding to cart from wishlist:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// const add_to_cart = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         const productId = req.body.id;

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         let userCart = await Cart.findOne({ userId: userId });

//         if (!userCart) {
//             userCart = new Cart({
//                 userId: userId,
//                 items: [{
//                     productId: product._id,
//                     subTotal: product.price,
//                     quantity: 1
//                 }],
//                 total: product.price,
//             });

//             await userCart.save();
//             return res.json({ status: true });
//         } else {
//             const existingCartItem = userCart.items.find(item => item.productId.toString() === productId);

//             if (existingCartItem) {
//                 if (existingCartItem.quantity < product.countInStock && existingCartItem.quantity < 5) {
//                     existingCartItem.quantity += 1;
//                     existingCartItem.subTotal = existingCartItem.quantity * product.price;
//                 } else {
//                     return res.status(400).json({ message: 'Maximum quantity per person reached' });
//                 }
//             } else {
//                 userCart.items.push({
//                     productId: productId,
//                     quantity: 1,
//                     subTotal: product.price,
//                 });
//             }

//             userCart.total = userCart.items.reduce((total, item) => total + item.subTotal, 0);
//             await userCart.save();
//             return res.redirect('/cart');
//         }

//     } catch (err) {
//         console.log('Error adding to cart:', err.message);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }
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
                // Check if quantity is less than the maximum allowed and less than 5
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

// const addOrder = async (req, res) => {
//     try {
        
//         const { addressId, cartid, checkedOption,paymentOption,totalDis,code } = req.body;
        

//         const findCoupon = await Coupon.findOne({couponCode:code})
//          console.log(findCoupon);

//         if(!addressId || !paymentOption){
//             res.json({status:"fill the options"})
//         }
//         else if(paymentOption == "Cash On Delivery"){
//             const userData = await User.findById(req.session.user);
//             console.log('req.session.user');
//             const cartData = await Cart.findOne({ userId: userData._id });
//             console.log("dfghjkl")
    
//             const pdtData = [];
    
//             for (let i = 0; i < cartData.items.length; i++) {
//                 pdtData.push(cartData.items[i]);
//             }
    
//             const orderNum = generateOrder.generateOrder();
    
//             const addressData = await Address.findOne({ "address._id": addressId });
//             console.log(addressData);

//             const index = addressData.address.findIndex(addr => addr._id === addressId);
//             const address = addressData.address[index];

//             if (index === -1) {
//                 // Handle case when address is not found
//                 console.log('Address not found');
//             } else {
//                 const address = addressData.address[index];
//                 // Proceed with your logic using the found address
//             }

//             console.log();
    
//             const date = generateDate()


//             for (const item of cartData.items) {
//                 const product = await Product.findById(item.productId);
//                 product.countInStock -= item.quantity; 
//                 await product.save();
//             }

//               if(cartData.coupon){
//                 const orderData = new order({
//                     userId: userData._id,
//                     orderNumber: orderNum,
//                     userEmail: userData.email,
//                     items: pdtData,
//                     totalAmount:totalDis,
//                     orderType: paymentOption,
//                     orderDate: date,
//                     status: "Processing",
//                     shippingAddress: [...addressData.address],
//                     coupon : cartData.coupon,
//                     discount : cartData.discount
//                 });
        
//                 await orderData.save();


//                 const updateCoupon = await Coupon.findByIdAndUpdate({_id:findCoupon._id},
//                     {
//                         $push:{
//                             users : userData._id
//                         }
//                     })
        
//                     res.json({ status: true, order: orderData });
//                     await Cart.findByIdAndDelete({ _id: cartData._id });
        
//               }
//               else{
//                 const orderData = new order({
//                     userId: userData._id,
//                     orderNumber: orderNum,
//                     userEmail: userData.email,
//                     items: pdtData,
//                     totalAmount:totalDis,
//                     orderType: paymentOption,
//                     orderDate: date,
//                     status: "Processing",
//                     shippingAddress: [...addressData.address],
                    
//                 });
        
//                 await orderData.save();

//                 res.json({ status: true, order: orderData });
//             await Cart.findByIdAndDelete({ _id: cartData._id });
//               }
    
            
    
    
            
    
//         }
//         else if(paymentOption == "Razorpay"){
//             const userData = await User.findById(req.session.user);
//             const cartData = await Cart.findOne({ userId: userData._id });
            
//             const pdtData = [];
    
//             for (let i = 0; i < cartData.items.length; i++) {
//                 pdtData.push(cartData.items[i]);
//             }
    
//             const orderNum = generateOrder.generateOrder();
//             const stringOrder_id=orderNum.toString()
//             const addressData = await Address.findOne({ "address._id": addressId });
//             let address = addressData.address[index]
//             const date = generateDate()
        
//             // for (const item of cartData.items) {
//             //     const product = await Product.findById(item.productId);
//             //     product.countInStock -= item.quantity; // Reduce countInStock by the ordered quantity
//             //     await product.save();
//             //     // console.log(product,"saved");
//             // }

//             var options = {
//                 amount: totalDis * 100,
//                 currency: "INR",
//                 receipt: stringOrder_id
//               };

//               let amount = Number(totalDis)
           
//               instance.orders.create(options, function(err, razpayOrder) {
//                 if(!err){
//                     console.log(razpayOrder ,"order razooo");
//                     res.json({status:"razorpay",order:razpayOrder,orderNumber:orderNum,total:amount,code:code,address:addressId})
//                 }
//                 else{                   
//                      console.log("error else ");

//                     console.error(err.message);
//                 }
//               });
//         }
        



//     } catch (error) {
//         console.log(error);
//     }
// };
const addOrder = async (req, res) => {
    try {
        const { addressId, cartid, checkedOption, paymentOption, totalDis, code } = req.body;
        
        // Find coupon by code
        const findCoupon = await Coupon.findOne({ couponCode: code });
       

        if (!addressId || !paymentOption) {
            return res.json({ status: "fill the options" });
        } 

        if (paymentOption === "Cash On Delivery") {
            const userData = await User.findById(req.session.user);
            if (!userData) {
                return res.status(404).json({ message: 'User not found' });
            }

            const cartData = await Cart.findOne({ userId: userData._id });
            if (!cartData) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            console.log("User Data:", userData);
            console.log("Cart Data:", cartData);

            const pdtData = cartData.items.map(item => item);
            const orderNum = generateOrder.generateOrder();

            const addressData = await Address.findOne({ "address._id": addressId });
            if (!addressData) {
                return res.status(404).json({ message: 'Address not found' });
            }

            // console.log('Address Data:', addressData);

            const index = addressData.address.findIndex(addr => addr._id.toString() === addressId.toString());
            console.log(index,'index');
            if (index === -1) {
                return res.status(404).json({ message: 'Address index not found' });
            }
            

            const address = addressData.address[index];
            console.log('Shipping Address:', address);

            const date = generateDate();
            console.log(date+'date');

            for (const item of cartData.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.countInStock -= item.quantity;
                    await product.save();
                }
            }
            
            const orderData = new order({
                userId: userData._id,
                orderNumber: orderNum,
                userEmail: userData.email,
                items: pdtData,
                totalAmount: totalDis,
                orderType: paymentOption,
                orderDate: date,
                status: "Processing",
                shippingAddress: address,
                coupon: cartData.coupon || undefined,
                discount: cartData.discount || undefined
            });

            await orderData.save();
            

            

            cartData.items=[]
            await cartData.save();
            console.log('updated');
            return res.json({ status: true, order: orderData });

        } else if (paymentOption === "Razorpay") {
            console.log("razorpayyyyyyyyyyyyyyyyyyyyyyyyyy");
            const userData = await User.findById(req.session.user);
            console.log(userData);
            if (!userData) {
                return res.status(404).json({ message: 'User not found' });
            }

            const cartData = await Cart.findOne({ userId: userData._id });
            if (!cartData) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            // console.log("User Data:", userData);
            console.log("Cart Data:", cartData);

            const pdtData = cartData.items.map(item => item);
            const orderNum = generateOrder.generateOrder();
            const stringOrder_id = orderNum.toString();

            const addressData = await Address.findOne({ "address._id": addressId });
            if (!addressData) {
                return res.status(404).json({ message: 'Address not found' });
            }

            console.log(addressData);

            const index = addressData.address.findIndex(addr => addr._id.toString() === addressId.toString());
            if (index === -1) {
                return res.status(404).json({ message: 'Address not found' });
            }

            console.log(index,"indx");

            const address = addressData.address[index];
            console.log('Shipping Address:', address);

            const date = generateDate();
            const options = {
                amount: totalDis * 100,
                currency: "INR",
                receipt: stringOrder_id
            };

            instance.orders.create(options, function(err, razpayOrder) {
                if (!err) {
                    console.log('Razorpay Order:', razpayOrder);
                    return res.json({
                        status: "razorpay",
                        order: razpayOrder,
                        orderNumber: orderNum,
                        total: totalDis,
                        code: code,
                        address: addressId
                    });
                } else {
                    console.error('Razorpay Error:', err.message);
                    return res.status(500).json({ message: 'Razorpay order creation failed' });
                }
            });
        }else if (paymentOption === 'wallet') {
         
            const wallet = await walletmodel.findOne({ userId: req.session.user});
            const userData = await User.findById(req.session.user);
        
            const cartData = await Cart.findOne({ userId: userData._id });    
            if (wallet && wallet.balance >= cartData.total) {

                
            if (!cartData) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            // console.log("User Data:", userData);
            console.log("Cart Data:", cartData);

            const pdtData = cartData.items.map(item => item);
            const orderNum = generateOrder.generateOrder();
            const stringOrder_id = orderNum.toString();

            const addressData = await Address.findOne({ "address._id": addressId });
            if (!addressData) {
                return res.status(404).json({ message: 'Address not found' });
            }

            console.log(addressData);

            const index = addressData.address.findIndex(addr => addr._id.toString() === addressId.toString());
            if (index === -1) {
                return res.status(404).json({ message: 'Address not found' });
            }

            console.log(index,"indx");

            const address = addressData.address[index];
            console.log('Shipping Address:', address);

            const date = generateDate();
                
                const orderData = new order({
                    userId: req.session.user._id,
                    orderNumber: orderNum,
                    userEmail: req.session.user.email,
                    items: cartData.items,  
                    totalAmount: cartData.total,
                    orderType: paymentOption,
                    orderDate: date,
                    status: "Processing",
                    shippingAddress: address,
                    coupon: cartData.coupon || undefined,
                    discount: cartData.discount || undefined
                });
        
                // Save the order data
                await orderData.save();
        
                // Deduct the order total from the wallet balance
                wallet.balance -= cartData.total;
        
                // Add a transaction record to the wallet
                wallet.transactions.push({
                    id: wallet.transactions.length + 1, // Ensure unique transaction ID
                    date: new Date().toISOString(),
                    amount: cartData.total,
                    orderType: paymentOption,
                    type: 'Debit'
                });
        
                // Save the updated wallet data
                await wallet.save();
        
                // Send a response back to the client
                res.status(200).json({ status: true, order: orderData });
            } else {
                res.status(400).json({ status: false, message: "Insufficient wallet balance" });
            }
        }
        
         else {
            return res.status(400).json({ message: 'Invalid payment option' });
        }
    } catch (error) {
        console.error('Error in addOrder:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
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
        res.render('orderplaced', { orders, pdtData })

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
    loadorderPlaced,
    loadCartinWish
}