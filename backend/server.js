require('dotenv').config();
console.log('SENDGRID_FROM:', process.env.SENDGRID_FROM);
console.log('SENDGRID_API_KEY loaded:', !!process.env.SENDGRID_API_KEY);

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const cron = require('node-cron');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ----------------------------------------------------------------
// EMAIL HELPERS
// ----------------------------------------------------------------

function sendOtpEmail(to, otp) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: 'DRT - OTP Code',
    html: `
    <p>Dear User,</p>
    <p>To proceed with your <b>DTR account verification</b>, please use the One-Time Password (OTP) below:</p>
    <h2 style="letter-spacing: 2px;">${otp}</h2>
    <p>For security reasons, this code will expire in <b>5 minutes</b> and can only be used once.</p>
    <p>If you did not initiate this request, please ignore this message or contact support immediately.</p>
    <br/>
    <p>Sincerely,<br/><b>DTR Security Team</b></p>
    `,
  };
  return sgMail.send(msg);
}

function sendRequestStatusEmail(to, status, reason = null, documentType = '') {
  if (!to) return Promise.resolve();

  const subjects = {
    pending: 'Your document request has been submitted',
    under_review: 'Your document request is now Under Review',
    approved: 'Your document request has been Approved',
    denied: 'Your document request was Denied',
    for_release: 'Your document is now For Release',
    released: 'Document Released'
  };

  const messages = {
    pending: `
      <p>Hello,</p>
      <p>Your request for <b>${documentType}</b> has been <b>submitted</b> and is now <b>pending review</b>.</p>
      <p>You will receive another update once staff begins processing your request.</p>
    `,
    under_review: `
      <p>Hello,</p>
      <p>Your request for <b>${documentType}</b> is now <b>Under Review</b>.</p>
    `,
    approved: `
      <p>Hello,</p>
      <p>Your request for <b>${documentType}</b> has been <b>Approved</b>.</p>
    `,
    denied: `
      <p>Hello,</p>
      <p>Unfortunately, your request for <b>${documentType}</b> was <b>Denied</b>.</p>
      <p><b>Reason:</b> ${reason || 'No reason provided.'}</p>
    `,
    for_release: `
      <p>Hello,</p>
      <p>Congratulations! Your document for <b>${documentType}</b> is now <b>FOR RELEASE</b>.</p>
      <p>Please proceed to the City Civil Registry Office for payment and collection of your document.</p>
    `,
    released: `
      <p>Hello,</p>
      <p>Your document for <b>${documentType}</b> has been <b>RELEASED</b>.</p>
      <p>Thank you for your patience.</p>
    `
  };

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: subjects[status],
    html: messages[status]
  };

  return sgMail.send(msg);
}

function sendAppointmentConfirmationEmail(to, fullName, apptDate, apptTime, certificateType, registrationType) {
  const formattedDate = new Date(apptDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });
  const formattedTime = formatTimeSlot(apptTime);

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: 'Appointment Confirmed – Angeles City DRT',
    html: `
      <p>Dear <b>${fullName}</b>,</p>
      <p>Your appointment has been successfully booked. Here are your details:</p>
      <table style="border-collapse:collapse; margin:16px 0;">
        <tr>
          <td style="padding:6px 16px 6px 0; font-weight:600; color:#555;">Certificate Type:</td>
          <td style="padding:6px 0; color:#333;">${certificateType}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0; font-weight:600; color:#555;">Registration Type:</td>
          <td style="padding:6px 0; color:#333;">${registrationType}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0; font-weight:600; color:#555;">Date:</td>
          <td style="padding:6px 0; color:#333;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0; font-weight:600; color:#555;">Time:</td>
          <td style="padding:6px 0; color:#333;">${formattedTime}</td>
        </tr>
      </table>
      <p>Please make sure to arrive on time and bring any required documents.</p>
      <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
      <br/>
      <p>Sincerely,<br/><b>Angeles City DRT</b></p>
    `
  };
  return sgMail.send(msg);
}

function sendAppointmentReminderEmail(to, fullName, apptDate, apptTime) {
  const formattedDate = new Date(apptDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });
  const formattedTime = formatTimeSlot(apptTime);

  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: 'Reminder: Your Appointment is Today – Angeles City DRT',
    html: `
      <p>Dear <b>${fullName}</b>,</p>
      <p>This is a friendly reminder that you have an appointment <b>today</b>:</p>
      <table style="border-collapse:collapse; margin:16px 0;">
        <tr>
          <td style="padding:6px 16px 6px 0; font-weight:600; color:#555;">Date:</td>
          <td style="padding:6px 0; color:#333;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 0; font-weight:600; color:#555;">Time:</td>
          <td style="padding:6px 0; color:#333;">${formattedTime}</td>
        </tr>
      </table>
      <p>Please arrive on time and bring any required documents.</p>
      <br/>
      <p>Sincerely,<br/><b>Angeles City DRT</b></p>
    `
  };
  return sgMail.send(msg);
}

function formatTimeSlot(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// ----------------------------------------------------------------
// APP & MIDDLEWARE SETUP
// ----------------------------------------------------------------

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://angelescitydrt.org', 'https://www.angelescitydrt.org', 'https://drtbackend-2cw3.onrender.com']
    : ['http://localhost:4200', 'http://localhost:4000'],
  credentials: true
}));

app.use(express.json());

// ----------------------------------------------------------------
// DATABASE
// ----------------------------------------------------------------

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

setInterval(() => {
  db.query('SELECT 1', (err) => {
    if (err) console.error('Keepalive ping failed:', err.message);
    else console.log('DB keepalive OK');
  });
}, 30000);

