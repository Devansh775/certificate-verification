import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

const CERTIFICATES_DB = path.join(process.cwd(), 'certificates.json');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// Load certificates from file
async function loadCertificates() {
  try {
    const data = await fs.readFile(CERTIFICATES_DB, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save certificates to file
async function saveCertificates(certs) {
  await fs.mkdir(path.dirname(CERTIFICATES_DB), { recursive: true });
  await fs.writeFile(CERTIFICATES_DB, JSON.stringify(certs, null, 2));
}

// Hash function
function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Load on startup
let certificates = await loadCertificates();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    certificates: certificates.length,
    dbPath: CERTIFICATES_DB 
  });
});

// List all certificates
app.get('/certificates', (req, res) => {
  res.json(certificates);
});

// Add certificate
app.post('/add', upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const hash = computeHash(req.file.buffer);
    const cert = {
      hash,
      filename: req.file.originalname,
      size: req.file.size,
      timestamp: new Date().toISOString()
    };

    // Check if exists
    if (certificates.find(c => c.hash === hash)) {
      return res.json({ success: true, message: 'Certificate already registered', existing: true });
    }

    certificates.push(cert);
    await saveCertificates(certificates);

    res.json({ 
      success: true, 
      message: 'Certificate registered successfully ✅',
      ...cert 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify certificate
app.post('/verify', upload.single('certificate'), async (req, res) => {
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
        message: 'Valid Certificate - Matches registered hash ✅',
        details: match
      });
    } else {
      res.json({
        success: true,
        valid: false,
        message: 'Certificate not found or tampered - Hash mismatch ❌'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Root route
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

app.listen(PORT, async () => {
  console.log(`🚀 Certificate Verification Backend on http://localhost:${PORT}`);
  console.log(`📁 Data: ${CERTIFICATES_DB}`);
  console.log(`📊 Loaded ${certificates.length} certificates`);
});
