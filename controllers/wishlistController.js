const Product = require("../model/productmodel");
const userModel = require('../model/userModel');
const Wishlist=require('../model/wishlistModel');

const User = require("../model/userModel");

const cartmodel = require("../model/cartmodel");


 const  addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.body.id;
        console.log(req.body.productId);
        const product = await Product.findOne({_id:productId});
        let wishlist = await Wishlist.findOne({ user_id: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                user_id: userId,
                products: [{ productId: product._id }]
            });
        } else {
            // Check if the product already exists in the wishlist
            const existingProduct = wishlist.products.find(item => item.productId.toString() === productId);
            if (!existingProduct) {
                wishlist.products.push({ productId: product._id });
            }
        }

        await wishlist.save();
        return res.json({ status: true });
    } catch (error) {
        console.error('Error adding to wishlist:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// const addToWishlist = async (req, res) => {
//     try {
//         const id = req.query.id;
//         const user = await userModel.findOne({ email: req.session.email });

//         let wishlist = await wishlistModel.findOne({ user: user._id });
     
        
//         if (!wishlist) {
//             wishlist = new wishlistModel({
//                 user: user._id,
//                 product: [id]
//             });
            
//         } else {

//             wishlist.product.push(id);
//         }

//         await wishlist.save();
//         res.status(200).send('Product added to wishlist successfully.');
//     } catch (err) {
//         console.error('addToWishlist:', err.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

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
        let wishlist = await Wishlist.findOne({user_id:req.session.user}).populate({path:'products.productId', model:Products })
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