console.log('Database Configuration:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT || 3306);

db.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ Database connection test FAILED');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
  } else {
    console.log('✅ Connected to MySQL');
  }
});

db.on('error', (err) => {
  console.error('Database pool error:', err.code, err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') console.error('Database connection was closed.');
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') console.error('Database had a fatal error.');
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_AQUIRE_TIMEOUT') console.error('Database acquired connection timeout.');
});

// ----------------------------------------------------------------
// CLOUDINARY
// ----------------------------------------------------------------

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, timeout: 60000 },
      (error, result) => {
        if (error) { console.error('Cloudinary upload error:', error); reject(error); }
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----------------------------------------------------------------
// AUTH MIDDLEWARE
// ----------------------------------------------------------------

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function checkRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
}

// ----------------------------------------------------------------
// USER DETAILS
// ----------------------------------------------------------------

app.post('/api/user/details', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { firstName, middleName, lastName, address, contactNo } = req.body;

  if (!firstName || !lastName || !address || !contactNo) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.query('SELECT * FROM user_details WHERE UserID = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length === 0) {
      db.query(
        `INSERT INTO user_details (UserID, User_FName, User_MName, User_LName, User_Address, User_ContactNo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, firstName, middleName || null, lastName, address, contactNo],
        (err) => {
          if (err) return res.status(500).json({ message: 'Failed to save details', error: err.message });
          res.json({ message: 'Details saved successfully' });
        }
      );
    } else {
      db.query(
        `UPDATE user_details SET User_FName = ?, User_MName = ?, User_LName = ?, User_Address = ?, User_ContactNo = ?
         WHERE UserID = ?`,
        [firstName, middleName || null, lastName, address, contactNo, userId],
        (err) => {
          if (err) return res.status(500).json({ message: 'Failed to update details', error: err.message });
          res.json({ message: 'Details updated successfully' });
        }
      );
    }
  });
});

app.get('/api/user/details', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM user_details WHERE UserID = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User details not found' });
    res.json(results[0]);
  });
});

// ----------------------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { contact, password } = req.body;
    console.log('Register body:', req.body);

    if (!contact || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const isEmail = /\S+@\S+\.\S+/.test(contact);
    const email = isEmail ? contact : null;
    const phone = !isEmail ? contact : null;

    const query = email
      ? 'SELECT id FROM users WHERE email = ?'
      : 'SELECT id FROM users WHERE phone = ?';

    db.query(query, [contact], async (err, results) => {
      if (err) { console.error('DB SELECT error:', err); return res.status(500).json({ message: 'Database error' }); }
      if (results.length > 0) return res.status(400).json({ message: 'Contact already registered' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      db.query(
        'INSERT INTO pending_users (email, phone, password, otp, otp_expires_at) VALUES (?, ?, ?, ?, ?)',
        [email, phone, hashedPassword, otp, expiresAt],
        async (err2) => {
          if (err2) { console.error('DB INSERT error:', err2); return res.status(500).json({ message: 'Database error' }); }
          console.log('OTP:', otp);
          if (email) {
            try { await sendOtpEmail(email, otp); }
            catch (e) { console.error('sendOtpEmail error:', e); }
          }
          return res.status(201).json({ message: 'OTP sent. Please verify to complete registration.' });
        }
      );
    });
  } catch (e) {
    console.error('Unexpected error:', e);
    res.status(500).json({ message: 'Unexpected server error' });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, phone, otp } = req.body;

  if ((!email && !phone) || !otp) {
    return res.status(400).json({ message: 'Contact and OTP are required' });
  }

  const value = email || phone;
  const query = email
    ? 'SELECT * FROM pending_users WHERE email = ?'
    : 'SELECT * FROM pending_users WHERE phone = ?';

  db.query(query, [value], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'No pending registration found' });

    const pendingUser = results[0];

    if (new Date(pendingUser.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (String(pendingUser.otp) !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    db.query(
      'INSERT INTO users (email, phone, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [pendingUser.email, pendingUser.phone, pendingUser.password, 3],
      (err) => {
        if (err) return res.status(500).json({ message: 'Failed to create user' });
        db.query('DELETE FROM pending_users WHERE id = ?', [pendingUser.id], () => {});
        res.json({ message: 'Registration successful' });
      }
    );
  });
});

app.post('/api/auth/resend-otp', (req, res) => {
  const { email, phone } = req.body;
  if (!email && !phone) return res.status(400).json({ message: 'Email or phone is required' });

  const value = email || phone;
  const query = email
    ? 'SELECT * FROM pending_users WHERE email = ?'
    : 'SELECT * FROM pending_users WHERE phone = ?';

  db.query(query, [value], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'No pending registration found' });

    const pendingUser = results[0];
    const now = new Date();
    const lastSent = new Date(new Date(pendingUser.otp_expires_at).getTime() - 10 * 60 * 1000);
    const cooldown = 60 * 1000;

    if (now - lastSent < cooldown) {
      return res.status(429).json({ message: `Please wait ${Math.ceil((cooldown - (now - lastSent)) / 1000)} seconds before resending OTP` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    db.query(
      'UPDATE pending_users SET otp = ?, otp_expires_at = ? WHERE id = ?',
      [otp, expiresAt, pendingUser.id],
      async (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update OTP' });
        if (email) {
          try { await sendOtpEmail(email, otp); }
          catch (e) { console.error('Error sending OTP email:', e); }
        }
        res.json({ message: 'OTP resent successfully' });
      }
    );
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    db.query('SELECT * FROM user_details WHERE UserID = ?', [user.id], (err, details) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          can_create_admins: user.can_create_admins ?? 0,
          can_edit_admins:   user.can_edit_admins   ?? 0,
          can_delete_admins: user.can_delete_admins ?? 0,
          detailsCompleted: details.length > 0
        }
      });
    });
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found with this email' });

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
        if (err) return res.status(500).json({ message: 'Error updating password' });
        res.json({ message: 'Password updated successfully' });
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

app.put('/api/auth/update', upload.single('image'), async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch (err) { return res.status(401).json({ message: 'Invalid token' }); }

    const userId = decoded.id;
    const { username, email, newPassword } = req.body;
    let updateFields = [];
    let values = [];

    if (username) { updateFields.push('username = ?'); values.push(username); }
    if (email) { updateFields.push('email = ?'); values.push(email); }
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push('password = ?');
      values.push(hashedPassword);
    }
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'profiles');
      updateFields.push('image = ?');
      values.push(uploaded.secure_url);
    }

    if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    values.push(userId);
    db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, values, (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update profile' });
      db.query('SELECT id, username, email, role, image FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: 'Failed to fetch updated profile' });
        res.json({ message: 'Profile updated successfully', user: results[0] });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------------------------------------------------
// ADMIN ROUTES
// ----------------------------------------------------------------

app.post('/api/admin/create-user', verifyToken, checkRoles([1]), async (req, res) => {
  const { email, password, role, can_create_admins, can_edit_admins, can_delete_admins } = req.body;
  if (!email || !password || ![1, 2].includes(role)) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  const canCreateAdmins = (role === 1 && can_create_admins) ? 1 : 0;
  const canEditAdmins   = (role === 1 && can_edit_admins)   ? 1 : 0;
  const canDeleteAdmins = (role === 1 && can_delete_admins) ? 1 : 0;

  db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (email, password, role, can_create_admins, can_edit_admins, can_delete_admins, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [email, hashedPassword, role, canCreateAdmins, canEditAdmins, canDeleteAdmins],
      err => {
        if (err) return res.status(500).json({ message: 'Failed to create account' });
        res.status(201).json({ message: 'Account created successfully' });
      }
    );
  });
});

app.get('/api/admin/users', verifyToken, checkRoles([1]), (req, res) => {
  const sql = `
    SELECT u.id, u.email, ud.User_FullName AS full_name,
       ud.User_Address, ud.User_ContactNo,
       u.role, u.can_create_admins, u.can_edit_admins, u.can_delete_admins, u.created_at
    FROM users u
    LEFT JOIN user_details ud ON u.id = ud.UserID
    ORDER BY u.role ASC, u.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});


app.get('/api/admin/users/:id', verifyToken, checkRoles([1]), (req, res) => {
  const sql = `
    SELECT u.id, u.email, ud.User_FullName AS full_name,
           ud.User_Address, ud.User_ContactNo, u.role, u.created_at
    FROM users u
    LEFT JOIN user_details ud ON u.id = ud.UserID
    WHERE u.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) { console.error('Error fetching user:', err); return res.status(500).json({ message: 'Database error' }); }
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', verifyToken, checkRoles([1]), (req, res) => {
  const { email, role, can_create_admins, can_edit_admins, can_delete_admins } = req.body;
  if (![1, 2, 3].includes(role)) return res.status(400).json({ message: 'Invalid role' });

  // Check if target user is an admin
  db.query('SELECT role FROM users WHERE id = ?', [req.params.id], (err, targetResults) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (targetResults.length === 0) return res.status(404).json({ message: 'User not found' });

    const targetIsAdmin = targetResults[0].role === 1;

    if (targetIsAdmin) {
      db.query('SELECT can_edit_admins FROM users WHERE id = ?', [req.user.id], (err, adminResults) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!adminResults[0].can_edit_admins) {
          return res.status(403).json({ message: 'You do not have permission to edit admins' });
        }
        proceedWithUpdate();
      });
    } else {
      proceedWithUpdate();
    }

    function proceedWithUpdate() {
      const canCreateAdmins = (role === 1 && can_create_admins) ? 1 : 0;
      const canEditAdmins   = (role === 1 && can_edit_admins)   ? 1 : 0;
      const canDeleteAdmins = (role === 1 && can_delete_admins) ? 1 : 0;

      db.query(
        'UPDATE users SET email = ?, role = ?, can_create_admins = ?, can_edit_admins = ?, can_delete_admins = ? WHERE id = ?',
        [email, role, canCreateAdmins, canEditAdmins, canDeleteAdmins, req.params.id],
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Update failed', error: err.message });
          if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
          res.json({ message: 'User updated successfully' });
        }
      );
    }
  });
});

app.put('/api/admin/users/:id/password', verifyToken, checkRoles([1]), async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: 'Password required' });

  const hashed = await bcrypt.hash(newPassword, 10);
  db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id], err => {
    if (err) return res.status(500).json({ message: 'Password update failed' });
    res.json({ message: 'Password changed successfully' });
  });
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', verifyToken, checkRoles([1]), (req, res) => {
  const userId = req.params.id;
  if (req.user.id == userId) return res.status(400).json({ message: 'You cannot delete your own account' });

  // Fetch the target user and the requesting admin's permissions
  db.query('SELECT role FROM users WHERE id = ?', [userId], (err, targetResults) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (targetResults.length === 0) return res.status(404).json({ message: 'User not found' });

    const targetIsAdmin = targetResults[0].role === 1;

    // If target is an admin, check if requester has can_delete_admins
    if (targetIsAdmin) {
      db.query('SELECT can_delete_admins FROM users WHERE id = ?', [req.user.id], (err, adminResults) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!adminResults[0].can_delete_admins) {
          return res.status(403).json({ message: 'You do not have permission to delete admins' });
        }
        proceedWithDelete();
      });
    } else {
      proceedWithDelete();
    }

    function proceedWithDelete() {
      db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ message: 'Failed to get database connection' });
        connection.beginTransaction(err => {
          if (err) { connection.release(); return res.status(500).json({ message: 'Transaction start failed' }); }

          connection.query(`
            DELETE rsh FROM request_status_history rsh
            JOIN document_request dr ON rsh.RequestID = dr.RequestID
            WHERE dr.user_id = ?
          `, [userId], err => {
            if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Failed deleting history' }); });

            connection.query('DELETE FROM document_request WHERE user_id = ?', [userId], err => {
              if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Failed deleting requests' }); });

              connection.query('DELETE FROM user_details WHERE UserID = ?', [userId], err => {
                if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Failed deleting user details' }); });

                connection.query('DELETE FROM users WHERE id = ?', [userId], err => {
                  if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Failed deleting user' }); });

                  connection.commit(err => {
                    if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Commit failed' }); });
                    connection.release();
                    res.json({ message: 'User deleted successfully' });
                  });
                });
              });
            });
          });
        });
      });
    }
  });
});

app.get('/api/admin/staff', verifyToken, checkRoles([1]), (req, res) => {
  db.query('SELECT id, email, username, role, created_at FROM users WHERE role = 2', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.delete('/api/admin/staff/:id', verifyToken, checkRoles([1]), (req, res) => {
  db.query('DELETE FROM users WHERE id = ? AND role = 2', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff deleted successfully' });
  });
});

// ----------------------------------------------------------------
// DOCUMENT REQUEST ROUTES
// ----------------------------------------------------------------

app.get('/api/document_request', verifyToken, checkRoles([1, 2]), (req, res) => {
  const sql = `
    SELECT dr.*,
           ud.User_FullName AS requester_name
    FROM document_request dr
    LEFT JOIN users u ON dr.user_id = u.id
    LEFT JOIN user_details ud ON u.id = ud.UserID
    WHERE (dr.status = 'pending' AND dr.assigned_staff_id IS NULL)
       OR dr.assigned_staff_id = ?
    ORDER BY dr.date_created DESC
  `;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch document requests' });
    res.json(results);
  });
});


app.get('/api/document_request/for_release', verifyToken, checkRoles([1,2]), (req, res) => {
  db.query(
    `SELECT dr.*,
        IFNULL(CONCAT(ud.User_FName, ' ', ud.User_LName), '') AS assigned_staff_name
 FROM document_request dr
 LEFT JOIN users u ON dr.assigned_staff_id = u.id
 LEFT JOIN user_details ud ON u.id = ud.UserID
 WHERE dr.status = 'for_release' AND dr.archived = 0`,
    (err, results) => {
      if (err) {
        console.error('Failed to fetch For Release requests:', err);
        return res.status(500).json({ message: 'Failed to fetch For Release requests', error: err.message });
      }
      res.json(results);
    }
  );
});

app.get('/api/document_request/released_list', verifyToken, checkRoles([1, 2]), (req, res) => {
  db.query(
    `SELECT dr.*,
            IFNULL(CONCAT(ud.User_FName, ' ', ud.User_LName), '') AS assigned_staff_name
     FROM document_request dr
     LEFT JOIN users u ON dr.assigned_staff_id = u.id
     LEFT JOIN user_details ud ON u.id = ud.UserID
     WHERE dr.status = 'released' AND dr.archived = 0
     ORDER BY dr.updated_at DESC`,
    (err, results) => {
      if (err) {
        console.error('Failed to fetch Released requests:', err);
        return res.status(500).json({ message: 'Failed to fetch Released requests', error: err.message });
      }
      res.json(results);
    }
  );
});

app.get('/api/document_request/:id', verifyToken, (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  const sql = `
    SELECT dr.RequestID, dr.name, dr.document_type, dr.date_created, dr.status, dr.updated_at,
           dr.file_path, dr.denial_reason,
           dr.First_Name, dr.Middle_Name, dr.Last_Name,
           dr.Fathers_Name, dr.Mothers_Name, dr.Doc_Date,
           dr.Death_Place, dr.Marriage_Place, dr.Wife_Name,
           dr.Groom_First_Name, dr.Groom_Middle_Name, dr.Groom_Last_Name, dr.Groom_DOB,
           dr.Bride_First_Name, dr.Bride_Middle_Name, dr.Bride_Last_Name, dr.Bride_DOB,
           u.email,
           CONCAT(ud.User_FName, ' ', ud.User_LName) AS full_name
    FROM document_request dr
    LEFT JOIN users u ON dr.user_id = u.id
    LEFT JOIN user_details ud ON u.id = ud.UserID
    WHERE dr.RequestID = ?
  `;
  db.query(sql, [requestId], (err, results) => {
    if (err) { console.error('Failed to fetch document request:', err); return res.status(500).json({ error: 'Failed to fetch document request' }); }
    if (results.length === 0) return res.status(404).json({ error: 'Document request not found' });
    res.json(results[0]);
  });
});

app.get('/api/admin/document_request/statistics', verifyToken, checkRoles([1]), (req, res) => {
  const { status } = req.query;
  let sql = `SELECT status, COUNT(*) AS count FROM document_request`;
  const params = [];

  if (status) { sql += ` WHERE status = ?`; params.push(status); }
  sql += ` GROUP BY status`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(results);
  });
});

app.get('/api/admin/document_request', verifyToken, checkRoles([1]), (req, res) => {
  db.query(
    `SELECT RequestID, name, document_type, date_created, status, updated_at, archived FROM document_request ORDER BY date_created DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(results);
    }
  );
});

