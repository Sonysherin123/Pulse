const User = require("../model/userModel");
const Product = require("../model/productmodel");
const Cart = require("../model/cartmodel");
const Address = require("../model/addressmodel");
const categoryModel=require("../model/categorymodel")
const order=require("../model/ordermodel");
const generateOrder = require("../util/otphandle");
const generateDate = require("../util/dategenerater");


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
      const orderMonth = parseInt(orderDateParts[1], 10) - 1; // Months are zero-based in JavaScript
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
  
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.body.id;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const findOrder = await order.findById(orderId);

    if (!findOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

   
    await order.findByIdAndUpdate(orderId, {
      $set: {
        status: "Canceled"
      }
    });

   
    for (const item of findOrder.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          countInStock: item.quantity
        }
      });
    }

    res.json({ message: 'Order canceled successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


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





// const saveOrder = async (req, res) => {
//           try {
        
//             const { status, id } = req.body
        
//             console.log(id, status)
        
//             const checking = await order.findById({ _id: id })
//             console.log(checking, "checking sts in orderr");
//             if (checking.status == status) {
//               res.json({ status: "notChanged" })
//             } else {
//               const updateStatus = await order.findByIdAndUpdate({ _id: id }, {
//                 $set: {
//                   status: status
//                 }
//               })
        
//             }
//             if (status == "Returned") {
//               console.log("entered sts== returned");
        
//               const findOrder = await order.findById({ _id: id })
//               console.log(findOrder, "orderfinded in return ullilll");
//               const demo=findOrder.orderType
//               console.log(demo)
//               if (findOrder.orderType == "Cash On Delivery") {
//                 console.log("entered cod for return");
//                 const date = generateDate();
//                 const Tid = generateOrder.generateOrder();
        
//                 const pdtId = [];
        
//                 for (let i = 0; i < checking.items.length; i++) {
//                   pdtId.push(checking.items[i].productId);
//                 }
        
//                 for (let i = 0; i < pdtId.length; i++) {
//                   await Product.findByIdAndUpdate(
//                     { _id: pdtId[i] },
//                     {
//                       $inc: {
//                         countInStock: checking.items[i].quantity,
//                       },
//                     }
//                   );
//                 }
//               }
//             }
//           }
//           catch (error) {
//             console.log(error.message)
//           }
//         }
// const userInWallet = await Wallet.findOne({ userId: findUser._id })
        
//               console.log(userInWallet)
        
//               if (userInWallet) {
//                 console.log("inside userWallet")
//                 const updateWallet = await Wallet.findOneAndUpdate({ userId: findUser._id },
//                   {
//                     $inc: {
//                       balance: findOrder.totalAmount
//                     },
//                     $push: {
//                       transactions: {
//                         id: Tid,
//                         date: date,
//                         amount: findOrder.totalAmount,
//                         orderType: 'Razorpay',
//                         type: 'Credit'
                       
        
//                       }
//                     }
//                   })
//               } else {
//                 console.log("else worked");
//                 const createWallet = new Wallet({
//                   userId: findUser._id,
//                   balance: findOrder.totalAmount,
//                   transactions: [{
//                     id: Tid,
//                     date: date,
//                     amount: findOrder.totalAmount,
//                     orderType: 'Razorpay',
//                     type: 'Credit'
                    
        
//                   }]
//                 })
        
//                 await createWallet.save()
//               }
          
        
        
        
//             res.json({ status: true })
        
        
          
          
        
        
        
        
        





module.exports = {
  loadViewOrder,
  loadadminorder,
  orders,
  cancelOrder,
  loadOrderDetail,
  //saveOrder,
  //cancelOrder

};