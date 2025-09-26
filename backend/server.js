const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Email configuration (for development, using Gmail)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Add to .env
    pass: process.env.EMAIL_PASS || 'your-app-password'     // Add to .env
  }
});

// Email service functions
const sendOTPEmail = async (email, otpCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@eride.com',
      to: email,
      subject: 'E-Ride Login OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">E-Ride Authentication</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for E-Ride login is:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3B82F6; font-size: 36px; margin: 0; letter-spacing: 4px;">${otpCode}</h1>
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <br>
          <p>Best regards,<br>E-Ride Team</p>
        </div>
      `
    };
    
    // Check if email is properly configured (not placeholder values)
    const isEmailConfigured = process.env.EMAIL_USER && 
                             process.env.EMAIL_PASS && 
                             process.env.EMAIL_USER !== 'your-email@gmail.com' &&
                             process.env.EMAIL_PASS !== 'your-email-password';
    
    if (isEmailConfigured) {
      await emailTransporter.sendMail(mailOptions);
      console.log(`📧 OTP email sent to ${email}`);
      console.log(`🔐 OTP Code (for debugging): ${otpCode}`);
      return true;
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  EMAIL SERVICE NOT CONFIGURED');
      console.log('='.repeat(60));
      console.log(`📧 Email: ${email}`);
      console.log(`🔐 OTP CODE: ${otpCode}`);
      console.log(`⏰ Expires in: 5 minutes`);
      console.log('='.repeat(60));
      console.log('ℹ️  To enable email sending, update your .env file with valid Gmail credentials.');
      console.log('='.repeat(60) + '\n');
      return false;
    }
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ EMAIL SENDING FAILED');
    console.error('='.repeat(60));
    console.error(`📧 Email: ${email}`);
    console.error(`🔐 OTP CODE (use this): ${otpCode}`);
    console.error(`❌ Error: ${error.message}`);
    console.error('='.repeat(60) + '\n');
    return false;
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'eride.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'rider',
    is_active INTEGER DEFAULT 1,
    is_superuser INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // OTP table
  db.run(`CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    expires_at DATETIME NOT NULL,
    is_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create default admin user
  const adminEmail = 'admin@eride.com';
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      db.run('INSERT INTO users (email, password, full_name, role, is_superuser) VALUES (?, ?, ?, ?, ?)', 
        [adminEmail, adminPassword, 'Admin User', 'admin', 1]);
      console.log('✅ Default admin user created: admin@eride.com / admin123');
    }
  });
});

// In-memory OTP storage (for demo purposes)
const otpStorage = new Map();

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Health check
app.get('/api/v1/utils/health-check/', (req, res) => {
  res.json({ status: 'healthy', message: 'E-Ride API is running' });
});

// User registration
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, role = 'rider' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password and create user
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      db.run('INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)', 
        [email, hashedPassword, full_name, role], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to create user' });
        }

        res.status(201).json({ 
          message: 'User created successfully',
          user_id: this.lastID
        });
      });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User login
