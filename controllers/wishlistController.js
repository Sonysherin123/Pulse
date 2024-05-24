// const Product = require("../model/productmodel");
const Product = require('../model/productmodel');
const userModel = require('../model/userModel');
const Wishlist=require('../model/wishlistModel');

const User = require("../model/userModel");

const cartmodel = require("../model/cartmodel");


const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.body.id;
        console.log(req.body.productId);
        const product = await Product.findOne({ _id: productId });

        if (product) { // Check if product exists
            let wishlist = await Wishlist.findOne({ user_id: userId });

            if (!wishlist) {
                wishlist = new Wishlist({
                    user_id: userId,
                    products: [{ productId: product._id }]
                });
            } else {
                // Check if the product already exists in the wishlist
                const existingProductIndex = wishlist.products.findIndex(item => item.productId.toString() === productId);
                if (existingProductIndex === -1) {
                    wishlist.products.push({ productId: product._id });
                } else {
                    // Product already exists in wishlist
                    return res.json({ status: false, message: 'Product already exists in wishlist' });
                }
            }

            await wishlist.save();
            return res.json({ status: true });
        } else {
            // Handle the case where product is null
            return res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};






const removeWishlist = async (req, res) => {
    try {
        const id = req.body.id;
        
       
        let wishlist = await Wishlist.findOne({ user_id: req.session.user });
        
    
        
        const index = wishlist.products.indexOf(id);
        
        wishlist.products.splice(index-1, 1);

   
        await wishlist.save();

        return res.json({ status: true });

    } catch (error) {
        console.error('Error removing product from wishlist:', error.message);
        res.status(500).send('Internal server error.');
    }
}

const loadWishlist=async(req,res)=>{
    try{
        // const perPage=5;
        // const page=req.query.page || 1;
        // const user = await userModel.findOne({ _id: req.session.user_id});
        // const wishLength=await wishlist.countDocuments({ user: user._id });
        // const totalPage=Math.ceil(wishLength / perPage);
        console.log(req.session.user)
      const cart = await cartmodel.findOne({userId:req.session.user});
      console.log(cart)
        let wishlist = await Wishlist.findOne({user_id:req.session.user}).populate({path:'products.productId', model:'products' })
       console.log(wishlist)
        
        res.render('wishlist',{wish:wishlist,cart})
    }
    catch(error){
        console.log(error.message);
    }
}
module.exports={
    addToWishlist,
    removeWishlist,
    loadWishlist
}