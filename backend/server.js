  require('dotenv').config();
  console.log('SENDGRID_FROM:', process.env.SENDGRID_FROM);
  console.log('SENDGRID_API_KEY loaded:', !!process.env.SENDGRID_API_KEY);
  const express = require('express');
  const cors = require('cors');
  const mysql = require('mysql2');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const cloudinary = require('cloudinary').v2;
  const streamifier = require('streamifier');

  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  function sendOtpEmail(to, otp) {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM,
      subject: 'Your OTP Code',
      html: `<p>Your verification code is: <b>${otp}</b></p>`,
    };

    return sgMail.send(msg);
  }


  const app = express();

  app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:4000', 'https://its-certificate-generator.vercel.app'],
    credentials: true
  }));

  app.use(express.json());

  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false
  });

  db.connect(err => {
    if (err) {
      console.error('Database connection failed:', err);
      process.exit(1);
    }
    console.log('Connected to MySQL');
  });

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const upload = multer({ storage: multer.memoryStorage() });

  const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (result) resolve(result);
        else reject(error);
      });
      streamifier.createReadStream(fileBuffer).pipe(stream);
    });
  }

  function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  // Create or update user details for first-time login
app.post('/api/user/details', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { firstName, middleName, lastName, address, contactNo } = req.body;

  if (!firstName || !lastName || !address || !contactNo) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if user details already exist
  db.query('SELECT * FROM user_details WHERE UserID = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    const fullName = `${firstName} ${middleName || ''} ${lastName}`.trim();

    if (results.length === 0) {
      // Insert new details
db.query(
  `INSERT INTO user_details
    (UserID, User_FName, User_MName, User_LName, User_Address, User_ContactNo)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [userId, firstName, middleName || null, lastName, address, contactNo],
  (err) => {
    if (err) return res.status(500).json({ message: 'Failed to save details', error: err.message });
    res.json({ message: 'Details saved successfully' });
  }
);

    } else {
      // Update existing details
db.query(
  `UPDATE user_details
  SET User_FName = ?, User_MName = ?, User_LName = ?, User_Address = ?, User_ContactNo = ?
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

// Optional: fetch user details for pre-fill
app.get('/api/user/details', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM user_details WHERE UserID = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User details not found' });
    res.json(results[0]);
  });
});


  function checkRole(requiredRole) {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      if (req.user.role !== requiredRole) return res.status(403).json({ message: 'Forbidden: Insufficient role' });
      next();
    }
  }

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
        if (err) {
          console.error('DB SELECT error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        if (results.length > 0) {
          return res.status(400).json({ message: 'Contact already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        db.query(
          'INSERT INTO pending_users (email, phone, password, otp, otp_expires_at) VALUES (?, ?, ?, ?, ?)',
          [email, phone, hashedPassword, otp, expiresAt],
          async (err2) => {
            if (err2) {
              console.error('DB INSERT error:', err2);
              return res.status(500).json({ message: 'Database error' });
            }

            console.log('OTP:', otp);

            if (email) {
              try {
                await sendOtpEmail(email, otp);
              } catch (e) {
                console.error('sendOtpEmail error:', e);
              }
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

      if (pendingUser.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Move user to main users table
      db.query(
        'INSERT INTO users (email, phone, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        [pendingUser.email, pendingUser.phone, pendingUser.password, 3],
        (err) => {
          if (err) return res.status(500).json({ message: 'Failed to create user' });

          // Delete from pending_users
          db.query('DELETE FROM pending_users WHERE id = ?', [pendingUser.id], () => {});

          res.json({ message: 'Registration successful' });
        }
      );
    });
  });


app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if user details exist
    db.query('SELECT * FROM user_details WHERE UserID = ?', [user.id], (err, details) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      const detailsCompleted = details.length > 0;

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'yoursecretkey',
        { expiresIn: '1d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          detailsCompleted
        }
      });
    });
  });
});


  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length === 0) return res.status(404).json({ message: 'User not found with this email' });

      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query(
          'UPDATE users SET password = ? WHERE email = ?',
          [hashedPassword, email],
          (err) => {
            if (err) return res.status(500).json({ message: 'Error updating password' });
            res.json({ message: 'Password updated successfully' });
          }
        );
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
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
      } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }

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
        const uploaded = await uploadToCloudinary(req.file.buffer, "profiles");
        updateFields.push('image = ?');
        values.push(uploaded.secure_url);
      }

      if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });

      values.push(userId);
      const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      db.query(sql, values, (err) => {
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

  app.post('/api/admin/create-user', verifyToken, checkRole(1), async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || ![1, 2].includes(role)) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, NOW())',
      [email, hashedPassword, role],
      err => {
        if (err) return res.status(500).json({ message: 'Failed to create account' });
        res.status(201).json({ message: 'Account created successfully' });
      }
    );
  });
});

app.get('/api/admin/users', verifyToken, checkRole(1), (req, res) => {
  const sql = `
  SELECT
    u.id,
    u.email,
    ud.User_FullName AS full_name,
    ud.User_Address,
    ud.User_ContactNo,
    u.role,
    u.created_at
  FROM users u
  LEFT JOIN user_details ud ON u.id = ud.UserID
  ORDER BY u.role ASC, u.created_at DESC
`;

db.query(sql, (err, results) => {
  if (err) return res.status(500).json({ message: 'Database error' });
  res.json(results);
});

});