app.post('/api/document_request/:id/process', verifyToken, checkRoles([1, 2]), async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) return res.status(400).json({ message: 'Invalid request ID' });

  db.query(
    `UPDATE document_request SET status = ?, updated_at = NOW(), assigned_staff_id = ? WHERE RequestID = ?`,
    ['under_review', req.user.id, requestId],
    async (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to process request', error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found' });

      try {
        const [userData] = await new Promise((resolve, reject) => {
          db.query(
            'SELECT u.email, dr.document_type FROM document_request dr JOIN users u ON dr.user_id = u.id WHERE dr.RequestID = ?',
            [requestId],
            (err, results) => err ? reject(err) : resolve(results)
          );
        });

        if (userData && userData.email) {
          await sendRequestStatusEmail(userData.email, 'under_review', null, userData.document_type);
          const emailMsg = `Your request for ${userData.document_type} is now In Process.`;
          db.query(
            'INSERT INTO request_status_history (RequestID, status, email_message) VALUES (?, ?, ?)',
            [requestId, 'under_review', emailMsg],
            (err) => { if (err) console.error('Failed to log history', err); }
          );
        }
      } catch (err) {
        console.error('Error sending email or logging history:', err);
      }

      res.json({ message: 'Request marked as In Process and assigned to you' });
    }
  );
});

