const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  createReview,
} = require('../controllers/productController');
const { protect, seller } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes
router.post('/:id/reviews', protect, createReview);

// Seller routes
router.post('/', protect, seller, createProduct);
router.get('/seller/me', protect, seller, getSellerProducts);
router.put('/:id', protect, seller, updateProduct);
router.delete('/:id', protect, seller, deleteProduct);

module.exports = router;
