import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED CORS (IMPORTANT)
app.use(cors({
  origin: '*',   // allow Vercel frontend
}));
app.use(express.json());

// In-memory storage
let certificates = [];

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Hash function
function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ✅ FIXED FILE PATH (important for Render)
function loadInitialCertificate() {
  try {
    const filePath = new URL('./certificates/sample.pdf', import.meta.url);

    if (!fs.existsSync(filePath)) {
      console.log('⚠️ sample.pdf not found');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const hash = computeHash(fileBuffer);

    const exists = certificates.find(cert => cert.hash === hash);
    if (exists) {
      console.log('⚠️ Certificate already loaded');
      return;
    }

    certificates.push({
      hash,
      filename: 'sample.pdf',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Sample certificate loaded');
  } catch (error) {
    console.log('❌ Error loading sample certificate:', error.message);
  }
}

// 🔹 ADD CERTIFICATE
app.post('/add', upload.single('certificate'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const hash = computeHash(req.file.buffer);

    const exists = certificates.find(cert => cert.hash === hash);
    if (exists) {
      return res.status(400).json({
        error: 'Certificate already registered'
      });
    }

    const data = {
      hash,
      filename: req.file.originalname,
      timestamp: new Date().toISOString()
    };

    certificates.push(data);

    res.json({
      success: true,
      message: 'Certificate registered successfully',
      data
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔹 VERIFY CERTIFICATE
app.post('/verify', upload.single('certificate'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const hash = computeHash(req.file.buffer);

    const match = certificates.find(cert => cert.hash === hash);

    if (match) {
      return res.json({
        success: true,
        valid: true,
        message: 'Valid Certificate ✅',
        details: match
      });
    }

    res.json({
      success: true,
      valid: false,
      message: 'Certificate not found in blockchain ❌'
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔹 HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'OK', total: certificates.length });
});

// 🔹 LOAD SAMPLE CERTIFICATE
loadInitialCertificate();

// 🔹 START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});