app.post('/api/document_request/:id/approved', verifyToken, checkRoles([1, 2]), (req, res) => {
  const requestId = req.params.id;

  db.query(
    `UPDATE document_request SET status = ?, updated_at = NOW(), assigned_staff_id = ? WHERE RequestID = ?`,
    ['approved', req.user.id, requestId],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to process request', error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found' });

      db.query(
        'SELECT u.email, dr.document_type FROM document_request dr JOIN users u ON dr.user_id = u.id WHERE dr.RequestID = ?',
        [requestId],
        (err, results) => {
          if (!err && results.length > 0) {
            const { email, document_type } = results[0];
            sendRequestStatusEmail(email, 'approved', null, document_type);
            const emailMsg = `Your request for ${document_type} has been Approved.`;
            db.query(
              'INSERT INTO request_status_history (RequestID, status, email_message) VALUES (?, ?, ?)',
              [requestId, 'approved', emailMsg],
              (err) => { if (err) console.error('Failed to log history', err); }
            );
          }
        }
      );

      res.json({ message: 'Request marked as Approved and assigned to you' });
    }
  );
});

app.put('/api/document_request/:id/deny', verifyToken, checkRoles([1, 2]), (req, res) => {
  const requestId = req.params.id;
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ message: 'Denial reason is required' });

  db.query(
    `UPDATE document_request SET status = ?, denial_reason = ?, updated_at = NOW(), assigned_staff_id = ? WHERE RequestID = ?`,
    ['denied', reason, req.user.id, requestId],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to update request', error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found' });

      db.query(
        'SELECT u.email, dr.document_type FROM document_request dr JOIN users u ON dr.user_id = u.id WHERE dr.RequestID = ?',
        [requestId],
        (err, results) => {
          if (!err && results.length > 0) {
            const { email, document_type } = results[0];
            sendRequestStatusEmail(email, 'denied', reason, document_type);
            const emailMsg = `Your request for ${document_type} was Denied. Reason: ${reason}`;
            db.query(
              'INSERT INTO request_status_history (RequestID, status, email_message) VALUES (?, ?, ?)',
              [requestId, 'denied', emailMsg],
              (err) => { if (err) console.error('Failed to log history', err); }
            );
          }
        }
      );

      res.json({ message: 'Request marked as Denied and assigned to you' });
    }
  );
});