app.put('/api/admin/users/:id', verifyToken, checkRole(1), (req, res) => {
  const { email, role } = req.body; // remove username
  const userId = req.params.id;

  if (![1, 2, 3].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const sql = 'UPDATE users SET email = ?, role = ? WHERE id = ?';
  db.query(sql, [email, role, userId], (err, result) => {
    if (err) {
      console.error('Error updating user credentials:', err);
      return res.status(500).json({ message: 'Update failed', error: err.message });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated successfully' });
  });
});


app.put('/api/admin/users/:id/password', verifyToken, checkRole(1), async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.params.id;

  if (!newPassword) return res.status(400).json({ message: 'Password required' });

  const hashed = await bcrypt.hash(newPassword, 10);

  db.query(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashed, userId],
    err => {
      if (err) return res.status(500).json({ message: 'Password update failed' });
      res.json({ message: 'Password changed successfully' });
    }
  );
});

app.delete('/api/admin/users/:id', verifyToken, checkRole(1), (req, res) => {
  const userId = req.params.id;

  if (req.user.id == userId) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  db.query('DELETE FROM users WHERE id = ?', [userId], err => {
    if (err) return res.status(500).json({ message: 'Delete failed' });
    res.json({ message: 'User deleted successfully' });
  });
});


  app.get('/api/admin/staff', verifyToken, checkRole(1), (req, res) => {
    db.query('SELECT id, email, username, role, created_at FROM users WHERE role = 2', (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(results);
    });
  });

  app.delete('/api/admin/staff/:id', verifyToken, checkRole(1), (req, res) => {
    const staffId = req.params.id;
    db.query('DELETE FROM users WHERE id = ? AND role = 2', [staffId], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Staff not found' });
      res.json({ message: 'Staff deleted successfully' });
    });
  });

  /* CERTIFICATES */

  // Save Pending Certificates
  app.post('/api/pending-certificates', upload.single('certificatePng'), async (req, res) => {
    try {
      const {
        recipientName,
        issueDate,
        numberOfSignatories,
        signatory1Name,
        signatory1Role,
        signatory2Name,
        signatory2Role,
        creator_name,
        certificate_type
      } = req.body;

      if (!req.file) return res.status(400).json({ message: 'Certificate PNG is required' });

      const uploaded = await uploadToCloudinary(req.file.buffer, "certificates");

      const approvalSignatories = [];
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('approverName')) {
          const index = key.replace('approverName', '');
          approvalSignatories.push({
            name: req.body[`approverName${index}`],
            email: req.body[`approverEmail${index}`]
          });
        }
      });

      const sql = `
        INSERT INTO pending_certificates
        (recipient_name, issue_date, number_of_signatories, signatory1_name, signatory1_role,
        signatory2_name, signatory2_role, png_path, approval_signatories, creator_name, status, certificate_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `;
      const values = [
        recipientName,
        issueDate,
        numberOfSignatories,
        signatory1Name,
        signatory1Role,
        signatory2Name || null,
        signatory2Role || null,
        uploaded.secure_url,
        JSON.stringify(approvalSignatories),
        creator_name,
        certificate_type || null
      ];

      db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ message: 'Failed to save certificate' });
        res.status(201).json({ message: 'Certificate saved successfully', url: uploaded.secure_url });
      });
    } catch (err) {
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Get pending certificates
  app.get('/api/pending-certificates', (req, res) => {
    const userEmail = req.query.email;
    if (!userEmail) return res.status(400).json({ message: 'Email is required' });

    const sql = `
      SELECT
        id,
        recipient_name AS rname,
        issue_date,
        number_of_signatories,
        signatory1_name,
        signatory1_role,
        signatory2_name,
        signatory2_role,
        png_path,
        approval_signatories,
        creator_name,
        status,
        certificate_type
      FROM pending_certificates
      WHERE status = 'pending'
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch certificates' });

      const filtered = results.filter(cert => {
        try {
          const signatories = JSON.parse(cert.approval_signatories || '[]');
          return signatories.some(s => s.email?.toLowerCase() === userEmail.toLowerCase());
        } catch {
          return false;
        }
      });

      res.json(filtered);
    });
  });

  // Save pending COC
  app.post('/api/pending-cert_coc', upload.single('certificatePng'), async (req, res) => {
    try {
      const {
        recipientName, numberOfHours, internsPosition, internsDepartment, pronoun, numberOfSignatories,
        signatory1Name, signatory1Role, signatory2Name, signatory2Role, creator_name
      } = req.body;

      if (!req.file) return res.status(400).json({ message: 'Certificate PNG is required' });

      const uploaded = await uploadToCloudinary(req.file.buffer, "coc");

      const approvalSignatories = [];
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('approverName')) {
          const index = key.replace('approverName', '');
          approvalSignatories.push({
            name: req.body[`approverName${index}`],
            email: req.body[`approverEmail${index}`]
          });
        }
      });

      const sql = `
        INSERT INTO pending_cert_coc
        (recipient_name, number_of_hours, interns_position, interns_department, pro_noun,
        number_of_signatories, signatory1_name, signatory1_role, signatory2_name, signatory2_role,
        png_path, approval_signatories, creator_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(sql, [
        recipientName,
        numberOfHours,
        internsPosition,
        internsDepartment,
        pronoun,
        numberOfSignatories,
        signatory1Name,
        signatory1Role,
        signatory2Name || null,
        signatory2Role || null,
        uploaded.secure_url,
        JSON.stringify(approvalSignatories),
        creator_name
      ], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to save certificate' });
        res.status(201).json({ message: 'Certificate saved successfully', url: uploaded.secure_url });
      });
    } catch (err) {
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Reject pending
  app.post('/api/pending-certificates/:id/reject', (req, res) => {
    const certId = req.params.id;
    const sql = `UPDATE pending_certificates SET status = 'rejected' WHERE id = ?`;
    db.query(sql, [certId], err => {
      if (err) return res.status(500).json({ message: 'Rejection failed' });
      res.json({ message: 'Certificate rejected' });
    });
  });

  // Approve certificate
  app.post('/api/approve-certificate-with-signature', upload.single('certificatePng'), async (req, res) => {
    try {
      const certId = req.body.id;
      if (!req.file || !certId) return res.status(400).json({ message: 'Missing file or certificate ID' });

      const uploaded = await uploadToCloudinary(req.file.buffer, "approved");

      db.query('SELECT * FROM pending_certificates WHERE id = ?', [certId], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: 'Certificate not found' });

        const cert = results[0];
        const approvalSignatories = typeof cert.approval_signatories === 'string'
          ? cert.approval_signatories
          : JSON.stringify(cert.approval_signatories || []);

        const insertSql = `
          INSERT INTO approved_certificates
          (recipient_name, creator_name, issue_date, number_of_signatories, signatory1_name, signatory1_role,
          signatory2_name, signatory2_role, png_path, approval_signatories, status, certificate_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
        `;

        db.query(insertSql, [
          cert.recipient_name,
          cert.creator_name,
          cert.issue_date,
          cert.number_of_signatories,
          cert.signatory1_name,
          cert.signatory1_role,
          cert.signatory2_name,
          cert.signatory2_role,
          uploaded.secure_url,
          approvalSignatories,
          cert.certificate_type || 'Employee of the Year'
        ], (err) => {
          if (err) return res.status(500).json({ message: 'Insert failed' });

          db.query('DELETE FROM pending_certificates WHERE id = ?', [certId], (err) => {
            if (err) return res.status(500).json({ message: 'Cleanup failed' });
            res.json({ message: 'Certificate approved and moved to approved_certificates', url: uploaded.secure_url });
          });
        });
      });
    } catch (err) {
      res.status(500).json({ message: 'Approval failed' });
    }
  });

  // DELETE approved certificate by ID
  app.delete('/api/approved-certificates/:id', (req, res) => {
    const certId = req.params.id;

    const selectSql = 'SELECT png_path FROM approved_certificates WHERE id = ?';
    db.query(selectSql, [certId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length === 0) return res.status(404).json({ message: 'Certificate not found' });

      const deleteSql = 'DELETE FROM approved_certificates WHERE id = ?';
      db.query(deleteSql, [certId], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to delete certificate from DB' });
        res.status(200).json({ message: 'Certificate deleted successfully' });
      });
    });
  });

  // Get approved certificates
  app.get('/api/approved-certificates', (req, res) => {
    const sql = `
      SELECT
        id,
        recipient_name AS rname,
        signatory1_name,
        issue_date,
        png_path,
        creator_name,
        status,
        certificate_type
      FROM approved_certificates
      WHERE status = 'approved'
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch approved certificates' });
      res.json(results);
    });
  });
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected');
});

// Get all document requests
app.get('/api/document_request', (req, res) => {
  const sql = 'SELECT RequestID, name, date_created FROM document_request ORDER BY date_created DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Failed to fetch document requests:', err);
      return res.status(500).json({ error: 'Failed to fetch document requests' });
    }
    res.json(results);
  });
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

// Use multer memory storage for upload
const uploadDoc = multer({ storage: multer.memoryStorage() });

app.post('/api/document_request', uploadDoc.single('file'), (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  let filePath = null;

  if (req.file) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const filename = Date.now() + '-' + req.file.originalname;
    const fullPath = path.join(uploadsDir, filename);

    try {
      fs.writeFileSync(fullPath, req.file.buffer);
      filePath = 'uploads/' + filename; // relative path to store in DB
    } catch (err) {
      console.error('Failed to save file:', err);
      return res.status(500).json({ error: 'Failed to save file' });
    }
  }

  const sql = 'INSERT INTO document_request (name, file_path) VALUES (?, ?)';
  db.query(sql, [name, filePath], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database insert failed' });
    }
    res.json({ success: true, id: result.insertId, filePath });
  });
});



  /* START SERVER */
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