app.post('/api/v1/login/access-token', async (req, res) => {
  try {
    const { username: email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Verify password
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (!user.is_active) {
        return res.status(400).json({ message: 'Account is inactive' });
      }

      // Generate OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in memory (in production, use Redis or database)
      otpStorage.set(email, {
        code: otpCode,
        expires_at: expiresAt,
        is_used: false
      });

      // Try to send OTP via email
      const emailSent = await sendOTPEmail(email, otpCode);
      
      // Always log OTP to console for development
      console.log(`\n🔐 OTP CODE FOR ${email}: ${otpCode}`);
      console.log(`⏰ Expires at: ${expiresAt.toLocaleString()}`);
      console.log(`📧 Email sent: ${emailSent ? 'Yes' : 'No (using console instead)'}\n`);

      // Generate JWT token (but require OTP verification)
      const token = jwt.sign(
        { 
          user_id: user.id, 
          email: user.email, 
          role: user.role,
          otp_verified: false 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        access_token: token,
        token_type: 'bearer',
        otp_required: true,
        otp_verified: false,
        message: emailSent ? 'OTP sent to your email address' : `OTP code has been generated. Check the backend console for the code: ${otpCode}`,
        dev_otp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
        email_configured: emailSent
      });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// OTP verification
app.post('/api/v1/auth/otp/verify', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    // Check OTP
    const storedOtp = otpStorage.get(email);
    
    if (!storedOtp) {
      return res.status(400).json({ message: 'No OTP found for this email' });
    }

    if (storedOtp.is_used) {
      return res.status(400).json({ message: 'OTP already used' });
    }

    if (new Date() > storedOtp.expires_at) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (storedOtp.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark OTP as used
    storedOtp.is_used = true;
    otpStorage.set(email, storedOtp);

    // Get user info
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Generate new JWT with OTP verified
      const verifiedToken = jwt.sign(
        { 
          user_id: user.id, 
          email: user.email, 
          role: user.role,
          otp_verified: true 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        access_token: verifiedToken,
        token_type: 'bearer',
        otp_verified: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: !!user.is_active,
          is_superuser: !!user.is_superuser
        }
      });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
app.get('/api/v1/users/me', verifyToken, (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.user.user_id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: !!user.is_active,
      is_superuser: !!user.is_superuser
    });
  });
});

// Update current user
app.patch('/api/v1/users/me', verifyToken, (req, res) => {
  const { full_name, email } = req.body;
  const updates = [];
  const values = [];

  if (full_name !== undefined) {
    updates.push('full_name = ?');
    values.push(full_name);
  }

  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  values.push(req.user.user_id);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to update user' });
    }

    // Return updated user
    db.get('SELECT * FROM users WHERE id = ?', [req.user.user_id], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: !!user.is_active,
        is_superuser: !!user.is_superuser
      });
    });
  });
});

// Password recovery request
app.post('/api/v1/password-recovery/:email', (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ message: 'The user with this email does not exist in the system.' });
      }

      // Generate password reset token
      const resetToken = jwt.sign(
        { email: user.email, purpose: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

      res.json({
        message: 'Password recovery email sent',
        token: resetToken // In production, this should be sent via email only
      });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password
app.post('/api/v1/reset-password/', (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify reset token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({ message: 'Invalid token' });
      }

      const email = decoded.email;

      // Get user and update password
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        if (!user.is_active) {
          return res.status(400).json({ message: 'Inactive user' });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(new_password, 10);

        // Update password
        db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Failed to update password' });
          }

          res.json({
            message: 'Password updated successfully'
          });
        });
      });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP
