# Certificate Verification System

## 🚀 Quick Start

### Backend (Already Running)
```
# Backend on http://localhost:5000 (nodemon active)
cd backend
npm run dev
```

### Frontend
```
cd my-app
npm install  # if needed
npm run dev  # http://localhost:5173
```

## Features
- **Register**: Upload PDF/image → SHA256 hash stored in blockchain-like ledger
- **Verify**: Upload same file → exact hash match ✅ / mismatch ❌
- File integrity: Never stores files, only hashes

## Test Flow
1. **Register**: Upload any PDF/image
2. **Verify**: Upload SAME file → "Valid Certificate + details"
3. **Tamper**: Edit file slightly → "Certificate not found or tampered"

## Tech Stack
- Frontend: React 19 + Vite
- Backend: Node/Express + Multer + Crypto (SHA256)
- Storage: In-memory array (restart → reset ledger)

## APIs
- `POST /add` - Register (hash + metadata)
- `POST /verify` - Check hash match
- `GET /health` - Status + count

**Production**: Replace in-memory with database/IPFS for persistent blockchain.
"# certificate-verification" 
