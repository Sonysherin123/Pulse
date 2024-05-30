const couponCode = require('../util/couponGenerater');
const Coupon = require("../model/couponmodel");
const Cart = require("../model/cartmodel");
const User = require("../model/userModel")
const generateDate = require("../util/dategenerater");
const cartmodel = require('../model/cartmodel');


const loadCouponPage = async (req,res)=>{
    try{
        const couponData =await Coupon.find({});
        res.render('adminCoupon',{couponData})
    }
    catch(error){
        console.log(error.message);
    }
}
const loadAddCoupon = async (req,res)=>{
    try{
        res.render('addCoupon');
    }
    catch(error){
        console.log(error.message);
    }
}


const addCoupon = async(req,res)=>{
    try{

        const {nameValue,endDate,maximum,discount,startDate,Minimum} =req.body;



        const addCoupon = new Coupon({
            name : nameValue,
            startDate : startDate,
            endDate : endDate,
            minimumAmount : Minimum,
            maximumAmount : maximum,
            discount : discount,
            couponCode : "Cc" + couponCode(6)
        })

        await addCoupon.save()

        res.json({status:true});

    }
    catch(error){
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Coupon name already exists' });
          }
          console.log(error.message);
          res.status(500).json({ error: 'An error occurred' });
    }

}



const loadEditCoupon=async(req,res)=>{
    try {
        const id=req.query.id
        const findCoupon=await Coupon.findById({_id:id})
        res.render("editCoupon",{findCoupon})
    } catch (error) {
        console.log(error.messagge)
    }
}
const editCoupon=async(req,res)=>{
    try {
        const{Minimum,startDate,nameValue,endDate,maximum,discount}=req.body
        
          const id=req.body.id
          
       
        const couponData= await Coupon.findOneAndUpdate({_id:id},{
            $set:{
                name:nameValue,
                startDate:startDate,
                endDate:endDate,
                minimumAmount:Minimum,
                maximumAmount:maximum,
                discount:discount,
            }
        })
    
       res.json({status:true})
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Coupon name already exists' });
          }
          console.log(error.message);
          res.status(500).json({ error: 'An error occurred' });
    }
}





const loadCoupon = async (req, res) => {
    try {
      const id = req.query.id;
  
      const cart = await cartmodel.findOne({ userId: req.session.user });
      if (!cart) {
        throw new Error('Cart not found for the user.');
      }
  
      const cartTotal = cart.total;
  

      const CouponDataArray = await Coupon.find({
        users: { $nin: [req.session.user] },
        isActive: true,
        minimumAmount: { $lte: cartTotal }  
        ,maximumAmount:{$gte:cartTotal}
      });
  
      const redeemCoupon = await Coupon.find({
        users: { $in: [req.session.user] }
      });
  
      res.render("coupon", { CouponDataArray, redeemCoupon });
    } catch (error) {
      console.log('Error in coupon:', error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  
  
//const blockCoupon = async (req,res)=>{
//     try{
//         const id = req.body.id;
        
//         const findCoupon = await Coupon.findById({_id:id});
        
//         if(findCoupon.isActive == true){
//             const updateCoupon = await Coupon.findByIdAndUpdate({_id:id},
//                 {
//                     $set:{
//                         isActive : false,
//                     }
//                 })

//                 res.json({status:true})
//         }
//         else{
            
//             const updateCoupon = await Coupon.findByIdAndUpdate({_id:id},
//                 {
//                     $set:{
//                         isActive : true,
//                     }
//                 })
//                 const a = await Coupon.findById({_id:id})
                
//                 res.json({status:false})

//         }
//     }
//     catch(error){
//         console.log(error.message);
//     }
 
const blockCoupon = async (req, res) => {
    try {
        const id = req.body.id;
        
        const findCoupon = await Coupon.findById({_id: id});
        
        let newStatus = !findCoupon.isActive; // Toggle the isActive status

        const updateCoupon = await Coupon.findByIdAndUpdate({_id: id}, {
            $set: {
                isActive: newStatus,
                
            }
        });

        res.json({status: newStatus});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'An error occurred' });
    }
}


const applyCoupon=async(req,res)=>{
    try {
      
        const {code,id}=req.body
       
        const findCart=await Cart.findOne({_id:id})
        const findCode=await Coupon.findOne({couponCode:code})
        const findUser=await User.findById(req.session.user)
    
        if(findCode){
            if(findCart.total>=findCode.minimumAmount && findCart.total<=findCode.maximumAmount){       
                const userIncoupon=await Coupon.findOne({_id:findCode._id,users:findUser._id})
                
                // let result=false
                // for(let i=0;i<findCode.users.length;i++){
                //     const userIncoupon=await Coupon.findById({_id:findCode._id,"users"})
                // }
               
                // console.log(userIncoupon)
               
                if(userIncoupon){                   
                    res.json({status:"invalid"})
                }else{
                    const amount= (findCart.total/100)*findCode.discount
                     findCart.coupon=findCode.couponCode;
                     findCart.discount=amount;
                     await findCart.save();
                    
                    // const updateCart=await Cart.findByIdAndUpdate({_id:findCart._id},{
                    //     $inc:{
                    //         total:-amount
                    //     }
                    // })

                    res.json({status:true,total:amount,cartTotal:findCart.total,code:code})
                }
            }else{
                res.json({status:"invaild"})
            }
           
        }else if (findCode !== code){
            res.json({status:"invaild"})
        }
        
    } catch (error) {
        console.log(error.message)
    }
}
const removeCoupon = async (req, res) => {
    try {
        const { id } = req.body;

        
        const findCart = await Cart.findOne({ _id: id });

        if (findCart && findCart.coupon) {
            
            findCart.coupon = null;
            findCart.discount = 0;
            await findCart.save();

            res.json({ status: true, message: "Coupon removed successfully", cartTotal: findCart.total });
        } else {
            res.json({ status: false, message: "No coupon to remove or cart not found" });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ status: false, message: "An error occurred" });
    }
};
  





module.exports = {
    loadCouponPage,
    loadAddCoupon,                          
    addCoupon,
    loadEditCoupon,
    editCoupon,
    loadCoupon,
    blockCoupon,
    applyCoupon,
    removeCoupon

}