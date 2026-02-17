const nodemailer = require('nodemailer');

// Create transporter (email sender) with enhanced Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD  // App password (not regular password)
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Function to send OTP email
async function sendOTPEmail(email, otp, userName) {
  const mailOptions = {
    from: {
      name: 'SmartShop',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: 'Verify Your SmartShop Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #667eea;
            margin: 0;
          }
          .info {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ SmartShop</h1>
          </div>
          <div class="content">
            <h2>Welcome${userName ? ', ' + userName : ''}!</h2>
            <p class="info">Thank you for registering with SmartShop. Please verify your email address using the code below:</p>
            
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
            </div>
            
            <p class="info">
              This code will expire in <strong>10 minutes</strong>.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SmartShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
// Add this function to the existing emailService.js file

async function sendPasswordResetEmail(email, resetToken, userName) {
  const resetURL = `http://localhost:5173/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: {
      name: 'SmartShop',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: 'SmartShop - Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 8px;
            font-weight: bold;
            margin: 30px 0;
          }
          .info {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hi${userName ? ', ' + userName : ''}!</h2>
            <p class="info">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <a href="${resetURL}" class="reset-button">Reset Password</a>
            
            <p class="info">
              Or copy and paste this link in your browser:<br>
              <a href="${resetURL}">${resetURL}</a>
            </p>
            
            <p class="info">
              This link will expire in <strong>15 minutes</strong>.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SmartShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Password reset email failed:', error);
    throw new Error('Failed to send password reset email');
  }
}

module.exports = { sendOTPEmail, sendPasswordResetEmail };