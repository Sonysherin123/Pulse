const User = require("../model/userModel");

const Product = require('../model/productmodel');
const Cart = require("../model/cartmodel");
const Address = require("../model/addressmodel");
const categoryModel=require("../model/categorymodel")
const order=require("../model/ordermodel");
const generateOrder = require("../util/otphandle");
const generateDate = require("../util/dategenerater");
const Wallet=require('../model/walletmodel');

const Razorpay = require("razorpay");

const loadadminorder=async(req,res)=>{
    try {
      const perPage = 6;
      let page = parseInt(req.query.page) || 1;
  
      const totalOrders = await order.countDocuments({});
      const totalPage = Math.ceil(totalOrders / perPage);
  
      if (page < 1) {
        page = 1;
      } else if (page > totalPage) {
        page = totalPage;
      }
  
      const startSerialNumber = (page - 1) * perPage + 1;
  
      const orders = await order.find({})
        .sort({ _id: -1 })
        .skip(perPage * (page - 1))
        .limit(perPage);
  
      res.render('adminorder', { orderData: orders, page, totalPage, startSerialNumber });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
const loadViewOrder = async (req, res) => {
    try {
      const id = req.query.id;
      const findOrder = await order.findById({ _id: id })
      console.log(findOrder, 'findorder');
  
      const pdtId = [];
  
      for (let i = 0; i < findOrder.items.length; i++) {
        pdtId.push(findOrder.items[i].productId)
      }
      console.log(pdtId, "iddddddddddddd");
      const pdtData = [];
  
      for (let i = 0; i < pdtId.length; i++) {
        pdtData.push(await Product.findById({ _id: pdtId[i] }))
      }
      console.log(pdtData, "dataaaaaa");
  
      const orderDateParts = findOrder.orderDate.split('-');
      const orderDay = parseInt(orderDateParts[0], 10);
      const orderMonth = parseInt(orderDateParts[1], 10) - 1; 
      const orderYear = parseInt(orderDateParts[2], 10);
      const orderDate = new Date(orderYear, orderMonth, orderDay);
  
      // Calculate expected delivery date
      const expectedDeliveryDate = new Date(orderDate);
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);
      
      // Format expected delivery date to "dd-mm-yyyy" format
      const formattedDeliveryDate = `${expectedDeliveryDate.getDate()}-${expectedDeliveryDate.getMonth() + 1}-${expectedDeliveryDate.getFullYear()}`;
  
      res.render("orderView", { pdtData, findOrder ,expectedDeliveryDate: formattedDeliveryDate})
    }
    catch (error) {
      console.log(error.message);
    }
  }
  
  
  const orders = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user);
        const address = await Address.findOne({ userId: req.session.user});

        const perPage = 5; 
        let page = parseInt(req.query.page) || 1;

        const totalOrders = await order.countDocuments({ userId: req.session.user});
        const totalPage = Math.ceil(totalOrders / perPage);
        
        page = Math.max(1, Math.min(page, totalPage));

        const orders = await order.find({ userId: req.session.user })
            .sort({ _id: -1 })
            .skip(perPage * (page - 1))
            .limit(perPage);

        const pdtDataArray = await Promise.all(orders.map(async (order) => {
            const pdtId = order.items.map(item => item.productId);
            const pdtData = await Product.find({ _id: { $in: pdtId } });
            return pdtData;
        }));

        res.render('order', { userData, address, orders, pdtDataArray, page, totalPage,perPage  });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}
  

   

// const cancelOrder = async (req, res) => {
//   try {
//     const orderId = req.body.id;

    
//     const findOrder = await order.findById(orderId);
    
    
//     if (findOrder) {
      
//       const updateOrder = await order.findByIdAndUpdate(orderId, { $set: { status: "Canceled" } }, { new: true });
      
//       if (updateOrder) {
        
//         const paymentAmount = findOrder.amount; 
        
        
//         let wallet = await Wallet.findOne({ userId: findOrder.userId });
//         if (!wallet) {
          
//           wallet = new Wallet({ userId: findOrder.userId, balance: paymentAmount });
//           await wallet.save();
//         } else {
          
//           wallet.balance += paymentAmount;
//           await wallet.save();
//         }

        
//         const transaction = {
//           date: new Date(),
//           amount: paymentAmount,
//           orderType: findOrder.orderType,
//           type: "Credit" 
//         };
//         wallet.transactions.push(transaction);
//         await wallet.save();

        
//         return res.json({ status: true });
//       } else {
        
//         return res.status(400).json({ error: "Failed to cancel order. Please try again later." });
//       }
//     } else {
      
//       return res.status(404).json({ error: "Order not found." });
//     }
//   } catch (error) {
    
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };


// const cancelOrder = async (req, res) => {
//     try {
//         const orderId = req.body.id;
//         const findOrder = await order.findById(orderId);

