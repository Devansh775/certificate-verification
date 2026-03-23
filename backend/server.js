import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

let certificates = [];

const upload = multer({ storage: multer.memoryStorage() });

// Hash
function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ✅ ROOT (for testing)
app.get('/', (req, res) => {
  res.send("Backend is running ✅");
});

// ✅ HEALTH
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

// ADD
app.post('/add', upload.single('certificate'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const hash = computeHash(req.file.buffer);

  certificates.push({
    hash,
    filename: req.file.originalname
  });

  res.json({ success: true, hash });
});

// VERIFY
app.post('/verify', upload.single('certificate'), (req, res) => {
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
    message: 'Invalid Certificate ❌'
  });
});

// START
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});