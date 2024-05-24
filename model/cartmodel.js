const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true, 
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products", 
          required: true,
        },
        subTotal: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    coupon:{
      type:String
    },
    discount:{
      type:Number
    }

  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Cart", cartSchema); 