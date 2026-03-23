import { useState, useCallback } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ✅ PUT YOUR REAL RENDER BACKEND URL HERE
  const API_BASE = 'https://certificate-verification-2.onrender.com';

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

      // ✅ FIXED CONDITION
      if (data.valid !== undefined) {
        setResult({
          type: data.valid ? 'success' : 'invalid',
          message: data.valid
            ? 'Valid Certificate ✅'
            : 'Invalid Certificate ❌',
          details: data.details || null
        });
      } else {
        setError(data.error || 'Request failed');
      }

    } catch (err) {
      setError('❌ Server not reachable. Please try again.');
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

        {/* ERROR */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className={`result ${result.type}`}>
            <h3>{result.message}</h3>

            {result.details && (
              <div className="details">
                <p><strong>Hash:</strong> {result.details.hash}</p>
                <p><strong>Filename:</strong> {result.details.filename}</p>
              </div>
            )}

            {result.type === 'invalid' && (
              <p className="tamper-note">
                💡 File modified or not registered
              </p>
            )}
          </div>
        )}

        {/* INFO */}
        <div className="info">
          <h4>How it works:</h4>
          <ul>
            <li>Upload same file → <span className="success">VALID</span></li>
            <li>Modified file → <span className="invalid">INVALID</span></li>
            <li>Hash stored in blockchain-like system</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;