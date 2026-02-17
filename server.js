const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes'); // if you have this
const cartRoutes = require('./routes/cartRoutes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // if you have this
app.use('/api/cart', cartRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
