const productModel = require("../model/productmodel");
const categoryModel = require('../model/categorymodel');
const userModel = require('../model/userModel');

const loadProduct = async (req, res) => {
    try {

        const productdetails = await productModel.find({}).populate('category');
        const categorydetails = await categoryModel.find();
        console.log(productdetails,"detailspdt");
        res.render('product', { product: productdetails, category: categorydetails, message: null });
    } catch (error) {
        console.log(error.message)
    }
};

const addProduct = async (req, res) => {
    try {
       
        const images = [];
        
      
        if (req.files && req.files.length > 0) {
            
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        } else {
            console.log('No files were uploaded');
          
           
        }

       
        let product={};
       
         product = new productModel({
            name: req.body.name,
            description: req.body.description,
            images: images,
            brand: req.body.brand,
            countInStock: req.body.stock,
            category: req.body.category,
            price: req.body.price

        });

    
        const savedProduct = await product.save();

        if (savedProduct) {
            return res.redirect('/admin/productlist');
        } else {
         
            return res.render('product', {  message: 'Error saving product.' });
        }
    } catch (error) {
        console.error('Error saving product:', error.message);
      
        return res.render('product', { message: 'Error saving product.' });
    }
};

const activeStatus = async (req, res) => {
    try {
        const { id, action } = req.query;
console.log('hi');
        if (action === 'InActive') {
            await productModel.findByIdAndUpdate({ _id: id }, { is_deleted: false });
        }
        else {
            await productModel.findByIdAndUpdate({ _id: id }, { is_deleted: true });
        }
        res.redirect('/admin/productlist')
    }
    catch (error) {
        console.log(error.message);
    }
}


const loadEdit = async (req, res) => {
    try {
        // Extract the product ID from the request query
        const id = req.query.id;

        // Retrieve the product data using the Product model
        const proData = await productModel.findById(id);

        // Retrieve the category data using the Category model
        const catData = await categoryModel.find({});

        // Render the editProduct page with the retrieved data
        res.render("editProduct", { catData, proData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const editProduct = async (req, res) => {
    try {

        let existingImages = [];
        const existingProduct = await productModel.findById(req.query.id);
        const categorydetails = await categoryModel.find();

        // Existing images are retained unless new images are uploaded
        if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
            existingImages = existingProduct.images;
        }
        console.log(req.body);
        let newImages = [];
        // Process new images if any
        if (req.files && req.files.length) {
            newImages = req.files.map(file => file.filename);
        }

        const allImages = existingImages.concat(newImages);

        // Limit images to 3
        if (allImages.length > 3) {
            return res.render('editproduct', { cate: categorydetails, proData: existingProduct, message: 'Maximum 3 images per product' });
        } else {
            // Update the product with new data
            const updatedProduct = await productModel.findByIdAndUpdate(req.query.id, {
                $set: {
                    name: req.body.name,
                    description: req.body.description,
                    images: allImages,
                    category: req.body.category,
                    price: req.body.price,
                    discountPrice: req.body.discountPrice, // Ensure this field exists in your schema
                    countInStock: req.body.stock,
                }
            }, { new: true }); // {new: true} to return the updated object

            if (updatedProduct) {
                return res.redirect('/admin/productlist');
            }
        }
    } catch (error) {
        console.log('update product:', error.message);
        res.status(500).send('An error occurred');
    }
};
const deleteimage = async (req, res) => {
    try {
        const id = req.query.id;
        const del = req.query.delete;

        const product = await productModel.findById(id);
        console.log(product, del, id);

        if (del) {
            const index = product.images.indexOf(del);
            if (index !== -1) {
                product.images.splice(index, 1);
                // Save the updated product to the database
                await product.save();
            }
        }

        res.redirect('/admin/edit-pro?id=' + id);
    } catch (err) {
        console.log(err.message);
        // Handle errors appropriately, perhaps send an error response
        res.status(500).send("Error deleting image");
    }
}

const Loadproduct = async(req,res)=>{
    try{
        const product =await productModel.find({})
        res.render('productlist',{pro:product})


    }catch(error){
    console.log(error);
}
};
 const searchProducts = async(req,res)=>{
    try{
        const {searchDataValue} = req.body
        const searchProducts = await Product.find({name:{
            $regex: searchDataValue , $options: 'i'
        }})
        // console.log(searchProducts);
        res.json({status:"searched",searchProducts})
  
    

    }catch(error){
        console.log(error)
    }
 }



module.exports = {
    loadProduct,
    editProduct,
    addProduct,
    activeStatus,
    loadEdit,
    deleteimage,
    Loadproduct,
    searchProducts
    
}