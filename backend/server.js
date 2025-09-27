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

  // Drivers table
  db.run(`CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT,
    rating REAL DEFAULT 5.0,
    total_rides INTEGER DEFAULT 0,
    status TEXT DEFAULT 'offline',
    latitude REAL,
    longitude REAL,
    location_updated_at DATETIME,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    vehicle_license_plate TEXT,
    vehicle_color TEXT,
    vehicle_type TEXT DEFAULT 'sedan',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Rides table
  db.run(`CREATE TABLE IF NOT EXISTS rides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER,
    driver_id INTEGER,
    ride_type TEXT DEFAULT 'standard',
    pickup_address TEXT NOT NULL,
    pickup_label TEXT,
    pickup_latitude REAL,
    pickup_longitude REAL,
    dropoff_address TEXT NOT NULL,
    dropoff_label TEXT,
    dropoff_latitude REAL,
    dropoff_longitude REAL,
    status TEXT DEFAULT 'pending',
    fare_amount REAL,
    distance REAL,
    duration INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (rider_id) REFERENCES users (id),
    FOREIGN KEY (driver_id) REFERENCES drivers (id)
  )`);

  // Wallet transactions table
  db.run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ride_id INTEGER,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'NGN',
    description TEXT,
    status TEXT DEFAULT 'completed',
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (ride_id) REFERENCES rides (id)
  )`);

  // Wallet balances table
  db.run(`CREATE TABLE IF NOT EXISTS wallet_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    balance REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'NGN',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create default admin user
  const adminEmail = 'admin@eride.com';
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      db.run('INSERT INTO users (email, password, full_name, role, is_superuser) VALUES (?, ?, ?, ?, ?)', 
        [adminEmail, adminPassword, 'Admin User', 'admin', 1], function() {
          // Create wallet for admin
          db.run('INSERT INTO wallet_balances (user_id, balance) VALUES (?, ?)', [this.lastID, 10000]);
        });
      console.log('✅ Default admin user created: admin@eride.com / admin123');
    }
  });

  // Create some sample drivers
  const sampleDrivers = [
    {
      name: 'Ahmed Okonkwo',
      phone: '+234-8012-345-678',
      rating: 4.8,
      total_rides: 245,
      status: 'online',
      latitude: 6.5244,
      longitude: 3.3792,
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      vehicle_year: 2020,
      vehicle_license_plate: 'LAG-123-ABC',
      vehicle_color: 'Silver',
      vehicle_type: 'sedan'
    },
    {
      name: 'Fatima Ibrahim',
      phone: '+234-8087-654-321',
      rating: 4.9,
      total_rides: 312,
      status: 'online',
      latitude: 6.5344,
      longitude: 3.3892,
      vehicle_make: 'Honda',
      vehicle_model: 'Accord',
      vehicle_year: 2021,
      vehicle_license_plate: 'LAG-456-DEF',
      vehicle_color: 'Black',
      vehicle_type: 'sedan'
    },
    {
      name: 'Chinedu Okoro',
      phone: '+234-8098-765-432',
      rating: 4.7,
      total_rides: 189,
      status: 'online',
      latitude: 6.5144,
      longitude: 3.3692,
      vehicle_make: 'Hyundai',
      vehicle_model: 'Elantra',
      vehicle_year: 2019,
      vehicle_license_plate: 'LAG-789-GHI',
      vehicle_color: 'White',
      vehicle_type: 'sedan'
    }
  ];

  // Insert sample drivers if they don't exist
  sampleDrivers.forEach(driver => {
    db.get('SELECT * FROM drivers WHERE name = ?', [driver.name], (err, row) => {
      if (!row) {
        db.run(`INSERT INTO drivers (
          name, phone, rating, total_rides, status, 
          latitude, longitude, location_updated_at,
          vehicle_make, vehicle_model, vehicle_year, 
          vehicle_license_plate, vehicle_color, vehicle_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
          driver.name, driver.phone, driver.rating, driver.total_rides, driver.status,
          driver.latitude, driver.longitude, new Date().toISOString(),
          driver.vehicle_make, driver.vehicle_model, driver.vehicle_year,
          driver.vehicle_license_plate, driver.vehicle_color, driver.vehicle_type
        ]);
      }
    });
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

// === DRIVERS API ===

