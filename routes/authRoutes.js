const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/emailService');

// 1️⃣ REGISTER USER (Create Account) - FIXED
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("📝 Registration attempt for:", email);

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (unverified)
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      role: 'customer'
    });

    console.log("✅ User created:", newUser._id);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any old OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
      expiresAt: expiresAt
    });

    console.log("🔐 OTP generated:", otp);

    // Send email
    try {
      await sendOTPEmail(email, otp, name);
      console.log("✅ Email sent successfully to:", email);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Check your email for OTP.',
        userId: newUser._id
      });
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
      
      // Delete the user since email failed
      await User.findByIdAndDelete(newUser._id);
      await OTP.deleteOne({ email: email.toLowerCase() });

      return res.status(500).json({
        success: false,
        message: `Email could not be sent: ${emailError.message}`
      });
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});


// ========================================
// 2️⃣ SEND OTP (or Resend OTP)
// ========================================
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
      expiresAt: expiresAt
    });

    // Send email
    await sendOTPEmail(email, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// ========================================
// 3️⃣ VERIFY OTP
// ========================================
// 3️⃣ VERIFY OTP (HEAVILY DEBUGGED VERSION)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("\n" + "=".repeat(60));
    console.log("🔍 OTP VERIFICATION DEBUG");
    console.log("=".repeat(60));
    console.log("1. Raw input received:");
    console.log("   Email:", JSON.stringify(email));
    console.log("   OTP:", JSON.stringify(otp));
    console.log("   Email type:", typeof email);
    console.log("   OTP type:", typeof otp);

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Normalize inputs
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOTP = otp.toString().trim();

    console.log("\n2. After normalization:");
    console.log("   Email:", JSON.stringify(trimmedEmail));
    console.log("   OTP:", JSON.stringify(trimmedOTP));
    console.log("   OTP length:", trimmedOTP.length);

    // Find ALL OTP records for this email
    const allOtpRecords = await OTP.find({ email: trimmedEmail });
    
    console.log("\n3. Database search:");
    console.log("   Searching for email:", trimmedEmail);
    console.log("   Found", allOtpRecords.length, "OTP record(s)");
    
    if (allOtpRecords.length > 0) {
      console.log("\n4. All OTP records for this email:");
      allOtpRecords.forEach((record, index) => {
        console.log(`   Record ${index + 1}:`);
        console.log(`      Email: ${record.email}`);
        console.log(`      OTP: ${JSON.stringify(record.otp)}`);
        console.log(`      OTP type: ${typeof record.otp}`);
        console.log(`      Created: ${record.createdAt}`);
        console.log(`      Expires: ${record.expiresAt}`);
      });
    }

    // Get the most recent OTP
    const otpRecord = await OTP.findOne({ 
      email: trimmedEmail 
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      console.log("\n❌ No OTP record found");
      console.log("=".repeat(60) + "\n");
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new one.'
      });
    }

    console.log("\n5. Using most recent OTP record:");
    console.log("   Email:", otpRecord.email);
    console.log("   OTP:", JSON.stringify(otpRecord.otp));
    console.log("   Created:", otpRecord.createdAt);

    // Check expiration
    if (otpRecord.expiresAt && new Date() > otpRecord.expiresAt) {
      console.log("\n❌ OTP has expired");
      console.log("   Expired at:", otpRecord.expiresAt);
      console.log("   Current time:", new Date());
      await OTP.deleteOne({ email: trimmedEmail });
      console.log("=".repeat(60) + "\n");
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Compare OTPs
    const storedOTP = otpRecord.otp.toString().trim();
    
    console.log("\n6. OTP Comparison:");
    console.log("   Received OTP:", JSON.stringify(trimmedOTP));
    console.log("   Stored OTP:  ", JSON.stringify(storedOTP));
    console.log("   Are equal:", trimmedOTP === storedOTP);
    console.log("   Character-by-character:");
    for (let i = 0; i < Math.max(trimmedOTP.length, storedOTP.length); i++) {
      console.log(`      [${i}] '${trimmedOTP[i] || 'MISSING'}' === '${storedOTP[i] || 'MISSING'}' ? ${trimmedOTP[i] === storedOTP[i]}`);
    }

    if (trimmedOTP !== storedOTP) {
      console.log("\n❌ OTP MISMATCH!");
      console.log("=".repeat(60) + "\n");
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // OTP is valid - update user
    const user = await User.findOneAndUpdate(
      { email: trimmedEmail },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      console.log("\n❌ User not found for email:", trimmedEmail);
      console.log("=".repeat(60) + "\n");
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all OTPs for this email
    const deleteResult = await OTP.deleteMany({ email: trimmedEmail });
    
    console.log("\n✅ OTP VERIFIED SUCCESSFULLY!");
    console.log("   User:", user.name, "(" + user.email + ")");
    console.log("   Deleted", deleteResult.deletedCount, "OTP record(s)");
    console.log("=".repeat(60) + "\n");

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });

  } catch (error) {
    console.error('\n❌ Verify OTP error:', error);
    console.log("=".repeat(60) + "\n");
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// ========================================
// 4️⃣ LOGIN
// ========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// ========================================
// 🗑️ DELETE ALL USERS (Development Only)
// ========================================
router.delete('/delete-all-users', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    if (secretKey !== process.env.ADMIN_DELETE_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid secret key'
      });
    }

    const userResult = await User.deleteMany({});
    const otpResult = await OTP.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'All users and OTPs deleted successfully',
      deletedUsers: userResult.deletedCount,
      deletedOTPs: otpResult.deletedCount
    });

  } catch (error) {
    console.error('Delete all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during deletion'
    });
  }
});

// ========================================
// 🗑️ DELETE SINGLE USER BY EMAIL
// ========================================
router.delete('/delete-user/:email', async (req, res) => {
  try {
    const { secretKey } = req.body;
    const { email } = req.params;
    
    if (secretKey !== process.env.ADMIN_DELETE_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid secret key'
      });
    }

    const user = await User.findOneAndDelete({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await OTP.deleteMany({ email: email.toLowerCase() });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during deletion'
    });
  }
});
const crypto = require('crypto');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old reset tokens for this email
    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    // Save new reset token
    await PasswordReset.create({
      email: email.toLowerCase(),
      resetToken,
      expiresAt
    });

    // Send reset email
    await sendPasswordResetEmail(email, resetToken, user.name);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Find reset token
    const resetRecord = await PasswordReset.findOne({ resetToken: token });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link'
      });
    }

    // Check if expired
    if (new Date() > resetRecord.expiresAt) {
      await PasswordReset.deleteOne({ resetToken: token });
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired. Please request a new one.'
      });
    }

    // Find user and update password
    const user = await User.findOne({ email: resetRecord.email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Delete reset token
    await PasswordReset.deleteOne({ resetToken: token });

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});


module.exports = router;
