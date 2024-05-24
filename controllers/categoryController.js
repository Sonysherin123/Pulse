const Category = require("../model/categorymodel");
const bcrypt = require('bcrypt');

const loadCategory=async (req, res) => {
    try {
        console.log("get cat");
        const category=await Category.find({});
        res.render('category',{category,message:null})
    }
    catch (error) {
        
        console.log(error.message);
       
    }
};

const createCategory = async (req, res) => {
    try {
        console.log("create cat");
       
        const name = req.body.name;
        console.log(name)
        const dis = req.body.description;
        console.log(dis)
        const existingcate = await Category.findOne({
        
            name: name.toLowerCase(),
        
      }) || null;
      console.log(existingcate)
      if(existingcate!==null){
        const categorydetails = await Category.find({});
          res.render('category',{category:categorydetails,message:'name is already entered'})
      }else{

        const cat = new Category({
            name: name.toLowerCase(),
            description: dis 
        });

        const catData = await cat.save();

        res.redirect('/admin/category');}
      
    } catch (error) {
        console.log(error.message);
        res.render('category',{category:categorydetails,message:'name is already entered'})
      
    }
};

const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id;
        
        const categoryData = await Category.findById(id);

        if (categoryData) {
            res.render('editcategory', { cate: categoryData,message:null });
        } else {
            res.redirect('/admin/category');
        }
    } catch (error) {
       
        console.log(error.message);
       
        res.status(500).send('Internal Server Error');
    }
};

const updateCategory = async(req,res)=>{
    try{
        console.log('hi');
        console.log(req.body.name);
      const Data=await Category.findByIdAndUpdate({_id:req.query.id},{$set:{ name:req.body.name,description:req.body.description}});
      console.log(Data);
      if(Data){
        res.redirect('/admin/category');
      }
      
    }
    catch(error){
      console.log(error.message);
    }
  };

const deleteCategory = async (req, res) => {
    try {
    
        const id = req.query.id;
        let category=await Category.findById(id)
        if(category.is_active){
            await Category.findByIdAndUpdate(id, { is_active: false });

        }else{
            await Category.findByIdAndUpdate(id, { is_active: true });
        }

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
};





module.exports = {
    createCategory,
     editCategoryLoad,
     updateCategory,
     deleteCategory,
    loadCategory
 };