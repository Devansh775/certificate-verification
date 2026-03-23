import { useState, useCallback } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ✅ Your backend URL
  const API_BASE = 'https://certificate-verification-2.onrender.com'; // Change to deployed backend if needed

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

      if (data.valid !== undefined) {
        setResult({
          type: data.valid ? 'success' : 'invalid',
          message: data.valid ? 'Valid Certificate ✅' : 'Invalid Certificate ❌',
          details: data.details || { filename: file.name, hash: 'N/A' }
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
        <p>Blockchain-like integrity check using SHA-256 hashing</p>
      </header>

      <main className="main">
        <div className="upload-section">
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
          <button onClick={submitCertificate} disabled={!file || loading}>
            {loading ? 'Processing...' : '✅ Verify Certificate'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className={`result ${result.type}`}>
            <h3>{result.message}</h3>
            {result.details && (
              <div className="details">
                <p><strong>Filename:</strong> {result.details.filename}</p>
                <p><strong>Hash:</strong> {result.details.hash}</p>
              </div>
            )}
            {result.type === 'invalid' && (
              <p>💡 File modified or not registered</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;