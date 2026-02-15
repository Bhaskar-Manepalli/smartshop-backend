const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
    default: 1,
  },
  stock: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  totalItems: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true  // Match Product.js - automatically adds createdAt and updatedAt
});
/*
// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce(function(acc, item) {
    return acc + item.quantity;
  }, 0);
  
  this.totalPrice = this.items.reduce(function(acc, item) {
    return acc + (item.price * item.quantity);
  }, 0);
  
  next();
});
*/
module.exports = mongoose.model('Cart', cartSchema);
