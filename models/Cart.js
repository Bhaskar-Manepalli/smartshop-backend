const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {  // Your model uses 'product', not 'productId'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  stock: {  // Remove this field or make it optional
    type: Number,
    required: false,  // Changed from required: true
    default: 0
  }
});

const cartSchema = new mongoose.Schema({
  user: {  // Your model uses 'user', not 'userId'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