app.post('/api/v1/auth/otp/resend', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpStorage.set(email, {
      code: otpCode,
      expires_at: expiresAt,
      is_used: false
    });

    // Try to send OTP via email
    const emailSent = await sendOTPEmail(email, otpCode);
    
    // Always log OTP to console for development
    console.log(`\n🔐 RESEND OTP CODE FOR ${email}: ${otpCode}`);
    console.log(`⏰ Expires at: ${expiresAt.toLocaleString()}`);
    console.log(`📧 Email sent: ${emailSent ? 'Yes' : 'No (using console instead)'}\n`);

    res.json({
      message: emailSent ? 'New OTP sent to your email address' : `New OTP code has been generated. Check the backend console for the code: ${otpCode}`,
      dev_otp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      email_configured: emailSent,
      expires_at: expiresAt
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// API Documentation endpoints
app.get('/docs', (req, res) => {
  const apiDocs = {
    title: 'E-Ride API Documentation',
    version: '1.0.0',
    description: 'REST API for E-Ride ride-sharing application',
    baseUrl: `http://localhost:${PORT}`,
    endpoints: {
      'Health Check': {
        method: 'GET',
        path: '/api/v1/utils/health-check/',
        description: 'Check API health status'
      },
      'User Registration': {
        method: 'POST',
        path: '/api/v1/auth/register',
        description: 'Register a new user',
        body: {
          email: 'string',
          password: 'string',
          full_name: 'string',
          role: 'rider | driver | courier'
        }
      },
      'User Login': {
        method: 'POST',
        path: '/api/v1/login/access-token',
        description: 'Login with email/password, returns JWT token and triggers OTP',
        body: {
          username: 'string (email)',
          password: 'string'
        }
      },
      'OTP Verification': {
        method: 'POST',
        path: '/api/v1/auth/otp/verify',
        description: 'Verify OTP code and complete authentication',
        body: {
          email: 'string',
          code: 'string (6-digit OTP)'
        }
      },
      'Resend OTP': {
        method: 'POST',
        path: '/api/v1/auth/otp/resend',
        description: 'Resend OTP code to email',
        body: {
          email: 'string'
        }
      },
      'Password Recovery': {
        method: 'POST',
        path: '/api/v1/password-recovery/:email',
        description: 'Request password reset token'
      },
      'Reset Password': {
        method: 'POST',
        path: '/api/v1/reset-password/',
        description: 'Reset password with token',
        body: {
          token: 'string',
          new_password: 'string'
        }
      },
      'Get Current User': {
        method: 'GET',
        path: '/api/v1/users/me',
        description: 'Get current user profile (requires JWT token)',
        headers: {
          Authorization: 'Bearer <jwt_token>'
        }
      },
      'Update User Profile': {
        method: 'PATCH',
        path: '/api/v1/users/me',
        description: 'Update current user profile (requires JWT token)',
        headers: {
          Authorization: 'Bearer <jwt_token>'
        },
        body: {
          full_name: 'string (optional)',
          email: 'string (optional)'
        }
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      flow: '1. Login -> 2. Verify OTP -> 3. Use JWT token for protected endpoints'
    },
    notes: [
      'All endpoints return JSON responses',
      'OTP codes expire after 5 minutes',
      'JWT tokens expire after 24 hours',
      'Email configuration required for OTP sending (see .env file)'
    ]
  };
  
  res.json(apiDocs);
});

// Alternative documentation endpoint
app.get('/redoc', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>E-Ride API Documentation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .method { color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold; }
          .get { background: #28a745; }
          .post { background: #007bff; }
          .patch { background: #ffc107; color: black; }
          code { background: #e9ecef; padding: 2px 4px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>🚗 E-Ride API Documentation</h1>
        <p><strong>Base URL:</strong> <code>http://localhost:${PORT}</code></p>
        
        <h2>🔑 Authentication Flow</h2>
        <ol>
          <li>Register a new user or use existing credentials</li>
          <li>Login with email/password to get JWT token and trigger OTP</li>
          <li>Verify OTP code to complete authentication</li>
          <li>Use JWT token for protected endpoints</li>
        </ol>
        
        <h2>📋 Available Endpoints</h2>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/v1/utils/health-check/</strong>
          <p>Check API health status</p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/api/v1/auth/register</strong>
          <p>Register a new user</p>
          <p><strong>Body:</strong> <code>{email, password, full_name, role}</code></p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/api/v1/login/access-token</strong>
          <p>Login with credentials, returns JWT and sends OTP</p>
          <p><strong>Body:</strong> <code>{username, password}</code></p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/api/v1/auth/otp/verify</strong>
          <p>Verify OTP code and complete authentication</p>
          <p><strong>Body:</strong> <code>{email, code}</code></p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/api/v1/auth/otp/resend</strong>
          <p>Resend OTP code to email</p>
          <p><strong>Body:</strong> <code>{email}</code></p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/api/v1/password-recovery/:email</strong>
          <p>Request password reset token</p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/api/v1/reset-password/</strong>
          <p>Reset password with token</p>
          <p><strong>Body:</strong> <code>{token, new_password}</code></p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/v1/users/me</strong>
          <p>Get current user profile (requires JWT token)</p>
          <p><strong>Headers:</strong> <code>Authorization: Bearer &lt;jwt_token&gt;</code></p>
        </div>
        
        <div class="endpoint">
          <span class="method patch">PATCH</span>
          <strong>/api/v1/users/me</strong>
          <p>Update user profile (requires JWT token)</p>
          <p><strong>Headers:</strong> <code>Authorization: Bearer &lt;jwt_token&gt;</code></p>
          <p><strong>Body:</strong> <code>{full_name?, email?}</code></p>
        </div>
        
        <h2>⚙️ Configuration</h2>
        <p>To enable email OTP sending, add to your <code>.env</code> file:</p>
        <pre>
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
        </pre>
        
        <h2>🧪 Testing</h2>
        <p>Default admin account: <code>admin@eride.com</code> / <code>admin123</code></p>
        <p>Test the API with tools like Postman, curl, or the frontend application.</p>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 E-Ride Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/v1/utils/health-check/`);
  console.log(`🔐 Demo OTP code: 123456 (or check console for generated codes)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('✅ Database connection closed.');
    process.exit(0);
  });
});
