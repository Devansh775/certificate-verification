import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Path to certificates DB and folder
const CERTIFICATES_FOLDER = path.join(process.cwd(), 'certificates_files');
const SAMPLE_CERT_PATH = path.join(process.cwd(), 'certificates', 'sample.pdf'); // ✅ relative path

// Folder for uploaded certificates


app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Ensure upload folder exists
await fs.mkdir(CERTIFICATES_FOLDER, { recursive: true });

// Multer storage for new uploads
const storage = multer.diskStorage({
  destination: CERTIFICATES_FOLDER,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Hash function
function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Load certificates
async function loadCertificates() {
  let certs = [];

  // Load existing DB if exists
  try {
    const data = await fs.readFile(CERTIFICATES_DB, 'utf8');
    certs = JSON.parse(data);
  } catch {}

  // ✅ Add sample certificate if not already in DB
  try {
    const buffer = await fs.readFile(SAMPLE_CERT_PATH);
    const hash = computeHash(buffer);
    if (!certs.find(c => c.hash === hash)) {
      certs.push({
        hash,
        filename: path.basename(SAMPLE_CERT_PATH),
        size: buffer.length,
        path: SAMPLE_CERT_PATH,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Sample certificate not found at path:', SAMPLE_CERT_PATH);
  }

  // Save updated DB
  await fs.writeFile(CERTIFICATES_DB, JSON.stringify(certs, null, 2));
  return certs;
}

// Load certificates on startup
let certificates = await loadCertificates();

// Routes

app.get('/health', (req, res) => res.json({ status: 'OK', certificates: certificates.length }));

app.get('/certificates', (req, res) => res.json(certificates));

app.post('/add', upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const buffer = await fs.readFile(req.file.path);
    const hash = computeHash(buffer);

    if (certificates.find(c => c.hash === hash)) {
      return res.json({ success: true, message: 'Certificate already registered', existing: true });
    }

    const cert = {
      hash,
      filename: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      timestamp: new Date().toISOString()
    };

    certificates.push(cert);
    await fs.writeFile(CERTIFICATES_DB, JSON.stringify(certificates, null, 2));

    res.json({ success: true, message: 'Certificate registered successfully ✅', ...cert });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.post('/verify', upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const buffer = await fs.readFile(req.file.path);
    const hash = computeHash(buffer);

    const match = certificates.find(c => c.hash === hash);
    if (match) {
      res.json({ success: true, valid: true, message: 'Valid Certificate ✅', details: match });
    } else {
      res.json({ success: true, valid: false, message: 'Certificate not found or tampered ❌' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Certificate Verification API ✅',
    endpoints: {
      add: 'POST /add (multipart/form-data, certificate=file)',
      verify: 'POST /verify (multipart/form-data, certificate=file)',
      list: 'GET /certificates',
      health: 'GET /health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📁 Sample certificate loaded from: ${SAMPLE_CERT_PATH}`);
  console.log(`📊 Loaded ${certificates.length} certificates`);
});