// FEB25 (FOR_RELEASE)
app.put('/api/document_request/:id/for_release', verifyToken, checkRoles([1, 2]), (req, res) => {
  const requestId = req.params.id;

  // Update only if current status is 'approved'
  db.query(
    `UPDATE document_request
     SET status = ?, updated_at = NOW(), assigned_staff_id = ?
     WHERE RequestID = ? AND status = ?`,
    ['for_release', req.user.id, requestId, 'approved'],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to update request', error: err.message });

      if (result.affectedRows === 0) {
        return res.status(400).json({ message: 'Request cannot be marked as For Release. It must be in Approved status first.' });
      }

      // Fetch user email and document type
      db.query(
        `SELECT u.email, dr.document_type
         FROM document_request dr
         JOIN users u ON dr.user_id = u.id
         WHERE dr.RequestID = ?`,
        [requestId],
        (err, results) => {
          if (!err && results.length > 0) {
            const { email, document_type } = results[0];

            // Send email for for_release status
            sendRequestStatusEmail(email, 'for_release', null, document_type);

            const emailMsg = `Congratulations! Your document for ${document_type} is now FOR RELEASE. Please proceed to the City Civil Registry Office for payment and collection of your document.`;

            // Log the status in history
            db.query(
              'INSERT INTO request_status_history (RequestID, status, email_message) VALUES (?, ?, ?)',
              [requestId, 'for_release', emailMsg],
              (err) => { if (err) console.error('Failed to log history', err); }
            );
          }
        }
      );

      res.json({ message: 'Request marked as For Release and assigned to you' });
    }
  );
});

