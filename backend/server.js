import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs'; // ✅ NEW

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

// In-memory blockchain-like storage
let certificates = []; // { hash, filename, timestamp }

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Compute SHA-256 hash
function computeHash(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

//
// ✅ NEW: Pre-load certificate from file
//
function loadInitialCertificate() {
  try {
    const filePath = './certificates/sample.pdf'; // 👈 path

    if (!fs.existsSync(filePath)) {
      console.log('⚠️ sample.pdf not found in /certificates folder');
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

    console.log('✅ Sample certificate loaded into blockchain');
  } catch (error) {
    console.log('❌ Error loading sample certificate:', error);
  }
}

// POST /add - Register certificate (admin)
app.post('/add', upload.single('certificate'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const hash = computeHash(req.file.buffer);

    // ✅ prevent duplicate
    const exists = certificates.find(cert => cert.hash === hash);
    if (exists) {
      return res.status(400).json({
        error: 'Certificate already registered'
      });
    }

    const filename = req.file.originalname;
    const timestamp = new Date().toISOString();

    certificates.push({ hash, filename, timestamp });

    res.json({
      success: true,
      message: 'Certificate registered successfully',
      hash,
      filename,
      timestamp
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /verify - Verify certificate
app.post('/verify', upload.single('certificate'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const hash = computeHash(req.file.buffer);

    const match = certificates.find(cert => cert.hash === hash);

    if (match) {
      res.json({
        success: true,
        valid: true,
        message: 'Valid Certificate ✅',
        details: match
      });
    } else {
      res.json({
        success: true,
        valid: false,
        message: 'Certificate not found in blockchain ❌'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', certificates: certificates.length });
});

//
// ✅ CALL FUNCTION BEFORE SERVER START
//
loadInitialCertificate();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Blockchain ledger: ${certificates.length} certificates`);
});