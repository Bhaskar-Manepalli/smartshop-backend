const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper function to calculate cart totals
const calculateTotals = (cart) => {
  cart.totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price images stock'
    );

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;

      if (cart.items[existingItemIndex].quantity > product.stock) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    } else {
      // Add new item
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '',
        quantity,
        stock: product.stock,
      });
    }

    // Calculate totals manually
    calculateTotals(cart);

    await cart.save();

    cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price images stock'
    );

    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(item.product);

    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    item.quantity = quantity;

    // Calculate totals manually
    calculateTotals(cart);

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price images stock'
    );

    res.json(updatedCart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    // Calculate totals manually
    calculateTotals(cart);

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price images stock'
    );

    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.totalPrice = 0;
    cart.totalItems = 0;

    await cart.save();

    res.json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
