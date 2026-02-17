const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');

// Test route to verify cart routes work
router.get('/test-auth', protect, (req, res) => {
  res.json({ 
    message: 'Auth works!', 
    user: req.user.email 
  });
});

// Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id }); // ← Changed to user
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] }); // ← Changed to user
    }

    console.log('✅ Cart fetched for user:', req.user.email);

    res.json({
      success: true,
      cart: cart.items
    });
  } catch (error) {
    console.error('❌ Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
  try {
    console.log('\n🛒 Add to cart request:');
    console.log('User:', req.user?.email);
    console.log('Body:', req.body);

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { productId, name, price, image, quantity } = req.body;

    if (!productId || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id }); // ← Changed to user

    if (!cart) {
      console.log('Creating new cart...');
      cart = new Cart({
        user: req.user._id, // ← Changed to user
        items: [{ 
          product: productId,
          name, 
          price, 
          image: image || '', 
          quantity: quantity || 1 
        }]
      });
    } else {
      console.log('Cart exists, checking for duplicate...');
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        console.log('Item exists, updating quantity...');
        cart.items[existingItemIndex].quantity += (quantity || 1);
      } else {
        console.log('Adding new item...');
        cart.items.push({ 
          product: productId,
          name, 
          price, 
          image: image || '', 
          quantity: quantity || 1 
        });
      }
    }

    await cart.save();

    console.log('✅ Cart saved successfully');
    console.log('Cart items:', cart.items.length);

    res.json({
      success: true,
      message: 'Item added to cart',
      cart: cart.items
    });
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
});

// Update item quantity
router.put('/update/:productId', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }); // ← Changed to user

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.find(item => item.product.toString() === productId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    item.quantity = quantity;
    await cart.save();

    console.log('✅ Cart updated');

    res.json({
      success: true,
      message: 'Cart updated',
      cart: cart.items
    });
  } catch (error) {
    console.error('❌ Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
      error: error.message
    });
  }
});

// Remove item from cart
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id }); // ← Changed to user

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    console.log('✅ Item removed from cart');

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: cart.items
    });
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item',
      error: error.message
    });
  }
});

// Clear entire cart
router.delete('/clear', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }); // ← Changed to user

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    console.log('✅ Cart cleared');

    res.json({
      success: true,
      message: 'Cart cleared',
      cart: []
    });
  } catch (error) {
    console.error('❌ Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
});

module.exports = router;
