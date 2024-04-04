const User = require("../model/userModel");
const Product = require("../model/productmodel");
const Cart = require("../model/cartmodel");
const Address = require("../model/addressmodel");


const loadCart = async (req, res) => {
    try {

res.render('cart',{cartData:null,pdtData:null})


    }
    catch (error) {
        console.log(error.message);
        // res.status(500).send("Internal Server Error");
    }
}
const add_to_cart = async(req,res)=>{
    try {
        const user = await userModel.findOne({ email: req.session.email });
        if (!user) {
            console.log('User is not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id;
        const {productId} = req.body;

        const product = await productModel.findById(productId);
    
        if (!product) {
            console.log('Product is not found');
            return res.status(404).json({ message: 'Product not found' });
        }

        let userCart = await cartModel.findOne({ owner: userId });
        if (!userCart) {
            userCart = new cartModel({
                owner: userId,
                items: [],
                billTotal: 0,
            });
        }
        
        const existingCartItem = userCart.items.find(item => item.productId.toString() === productId);

        if (existingCartItem) {
            if (existingCartItem.quantity < product.countInStock && existingCartItem.quantity < 5) {
                existingCartItem.quantity += 1;
                existingCartItem.price = existingCartItem.quantity * product.price;
            } else {
                return res.status(400).json({ message: 'Maximum quantity per person reached' });
            }
        } else {
            
            userCart.items.push({
                productId: productId,
              
                quantity: 1,
                
                price: product.price,
                
            });
        }

        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);

        await userCart.save();
        return res.redirect('/cart');
    } catch (err) {
        console.log('Error adding to cart:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }

}

module.exports = {
    loadCart,
    add_to_cart

}