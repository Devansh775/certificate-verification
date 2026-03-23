import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// File storage in memory
const upload = multer({ storage: multer.memoryStorage() });

// Persistent JSON file
const CERT_FILE = path.resolve('./certificates.json');
let certificates = [];
if (fs.existsSync(CERT_FILE)) {
  certificates = JSON.parse(fs.readFileSync(CERT_FILE, 'utf-8'));
}

// SHA-256 hash
function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Save to JSON
function saveCertificates() {
  fs.writeFileSync(CERT_FILE, JSON.stringify(certificates, null, 2));
}

// ROOT
app.get('/', (req, res) => {
  res.send("Backend is running ✅");
});

// HEALTH
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

// ADD certificate
app.post('/add', upload.single('certificate'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const hash = computeHash(req.file.buffer);

  // Prevent duplicates
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

  const hash = computeHash(req.file.buffer);
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

// START
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});