// FEB25 (RELEASED)
app.put('/api/document_request/:id/released', verifyToken, checkRoles([1, 2]), (req, res) => {
  const requestId = req.params.id;

  db.query(
    `UPDATE document_request
     SET status = ?, updated_at = NOW(), assigned_staff_id = ?
     WHERE RequestID = ? AND status = ?`,
    ['released', req.user.id, requestId, 'for_release'],  // ✅ fixed typo here
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to update request', error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found or not in For Release status' });

      db.query(
        `SELECT u.email, dr.document_type
         FROM document_request dr
         JOIN users u ON dr.user_id = u.id
         WHERE dr.RequestID = ?`,
        [requestId],
        (err, results) => {
          if (!err && results.length > 0) {
            const { email, document_type } = results[0];
            sendRequestStatusEmail(email, 'released', null, document_type);
            const emailMsg = `Your document for ${document_type} has been RELEASED. Thank you for your patience.`;
            db.query(
              'INSERT INTO request_status_history (RequestID, status, email_message) VALUES (?, ?, ?)',
              [requestId, 'released', emailMsg],
              (err) => { if (err) console.error('Failed to log history', err); }
            );
          }
        }
      );

      res.json({ message: 'Request marked as Released' });
    }
  );
});

app.put('/api/document_request/:id/archive', verifyToken, checkRoles([1]), (req, res) => {
  const requestId = req.params.id;

  db.query('SELECT * FROM document_request WHERE RequestID = ?', [requestId], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Request not found' });

    const request = results[0];
    const recipientName = request.name ? request.name.replace(/\s+/g, '_') : `request_${requestId}`;
    const timestamp = new Date(request.updated_at || new Date()).toISOString().replace(/[:.]/g, '-');

    const archiveDir = path.join(__dirname, 'archives');
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);

    const requestFolder = path.join(archiveDir, `${recipientName}_${timestamp}`);
    if (!fs.existsSync(requestFolder)) fs.mkdirSync(requestFolder);

    if (request.file_path) {
      const oldPath = path.join(__dirname, request.file_path);
      if (fs.existsSync(oldPath)) {
        try { fs.renameSync(oldPath, path.join(requestFolder, path.basename(request.file_path))); }
        catch (err) { return res.status(500).json({ message: 'Failed to archive file', error: err.message }); }
      }
    }

    db.query('UPDATE document_request SET archived = 1, updated_at = NOW() WHERE RequestID = ?', [requestId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update DB', error: err.message });
      res.json({ message: 'Request archived successfully' });
    });
  });
});

// PUT /api/document_request/:id/restore
app.put('/api/document_request/:id/restore', verifyToken, checkRoles([1]), (req, res) => {
  db.query(
    'UPDATE document_request SET archived = 0, updated_at = NOW() WHERE RequestID = ?',
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to restore', error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found' });
      res.json({ message: 'Request restored successfully' });
    }
  );
});

// DELETE /api/document_request/:id/permanent
app.delete('/api/document_request/:id/permanent', verifyToken, checkRoles([1]), (req, res) => {
  const requestId = req.params.id;

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Failed to get connection' });

    connection.beginTransaction(err => {
      if (err) { connection.release(); return res.status(500).json({ message: 'Transaction failed' }); }

      connection.query('DELETE FROM request_status_history WHERE RequestID = ?', [requestId], err => {
        if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Failed deleting history' }); });

        connection.query('DELETE FROM document_request WHERE RequestID = ?', [requestId], err => {
          if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Failed deleting request' }); });

          connection.commit(err => {
            if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Commit failed' }); });
            connection.release();
            res.json({ message: 'Request permanently deleted' });
          });
        });
      });
    });
  });
});

// ----------------------------------------------------------------
// USER DOCUMENT REQUEST ROUTES
// ----------------------------------------------------------------

app.get('/api/my/requests', verifyToken, checkRoles([3]), (req, res) => {
  db.query(
    `SELECT RequestID, name, document_type, status, updated_at, file_path
     FROM document_request WHERE user_id = ? ORDER BY updated_at DESC`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(results);
    }
  );
});

app.get('/api/my/requests/:id/history', verifyToken, checkRoles([3]), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query('SELECT * FROM document_request WHERE RequestID = ? AND user_id = ?', [id, userId], (err, reqResults) => {
    if (err || reqResults.length === 0) return res.status(404).json({ message: 'Request not found' });

    db.query(
      'SELECT status, email_message, updated_at FROM request_status_history WHERE RequestID = ? ORDER BY updated_at ASC',
      [id],
      (err, history) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch history' });
        res.json(history);
      }
    );
  });
});

app.get('/api/my/requests/:id/download', verifyToken, checkRoles([3]), (req, res) => {
  db.query(
    'SELECT file_path FROM document_request WHERE RequestID = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, results) => {
      if (err || results.length === 0) return res.status(404).json({ message: 'File not found' });
      const filePath = path.join(__dirname, results[0].file_path);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File does not exist' });
      res.download(filePath);
    }
  );
});

// POST /api/document_request — Submit a new document request (role 3)
const uploadDocMultiple = multer({ storage: multer.memoryStorage() }).array('files', 10);