// Get available drivers near a location
app.get('/api/v1/drivers/available', (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusKm = parseFloat(radius);

  // Get online drivers within radius
  const query = `
    SELECT * FROM drivers 
    WHERE status = 'online' 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
  `;
  
  db.all(query, [], (err, drivers) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    // Filter drivers within radius and format response
    const availableDrivers = drivers.filter(driver => {
      const distance = calculateDistance(latitude, longitude, driver.latitude, driver.longitude);
      return distance <= radiusKm;
    }).map(driver => ({
      id: driver.id.toString(),
      name: driver.name,
      email: `${driver.name.toLowerCase().replace(' ', '.')}@eride.com`,
      phone: driver.phone,
      rating: driver.rating,
      total_rides: driver.total_rides,
      status: driver.status,
      location: {
        latitude: driver.latitude,
        longitude: driver.longitude,
        accuracy: 10,
        timestamp: driver.location_updated_at || new Date().toISOString()
      },
      vehicle: {
        make: driver.vehicle_make,
        model: driver.vehicle_model,
        year: driver.vehicle_year,
        license_plate: driver.vehicle_license_plate,
        color: driver.vehicle_color,
        type: driver.vehicle_type
      },
      created_at: driver.created_at,
      updated_at: driver.updated_at
    }));

    res.json({ drivers: availableDrivers });
  });
});

// === RIDES API ===