//         if (!findOrder) {
//             return res.status(404).json({ error: "Order not found." });
//         }

//         const updateOrder = await order.findByIdAndUpdate(orderId, { $set: { status: "Canceled" } }, { new: true });

//         if (!updateOrder) {
//             return res.status(400).json({ error: "Failed to cancel order. Please try again later." });
//         }

//         const paymentAmount = findOrder.amount;

//         let wallet = await Wallet.findOne({ userId: findOrder.userId });

//         if (!wallet) {
//             wallet = new Wallet({ userId: findOrder.userId });
//         }

//         wallet.balance += paymentAmount;
//         const transaction = {
//             amount: paymentAmount,
//             orderType: findOrder.orderType,
//             type: "Credit"
//         };

//         wallet.transactions.push(transaction);
//         await wallet.save();

//         return res.json({ status: true });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "Internal server error." });
//     }
// };

function generateTransactionId() {
  let numbers = '1234567890'; // String containing numbers
  let id = '';
  
  // Generate a 10-digit random ID by selecting random numbers from the string
  for (let i = 0; i < 10; i++) {
    id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  // Convert the generated ID from string to integer
  return parseInt(id, 10);
}



const cancelOrder = async (req, res) => {
  try {
    console.log("inside cancel order lllllllll");
    const id = req.body.id;
    const findOrder = await order.findById(id);
    console.log(findOrder,"order")

    if (!findOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Cancel order and update product counts
    await order.findByIdAndUpdate(id, { $set: { status: "Canceled" } });
    for (const item of findOrder.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { countInStock: item.quantity } });
    }

    // Handle refunds for Razorpay payments
    if (findOrder.orderType === "Razorpay") {
      console.log("rezorpay")
      const findUser = await User.findById({_id :req.session.user}); // Assuming user is stored in session
      const date = new Date(); 
      const transactionId = generateTransactionId(); 
      // You need to define generateTransactionId function

      const userWallet = await Wallet.findOne({ userId: findUser._id });

      if (userWallet) {
        console.log("if working");
        // Update existing wallet
        await Wallet.findByIdAndUpdate(userWallet._id, {
          $inc: { balance: findOrder.totalAmount },
          $push: {
            transactions: {
              id: transactionId,
              date: date,
              amount: findOrder.totalAmount,
              orderType: 'Razorpay',
              type: 'Credit'
            }
          }
        });
      } else {
        console.log("else working");
        // Create new wallet for the user
        const newWallet = new Wallet({
          userId: findUser._id,
          balance: findOrder.totalAmount,
          transactions: [{
            id: transactionId,
            date: date,
            amount: findOrder.totalAmount,
            orderType: 'Razorpay',
            type: 'Credit'
          }]
        });
        await newWallet.save();
      }
    }

    return res.json({ status: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};










    
//     if (findOrder) {
//       // Update order status based on order type
//       let updateOrder;
//       if (findOrder.orderType === "Cash on Delivery" || findOrder.orderType === "Razorpay") {
//         updateOrder = await order.findByIdAndUpdate(id, { $set: { status: "Canceled" } }, { new: true });
//       }
      
//       // If order status updated successfully
//       if (updateOrder) {
//         // Logic for refunding stock or updating wallet goes here
//         // ...
        
//         // Respond with success status
//         return res.json({ status: true });
//       } else {
//         // If order status update failed
//         return res.status(400).json({ error: "Failed to cancel order. Please try again later." });
//       }
//     } else {
//       // If order document not found
//       return res.status(404).json({ error: "Order not found." });
//     }
//   } catch (error) {
//     // Handle any errors
//     console.log(error.message);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };


const loadOrderDetail = async (req, res) => {
  try {
    const id = req.query.id;
    const findOrder = await order.findById(id);
    console.log(findOrder, 'findOrder.......');
    
    let pdtId = [];
    for (let i = 0; i < findOrder.items.length; i++) {
      pdtId.push(findOrder.items[i].productId)
    }
    
    let pdtData = []

    for (let i = 0; i < pdtId.length; i++) {
      pdtData.push(await Product.findById(pdtId[i]));
    }

    res.render("orderDetails", { findOrder, pdtData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}
        
// const loadOrderDetail = async (req, res) => {
//   try {
//     const id = req.query.id
//     const findOrder = await order.findById({ _id: id })
//     console.log(findOrder, 'findOrder.......');
//     let pdtId = [];
//     for (let i = 0; i < findOrder.items.length; i++) {
//       pdtId.push(findOrder.items[i].productId)
//     }
//     // console.log(pdtId, 'iddddddddddd');
//     let pdtData = []

//     for (let i = 0; i < pdtId.length; i++) {
//       pdtData.push(await Product.findById({ _id: pdtId[i] }))
//     }
//     // console.log(pdtData, 'dataaaaaaaaaaaaaaaaaaa');

//     res.render("orderDetails", { findOrder, pdtData })
//   } catch (error) {
//     console.log(error.message)
//   }
// }



const saveOrder = async (req, res) => {
  try {
    const { status, id } = req.body;
    console.log(`Received request to update order with id: ${id} to status: ${status}`);

    // Check if the order exists
    const checking = await order.findById(id);
    if (!checking) {
      console.log(`Order with id: ${id} not found`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log('Order found:', checking);

    
    if (checking.status === status) {
      console.log('Order status is already the same:', status);
      return res.json({ status: "notChanged" });
    }

    
    checking.status = status;
    await checking.save();
    console.log(`Order status updated to: ${status}`);

    
    if (status === "Canceled") {
      console.log("Processing cancelled order");

      const userId = checking.userId;
      const orderTotal = checking.totalAmount;

      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        wallet = new Wallet({
          userId: userId,
          balance: 0,
          transactions: [],
        });
        console.log("Created new wallet for user");
      }

      wallet.balance += orderTotal;
      wallet.transactions.push({
        amount: orderTotal,
        orderType: 'Refund',
        type: 'Credit',
        reason: `Refund for order ${id}`,
      });
      await wallet.save();
      console.log("Wallet saved successfully");

      const pdtId = checking.items.map(item => item.productId);
      for (let i = 0; i < pdtId.length; i++) {
        await Product.findByIdAndUpdate(
          { _id: pdtId[i] },
          {
            $inc: { countInStock: checking.items[i].quantity },
          }
        );
        console.log(`Stock updated for product id: ${pdtId[i]}`);
      }
    }

    
    if (status === "Returned") {
      console.log("Processing returned order");

      const date = generateDate();
      const Tid = generateOrder();

      if (checking.orderType === "Cash On Delivery" || checking.orderType === "Razorpay") {
        console.log(`Order type is ${checking.orderType}`);

        const pdtId = checking.items.map(item => item.productId);
        for (let i = 0; i < pdtId.length; i++) {
          await Product.findByIdAndUpdate(
            { _id: pdtId[i] },
            {
              $inc: { countInStock: checking.items[i].quantity },
            }
          );
          console.log(`Stock updated for product id: ${pdtId[i]}`);
        }

        let userInWallet = await Wallet.findOne({ userId: checking.userId });
        if (!userInWallet) {
          userInWallet = new Wallet({
            userId: checking.userId,
            balance: checking.totalAmount,
            transactions: [{
              id: Tid,
              date: date,
              amount: checking.totalAmount,
              orderType: checking.orderType,
              type: 'Credit'
            }]
          });
          await userInWallet.save();
          console.log("New wallet created for user in return");
        } else {
          await Wallet.findOneAndUpdate(
            { userId: checking.userId },
            {
              $inc: { balance: checking.totalAmount },
              $push: {
                transactions: {
                  id: Tid,
                  date: date,
                  amount: checking.totalAmount,
                  orderType: checking.orderType,
                  type: 'Credit'
                }
              }
            }
          );
          console.log(`Wallet updated in return for ${checking.orderType}`);
        }
      }
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};










//  const returnRequest = async (req, res) => {
//           try {
//             const { id, reason } = req.body;
        
//             const findOrder = await order.findByIdAndUpdate(
//               { _id: id },
//               {
//                 $set: {
//                   status: "Return process",
//                 },
//               }
//             );
//             res.json({ status: true });
//           }
//           catch (error) {
//             console.log(error.message);
//           }
//         }
        
      
    
    
    
//     const cancelReturn = async (req, res) => {
//       try {
//         const id = req.body.id;
    
//         const findOrder = await order.findById({ _id: id });
    
//         const updateOrder = await order.findByIdAndUpdate(
//           { _id: id },
//           {
//             $set: {
//               status: "Delivered"
//             }
//           }
//         )
//         res.json({ status: true });
//       }
//       catch (error) {
//         console.log(error.message);
//       }
//     }
const returnRequest = async (req, res) => {
  try {
    
      const { id, reason } = req.body;
      const findOrder = await order.findByIdAndUpdate(
          id,
          { $set: { status: "Return process", returnReason: reason } },
          { new: true }
      );
      if (!findOrder) {
          return res.status(404).json({ status: false, message: 'Order not found' });
      }
      res.json({ status: true });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const cancelReturn = async (req, res) => {
  try {
      const { id } = req.body;
      const findOrder = await order.findByIdAndUpdate(
          id,
          { $set: { status: "Delivered" } },
          { new: true }
      );
      if (!findOrder) {
          return res.status(404).json({ status: false, message: 'Order not found' });
      }
      res.json({ status: true });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
          
        
        
        
        
        





module.exports = {
  loadViewOrder,
  loadadminorder,
  orders,
  cancelOrder,
  loadOrderDetail,
  saveOrder,
  cancelOrder,
  returnRequest,
  cancelReturn

};