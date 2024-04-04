const Category = require("../model/categorymodel");
const bcrypt = require('bcrypt');

const loadCategory=async (req, res) => {
    try {
        const category=await Category.find({});
        res.render('category',{category,message:null})
    }
    catch (error) {
        
        console.log(error.message);
       
    }
};

const createCategory = async (req, res) => {
    try {
        const name = req.body.name;
        const dis = req.body.description;
        const existingcate = await Category.findOne({
        
            name: name.toLowerCase(),
        
      });
      //console.log(existingUser);
      if(existingcate ){
        const categorydetails = await Category.find();
          res.render('category',{category:categorydetails,message:'name is already entered'})
      }
else{

        // Create a new category object with the provided name and description
        const cat = new Category({
            name: name.toLowerCase(),
            description: dis 
        });

        // Save the new category to the database
        const catData = await cat.save();

        // Respond with a success status
        res.redirect('/admin/category');}
      
    } catch (error) {
        // Log any errors that occur during the process
        console.log(error.message);
        // Respond with an error status
        res.status(500).json({ status: false, error: "Internal Server Error" });
    }
};

const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id;
        
        // Find the category by its ID
        const category = await Category.findById(id);

        if (category) {
            // Render the edit category page with the category data
            res.render('editcategory', { category });
        } else {
            // If category not found, redirect to the admin dashboard or any appropriate page
            res.redirect('/admin/category');
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.log(error.message);
        // You might want to render an error page or send an appropriate response
        res.status(500).send('Internal Server Error');
    }
};

const updateCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const categoryName = req.body.name;

        // Check if the category with the given name already exists
        const existingCategory = await Category.findOne({ name: categoryName });

        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            // If a category with the same name already exists (excluding the current category being updated)
            return res.status(400).send('Category already exists');
        }

        // Update the category in the database
        await Category.findByIdAndUpdate(categoryId, { name: categoryName });

        // Redirect to the appropriate page after successful update
        res.redirect('/admin/category');
    } catch (error) {
        // Handle any errors that occur during the process
        console.log(error.message);
        // You might want to render an error page or send an appropriate response
        res.status(500).send('Internal Server Error');
    }
};


const deleteCategory = async (req, res) => {
    try {
        
        const id = req.query.id;
        const category=await Category.findById(id);
        if(category.is_active){
            await Category.findByIdAndUpdate(id, { is_active: false });
        }else{
            await Category.findByIdAndUpdate(id, { is_active: true });
        }
        res.status(200)
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