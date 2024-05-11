
const WalletModel=require('../model/walletmodel');
const OrderModel=require('../model/ordermodel');

const userModel = require("../model/userModel")
// const addtoWallet = async (req, res) => {
    
//     try {
//         const { orderId, userId } = req.body;
      

//         const order = await OrderModel.findById(orderId);
       
//         if (!order) {
//             return res.status(404).json({ success: false, message: 'Order not found' });
//         }

//         const user = await userModel.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         let wallet = await WalletModel.findOne({ user: userId });
//         if (!wallet) {
          
//             wallet = new WalletModel({
//                 user: userId,
//                 balance: 0, 
//                 transactions: [] 
//             });
//         }

//         wallet.balance += order.billTotal;
//         wallet.transactions.push({
//             amount: order.billTotal,
//             type: 'credit',
//             reason: 'Refund for order ' + orderId
//         });

//         await wallet.save();

//         return res.json({ success: true, message: 'Amount refunded successfully' });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, error: 'Internal server error' });
//     }
// };

const addtoWallet = async (req, res) => {
    try {
        const { orderId, userId } = req.body;

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let wallet = await WalletModel.findOne({ userId: userId });
        if (!wallet) {
            // If wallet doesn't exist, create a new one
            wallet = new WalletModel({
                userId: userId,
                balance: 0,
                transactions: []
            });
        }

        // Update wallet balance
        wallet.balance += order.billTotal; // Add the refunded amount

        // Push transaction details
        wallet.transactions.push({
            amount: order.billTotal,
            orderType: 'Refund', // Assuming this is a refund
            type: 'Credit', // Assuming this is a credit to the wallet
            reason: 'Refund for order ' + orderId
        });

        // Save the updated wallet
        await wallet.save();

        return res.json({ success: true, message: 'Amount refunded successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

module.exports={
addtoWallet
}