// Create a new ride
app.post('/api/v1/rides/request', verifyToken, (req, res) => {
  const {
    pickup_address,
    pickup_label,
    pickup_coordinates,
    dropoff_address,
    dropoff_label,
    dropoff_coordinates,
    ride_type,
    notes
  } = req.body;

  if (!pickup_address || !dropoff_address) {
    return res.status(400).json({ message: 'Pickup and dropoff addresses are required' });
  }

  // Calculate mock distance and duration
  const distance = pickup_coordinates && dropoff_coordinates 
    ? calculateDistance(
        pickup_coordinates.latitude, pickup_coordinates.longitude,
        dropoff_coordinates.latitude, dropoff_coordinates.longitude
      )
    : Math.random() * 10 + 1; // Mock distance between 1-11 km

  const duration = Math.round(distance * 3 + Math.random() * 10); // Roughly 3 min per km + traffic
  const fareAmount = calculateRideFare(distance, duration, ride_type || 'standard');

  const query = `
    INSERT INTO rides (
      rider_id, ride_type, pickup_address, pickup_label, pickup_latitude, pickup_longitude,
      dropoff_address, dropoff_label, dropoff_latitude, dropoff_longitude,
      distance, duration, fare_amount, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const values = [
    req.user.user_id,
    ride_type || 'standard',
    pickup_address,
    pickup_label,
    pickup_coordinates?.latitude,
    pickup_coordinates?.longitude,
    dropoff_address,
    dropoff_label,
    dropoff_coordinates?.latitude,
    dropoff_coordinates?.longitude,
    distance,
    duration,
    fareAmount,
    notes
  ];

  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to create ride', error: err.message });
    }

    // Fetch the created ride
    db.get('SELECT * FROM rides WHERE id = ?', [this.lastID], (err, ride) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch created ride' });
      }

      // Format response
      const rideResponse = {
        id: ride.id.toString(),
        type: ride.ride_type === 'delivery' ? 'delivery' : 'ride',
        from: {
          address: ride.pickup_address,
          label: ride.pickup_label,
          latitude: ride.pickup_latitude,
          longitude: ride.pickup_longitude
        },
        to: {
          address: ride.dropoff_address,
          label: ride.dropoff_label,
          latitude: ride.dropoff_latitude,
          longitude: ride.dropoff_longitude
        },
        customer_name: 'Current User',
        status: ride.status,
        amount: ride.fare_amount,
        formatted_amount: `₦${ride.fare_amount.toFixed(2)}`,
        distance: ride.distance,
        duration: ride.duration,
        created_at: ride.created_at,
        updated_at: ride.updated_at
      };

      res.status(201).json(rideResponse);
    });
  });
});

// Get ride details
app.get('/api/v1/rides/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM rides WHERE id = ?', [id], (err, ride) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Format response
    const rideResponse = {
      id: ride.id.toString(),
      type: ride.ride_type === 'delivery' ? 'delivery' : 'ride',
      from: {
        address: ride.pickup_address,
        label: ride.pickup_label,
        latitude: ride.pickup_latitude,
        longitude: ride.pickup_longitude
      },
      to: {
        address: ride.dropoff_address,
        label: ride.dropoff_label,
        latitude: ride.dropoff_latitude,
        longitude: ride.dropoff_longitude
      },
      customer_name: 'Current User',
      driver_name: ride.driver_id ? 'Assigned Driver' : null,
      status: ride.status,
      amount: ride.fare_amount,
      formatted_amount: `₦${ride.fare_amount.toFixed(2)}`,
      distance: ride.distance,
      duration: ride.duration,
      eta: ride.status === 'pending' ? Math.round(ride.duration * 0.8) : null,
      created_at: ride.created_at,
      updated_at: ride.updated_at
    };

    res.json(rideResponse);
  });
});

// === WALLET API ===

// Get wallet balance
app.get('/api/v1/wallet/balance', verifyToken, (req, res) => {
  // Ensure user has a wallet
  const insertWalletQuery = `
    INSERT OR IGNORE INTO wallet_balances (user_id, balance) 
    VALUES (?, 5000.0)
  `;
  
  db.run(insertWalletQuery, [req.user.user_id], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    // Get wallet balance
    db.get('SELECT * FROM wallet_balances WHERE user_id = ?', [req.user.user_id], (err, wallet) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        balance: wallet.balance,
        currency: wallet.currency,
        formatted: `₦${wallet.balance.toFixed(2)}`
      });
    });
  });
});

// Get wallet transactions
app.get('/api/v1/wallet/transactions', verifyToken, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT * FROM wallet_transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [req.user.user_id, limit, offset], (err, transactions) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    const formattedTransactions = transactions.map(tx => ({
      id: tx.id.toString(),
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      formatted_amount: tx.amount >= 0 ? `+₦${tx.amount.toFixed(2)}` : `-₦${Math.abs(tx.amount).toFixed(2)}`,
      description: tx.description,
      date: new Date(tx.created_at).toLocaleDateString(),
      time: new Date(tx.created_at).toLocaleTimeString(),
      status: tx.status,
      reference: tx.reference
    }));

    res.json({ transactions: formattedTransactions });
  });
});

// Process ride payment
app.post('/api/v1/wallet/ride-payment', verifyToken, (req, res) => {
  const { rideId, amount, driverId, fareBreakdown } = req.body;
  
  if (!rideId || !amount || !driverId) {
    return res.status(400).json({ message: 'rideId, amount, and driverId are required' });
  }

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Check rider balance
    db.get('SELECT balance FROM wallet_balances WHERE user_id = ?', [req.user.user_id], (err, riderWallet) => {
      if (err || !riderWallet) {
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Failed to get rider balance' });
      }
      
      if (riderWallet.balance < amount) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Deduct from rider
      const newRiderBalance = riderWallet.balance - amount;
      db.run('UPDATE wallet_balances SET balance = ?, updated_at = ? WHERE user_id = ?', 
        [newRiderBalance, new Date().toISOString(), req.user.user_id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Failed to deduct rider balance' });
        }
        
        // Add earnings to driver (85% of fare, 15% platform fee)
        const driverEarnings = amount * 0.85;
        db.run(`INSERT OR IGNORE INTO wallet_balances (user_id, balance) VALUES (?, 0.0)`, [driverId]);
        db.run(`UPDATE wallet_balances SET balance = balance + ?, updated_at = ? WHERE user_id = ?`,
          [driverEarnings, new Date().toISOString(), driverId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Failed to credit driver balance' });
          }
          
          // Record transactions
          const transactionRef = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          
          // Rider debit transaction
          db.run(`INSERT INTO wallet_transactions 
            (user_id, ride_id, type, amount, description, reference) 
            VALUES (?, ?, 'ride_payment', ?, ?, ?)`,
            [req.user.user_id, rideId, -amount, `Ride payment for trip ${rideId}`, transactionRef]);
          
          // Driver credit transaction  
          db.run(`INSERT INTO wallet_transactions 
            (user_id, ride_id, type, amount, description, reference) 
            VALUES (?, ?, 'ride_payment', ?, ?, ?)`,
            [driverId, rideId, driverEarnings, `Ride earnings for trip ${rideId}`, transactionRef], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Failed to record transactions' });
            }
            
            // Update ride status
            db.run('UPDATE rides SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?',
              ['completed', new Date().toISOString(), new Date().toISOString(), rideId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Failed to update ride status' });
              }
              
              db.run('COMMIT');
              
              // Return success response
              res.json({
                transactionId: transactionRef,
                riderBalance: newRiderBalance,
                driverBalance: driverEarnings,
                timestamp: new Date().toISOString()
              });
            });
          });
        });
      });
    });
  });
});

// Reset driver status (for post-ride cleanup)
app.post('/api/v1/drivers/:id/reset-status', verifyToken, (req, res) => {
  const { id: driverId } = req.params;
  const { status = 'online' } = req.body;
  
  // Update driver status to available
  db.run(
    'UPDATE drivers SET status = ?, location_updated_at = ? WHERE id = ?',
    [status, new Date().toISOString(), driverId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to update driver status' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      console.log(`🚗 Driver ${driverId} status reset to: ${status}`);
      
      res.json({
        message: 'Driver status updated successfully',
        driverId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  );
});

// Helper functions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateRideFare(distance, duration, rideType) {
  let baseFare = 200;
  let perKmRate = 80;
  let perMinRate = 10;

  switch (rideType) {
    case 'premium':
      baseFare = 350;
      perKmRate = 120;
      perMinRate = 15;
      break;
    case 'delivery':
      baseFare = 150;
      perKmRate = 60;
      perMinRate = 8;
      break;
  }

  const distanceFare = distance * perKmRate;
  const timeFare = duration * perMinRate;
  const subtotal = baseFare + distanceFare + timeFare;
  const serviceFee = Math.round(subtotal * 0.1);
  
  return subtotal + serviceFee;
}

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
