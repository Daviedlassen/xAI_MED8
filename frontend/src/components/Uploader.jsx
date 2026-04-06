/* Uploader.jsx */

import React, { useState } from 'react';

const Uploader = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      document.getElementById('csv-upload').click();
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/ml/upload-csv", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      setData(result);
    } catch (err) {
      alert("CONNECTION_ERROR: Check FastAPI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploader-container">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ letterSpacing: '-1px' }}>DATA_INGESTION_MODULE</h2>
        <p style={{ opacity: 0.5, fontSize: '12px' }}>UPLOAD PATIENT DATASET (.CSV)</p>
      </div>

      <div className="upload-zone" style={{ border: '2px dashed var(--border)', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
        <input type="file" id="csv-upload" accept=".csv" onChange={(e) => setFile(e.target.files[0])} hidden />
        <p style={{ marginBottom: '20px' }}>{file ? `SELECTED: ${file.name.toUpperCase()}` : "NO_FILE_READY"}</p>
        <button className="nav-btn" onClick={handleUpload} style={{ background: 'var(--accent)', color: 'white', padding: '10px 30px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          {loading ? "PROCESSING..." : !file ? "SELECT_FILE" : "EXECUTE_UPLOAD"}
        </button>
      </div>

      {data && (
        <div style={{ marginTop: '40px', overflowX: 'auto' }}>
          <table className="clinical-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                {data.columns.map(col => <th key={col} style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.preview.map((row, i) => (
                <tr key={i}>
                  {data.columns.map(col => <td key={col} style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{row[col]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Uploader;