app.post('/api/document_request', verifyToken, checkRoles([3]), (req, res) => {
  uploadDocMultiple(req, res, async (err) => {
    if (err) return res.status(500).json({ error: 'File upload failed', details: err.message });

    const {
      document_type,
      First_Name, Middle_Name, Last_Name,
      Fathers_Name, Mothers_Name,
      Doc_Date, Death_Place, Marriage_Place, Wife_Name,
      Groom_First_Name, Groom_Middle_Name, Groom_Last_Name, Groom_DOB,
      Bride_First_Name, Bride_Middle_Name, Bride_Last_Name, Bride_DOB,
    } = req.body;

    const userId = req.user.id;

    // Required fields per document type
    const requiredFields = {
      birth:    ['First_Name', 'Middle_Name', 'Last_Name', 'Doc_Date', 'Fathers_Name', 'Mothers_Name'],
      death:    ['First_Name', 'Last_Name', 'Doc_Date', 'Death_Place'],
      marriage: ['First_Name', 'Last_Name', 'Doc_Date', 'Marriage_Place', 'Wife_Name'],
      marriage_license: ['Groom_First_Name', 'Groom_Last_Name', 'Groom_DOB', 'Bride_First_Name', 'Bride_Last_Name', 'Bride_DOB'],
    };

    if (!document_type) return res.status(400).json({ error: 'Document type is required' });
    if (!requiredFields[document_type]) return res.status(400).json({ error: 'Invalid document type' });

    for (const field of requiredFields[document_type]) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required for ${document_type} certificate` });
      }
    }

    const typeMap = { birth: 'Birth Certificate', death: 'Death Certificate', marriage: 'Marriage Certificate', marriage_license: 'Marriage License', };
    const displayDocumentType = typeMap[document_type] || document_type;

    db.getConnection(async (connErr, connection) => {
      if (connErr) {
        console.error('Failed to get DB connection:', connErr);
        return res.status(500).json({ error: 'Database connection failed', details: connErr.message });
      }

      try {
        // Upload files to Cloudinary
        let savedFiles = [];
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            try {
              console.log(`Uploading file: ${file.originalname}`);
              const uploaded = await uploadToCloudinary(file.buffer, 'document_requests');
              savedFiles.push(uploaded.secure_url);
              console.log(`✓ Uploaded ${file.originalname}`);
            } catch (uploadErr) {
              console.error(`✗ Failed to upload ${file.originalname}:`, uploadErr.message);
            }
          }
        }

        const filePathString = savedFiles.join(',');
        const name = document_type === 'marriage_license'
        ? `${Groom_First_Name || ''} ${Groom_Last_Name || ''} & ${Bride_First_Name || ''} ${Bride_Last_Name || ''}`.trim()
        : `${First_Name || ''} ${Middle_Name || ''} ${Last_Name || ''}`.trim();

       connection.query(
        `INSERT INTO document_request
          (name, document_type, file_path, user_id, status, date_created,
            First_Name, Middle_Name, Last_Name,
            Fathers_Name, Mothers_Name, Doc_Date,
            Death_Place, Marriage_Place, Wife_Name,
            Groom_First_Name, Groom_Middle_Name, Groom_Last_Name, Groom_DOB,
            Bride_First_Name, Bride_Middle_Name, Bride_Last_Name, Bride_DOB)
        VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, document_type, filePathString, userId,
          First_Name || null, Middle_Name || null, Last_Name || null,
          Fathers_Name || null, Mothers_Name || null, Doc_Date || null,
          Death_Place || null, Marriage_Place || null, Wife_Name || null,
          Groom_First_Name || null, Groom_Middle_Name || null, Groom_Last_Name || null, Groom_DOB || null,
          Bride_First_Name || null, Bride_Middle_Name || null, Bride_Last_Name || null, Bride_DOB || null,
        ],
          async (insertErr, result) => {
            connection.release();

            if (insertErr) {
              console.error('Database error:', insertErr);
              return res.status(500).json({ error: 'Database insert failed', details: insertErr.message });
            }

            const requestId = result.insertId;
            console.log(`Created request ID: ${requestId}`);

            try {
              const userEmailResults = await new Promise((resolve, reject) => {
                db.query('SELECT email FROM users WHERE id = ?', [userId], (err, r) => err ? reject(err) : resolve(r));
              });

              if (userEmailResults.length > 0 && userEmailResults[0].email) {
                await sendRequestStatusEmail(userEmailResults[0].email, 'pending', null, displayDocumentType);
                console.log(`✓ Email sent`);
                db.query(
                'INSERT INTO request_status_history (RequestID, status, email_message) VALUES (?, ?, ?)',
                [requestId, 'pending', `Your request for ${displayDocumentType} has been submitted and is now pending review.`],
                (err) => { if (err) console.error('Failed to log pending history', err); }
              );
              }
            } catch (emailErr) {
              console.error('Failed to send pending email:', emailErr.message);
            }

            res.status(201).json({ message: 'Document request submitted successfully', requestId, filePath: filePathString });
          }
        );

      } catch (e) {
        connection.release();
        console.error('Unexpected error:', e);
        return res.status(500).json({ error: 'Unexpected error', details: e.message });
      }
    });
  });
});

// ----------------------------------------------------------------
// APPOINTMENT ROUTES
// ----------------------------------------------------------------

const ALL_SLOTS = [
  '08:00:00', '09:00:00', '10:00:00', '11:00:00',
  '12:00:00', '13:00:00', '14:00:00', '15:00:00',
  '16:00:00', '17:00:00'
];
const MAX_PER_SLOT = 20;
const VALID_CERT_TYPES = ['Birth', 'Death', 'Marriage'];
const VALID_REG_TYPES = ['On Time', 'Delayed'];

// Daily reminder cron job (runs at 6 AM)
cron.schedule('0 6 * * *', () => {
  console.log('[CRON] Running daily appointment reminder job...');
  const todaySQL = new Date().toISOString().split('T')[0];

  db.query(
    `SELECT id, email, full_name, appt_date, appt_time
     FROM appointments WHERE appt_date = ? AND status = 'confirmed' AND reminder_sent = 0`,
    [todaySQL],
    async (err, rows) => {
      if (err) return console.error('[CRON] DB error:', err.message);
      if (!rows.length) return console.log('[CRON] No reminders to send today.');

      for (const row of rows) {
        try {
          await sendAppointmentReminderEmail(row.email, row.full_name, row.appt_date, row.appt_time);
          db.query('UPDATE appointments SET reminder_sent = 1 WHERE id = ?', [row.id]);
          console.log(`[CRON] Reminder sent to ${row.email}`);
        } catch (e) {
          console.error(`[CRON] Failed to send reminder to ${row.email}:`, e.message);
        }
      }
    }
  );
});

