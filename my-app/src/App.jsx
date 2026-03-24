import { useState, useCallback } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = 'https://your-backend.onrender.com';

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const submitCertificate = useCallback(async () => {
    if (!file) {
      setError('Please select a certificate file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('certificate', file);

    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: data.valid ? 'success' : 'invalid',
          message: data.message,
          details: data.valid ? data.details : null
        });
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError('Server connection failed. Ensure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div className="app">
      <header className="header">
        <h1>🔗 Certificate Verification System</h1>
        <p>Blockchain-powered integrity check using SHA-256 hashing</p>
      </header>

      <main className="main">
        <div className="upload-section">
          <div className="file-input-wrapper">
            <input
              id="certificate"
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="file-input"
              disabled={loading}
            />
            <label htmlFor="certificate" className="file-label">
              {file ? file.name : 'Choose certificate file (PDF/Image)...'}
            </label>
          </div>

          <button
            className="submit-btn"
            onClick={submitCertificate}
            disabled={!file || loading}
          >
            {loading ? 'Processing...' : '✅ Verify Certificate'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className={`result ${result.type}`}>
            <h3>{result.message}</h3>
            {result.details && (
              <div className="details">
                <p><strong>Hash:</strong> {result.details.hash}</p>
                <p><strong>Filename:</strong> {result.details.filename}</p>
                {result.details.timestamp && (
                  <p><strong>Timestamp:</strong> {new Date(result.details.timestamp).toLocaleString()}</p>
                )}
              </div>
            )}
            {result.type === 'invalid' && (
              <p className="tamper-note">💡 File modified or not registered.</p>
            )}
          </div>
        )}

        <div className="info">
          <h4>How it works:</h4>
          <ul>
            <li>Upload exact same file → <span className="success">VALID</span></li>
            <li>Modified/tampered file → <span className="invalid">INVALID</span></li>
            <li>Hash stored in blockchain-like ledger (in-memory)</li>
            <li><strong>Admin registration now backend-only (use /add API)</strong></li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
