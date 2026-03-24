import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow all origins for now (can restrict to frontend URL)
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Multer in-memory storage for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Certificates DB file
const CERT_FILE = path.join(process.cwd(), 'certificates.json');
// Path to sample certificate (must exist in repo)
const SAMPLE_CERT_PATH = path.join(process.cwd(), 'certificates', 'sample.pdf');

// Load existing certificates from JSON
let certificates = [];
if (fs.existsSync(CERT_FILE)) {
  try {
    certificates = JSON.parse(fs.readFileSync(CERT_FILE, 'utf-8'));
  } catch (err) {
    console.warn('Error reading certificates.json:', err);
    certificates = [];
  }
}

// Preload sample certificate if not already in DB
try {
  if (fs.existsSync(SAMPLE_CERT_PATH)) {
    const buffer = fs.readFileSync(SAMPLE_CERT_PATH);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    if (!certificates.find(c => c.hash === hash)) {
      certificates.push({
        hash,
        filename: 'sample.pdf',
        path: SAMPLE_CERT_PATH,
        addedAt: new Date().toISOString()
      });
      fs.writeFileSync(CERT_FILE, JSON.stringify(certificates, null, 2));
      console.log('✅ Sample certificate loaded');
    }
  } else {
    console.warn('⚠ Sample certificate not found:', SAMPLE_CERT_PATH);
  }
} catch (err) {
  console.error('Error loading sample certificate:', err);
}

// Helper to save certificates to file
function saveCertificates() {
  fs.writeFileSync(CERT_FILE, JSON.stringify(certificates, null, 2));
}

// ROOT route
app.get('/', (req, res) => res.send('Backend is running ✅'));

// HEALTH check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', certificates: certificates.length });
});

// ADD certificate
app.post('/add', upload.single('certificate'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

  if (certificates.find(c => c.hash === hash)) {
    return res.json({ success: false, message: 'Certificate already registered' });
  }

  const certData = {
    hash,
    filename: req.file.originalname,
    addedAt: new Date().toISOString()
  };

  certificates.push(certData);
  saveCertificates();

  res.json({ success: true, message: 'Certificate added ✅', details: certData });
});

// VERIFY certificate
app.post('/verify', upload.single('certificate'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  const match = certificates.find(c => c.hash === hash);

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
    message: 'Invalid Certificate ❌\n💡 File modified or not registered'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📁 Certificates DB: ${CERT_FILE}`);
  console.log(`📊 Loaded ${certificates.length} certificates`);
});