// GET /api/appointments/slots — Check slot availability (public)
app.get('/api/appointments/slots', (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required' });
  }

  db.query(
    `SELECT appt_time, COUNT(*) AS booked FROM appointments
     WHERE appt_date = ? AND status = 'confirmed' GROUP BY appt_time`,
    [date],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      const bookedMap = {};
      rows.forEach(r => { bookedMap[r.appt_time] = r.booked; });

      const slots = ALL_SLOTS.map(slot => ({
        time: slot,
        label: formatTimeSlot(slot),
        booked: bookedMap[slot] || 0,
        available: MAX_PER_SLOT - (bookedMap[slot] || 0),
        full: (bookedMap[slot] || 0) >= MAX_PER_SLOT
      }));

      res.json(slots);
    }
  );
});

// POST /api/appointments — Book an appointment (role 3)
app.post('/api/appointments', verifyToken, checkRoles([3]), async (req, res) => {
  const { appt_date, appt_time, certificate_type, registration_type } = req.body;
  const userId = req.user.id;

  if (!appt_date || !appt_time || !certificate_type || !registration_type) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!ALL_SLOTS.includes(appt_time)) return res.status(400).json({ message: 'Invalid time slot' });
  if (!VALID_CERT_TYPES.includes(certificate_type)) return res.status(400).json({ message: 'Invalid certificate type' });
  if (!VALID_REG_TYPES.includes(registration_type)) return res.status(400).json({ message: 'Invalid registration type' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(appt_date) < today) return res.status(400).json({ message: 'Cannot book an appointment in the past' });

  try {
    // Check slot capacity
    const [[countRow]] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT COUNT(*) AS booked FROM appointments WHERE appt_date = ? AND appt_time = ? AND status = 'confirmed'`,
        [appt_date, appt_time],
        (err, r) => err ? reject(err) : resolve([r])
      );
    });
    if (countRow.booked >= MAX_PER_SLOT) {
      return res.status(409).json({ message: 'This time slot is already full. Please choose another.' });
    }

    // Check user doesn't already have an appointment on this date
    const existing = await new Promise((resolve, reject) => {
      db.query(
        `SELECT id FROM appointments WHERE user_id = ? AND appt_date = ? AND status = 'confirmed'`,
        [userId, appt_date],
        (err, r) => err ? reject(err) : resolve(r[0])
      );
    });
    if (existing) return res.status(409).json({ message: 'You already have an appointment on this date.' });

    // Get user info
    const userRow = await new Promise((resolve, reject) => {
      db.query(
        `SELECT u.email, ud.User_FName, ud.User_LName
         FROM users u LEFT JOIN user_details ud ON u.id = ud.UserID WHERE u.id = ?`,
        [userId],
        (err, r) => err ? reject(err) : resolve(r[0])
      );
    });
    if (!userRow) return res.status(404).json({ message: 'User not found' });

    const fullName = `${userRow.User_FName || ''} ${userRow.User_LName || ''}`.trim() || userRow.email;
    const email = userRow.email;

    // Insert appointment
    const insertResult = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO appointments (user_id, appt_date, appt_time, full_name, certificate_type, registration_type, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, appt_date, appt_time, fullName, certificate_type, registration_type, email],
        (err, r) => err ? reject(err) : resolve(r)
      );
    });

    try { await sendAppointmentConfirmationEmail(email, fullName, appt_date, appt_time, certificate_type, registration_type); }
    catch (emailErr) { console.error('Failed to send confirmation email:', emailErr.message); }

    res.status(201).json({ message: 'Appointment booked successfully', appointmentId: insertResult.insertId });

  } catch (err) {
    console.error('Appointment booking error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/my/appointments — User's own appointments (role 3)
app.get('/api/my/appointments', verifyToken, checkRoles([3]), (req, res) => {
  db.query(
    `SELECT id, appt_date, appt_time, full_name, certificate_type, registration_type, status, created_at
     FROM appointments WHERE user_id = ? ORDER BY appt_date DESC, appt_time DESC`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(results);
    }
  );
});

// DELETE /api/my/appointments/:id — Cancel own appointment (role 3)
app.delete('/api/my/appointments/:id', verifyToken, checkRoles([3]), (req, res) => {
  db.query(
    `UPDATE appointments SET status = 'cancelled' WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Appointment not found' });
      res.json({ message: 'Appointment cancelled successfully' });
    }
  );
});

// GET /api/staff/appointments — Staff/Admin view (roles 1, 2)
app.get('/api/staff/appointments', verifyToken, checkRoles([1, 2]), (req, res) => {
  const { date, status, certificate_type, registration_type } = req.query;

  let sql = `
    SELECT a.id, a.full_name, a.email, a.appt_date, a.appt_time,
           a.certificate_type, a.registration_type, a.status, a.created_at
    FROM appointments a WHERE 1=1
  `;
  const params = [];

  if (date)              { sql += ' AND a.appt_date = ?';         params.push(date); }
  if (status)            { sql += ' AND a.status = ?';            params.push(status); }
  if (certificate_type)  { sql += ' AND a.certificate_type = ?';  params.push(certificate_type); }
  if (registration_type) { sql += ' AND a.registration_type = ?'; params.push(registration_type); }

  sql += ' ORDER BY a.appt_date ASC, a.appt_time ASC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

// ----------------------------------------------------------------
// ERROR HANDLER & SERVER START
// ----------------------------------------------------------------

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  db.end();
  process.exit(0);
});
