const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  updateOrderToPaid,
} = require('../controllers/orderController');
const { protect, seller, admin } = require('../middleware/auth');

// Customer routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/pay', protect, updateOrderToPaid);

// Seller/Admin routes
router.get('/', protect, seller, getAllOrders);
router.put('/:id/status', protect, seller, updateOrderStatus);

module.exports = router;
