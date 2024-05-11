const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    description:{
        type:String,
        required:true,
        trim:true,
    },
    is_active:{
        type:Boolean,
        default:true
    },offer: {
        discount:{
            type:Number
        },
        startDate:{
            type:String,
        },
        endDate:{
            type:String
        },
    },
});

module.exports = mongoose.model('category',categorySchema);


