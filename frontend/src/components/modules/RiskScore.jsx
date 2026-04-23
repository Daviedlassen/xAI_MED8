import React, { useState } from 'react';

const MRS_LABELS = {
  0: "No symptoms",
  1: "No significant disability",
  2: "Slight disability",
  3: "Moderate disability",
  4: "Moderately severe disability",
  5: "Severe disability",
  6: "Dead",
};

const SCORE_COLORS = {
  0: '#C2EFB3',
  1: '#CBE3B1',
  2: '#D4D7AF',
  3: '#DDCCAE',
  4: '#E6C0AC',
  5: '#EFB4AA',
  6: '#F8A8A8',
};

const RiskScore = ({ score, loading, patientData, thresholds, shapData }) => {
  const [debugOpen, setDebugOpen] = useState(false);

  const currentColor  = SCORE_COLORS[score] ?? SCORE_COLORS[0];
  const label         = MRS_LABELS[score]   ?? '';
  const isGoodOutcome = score <= 2;

  return (
    <div className="full-container loading-container" style={{ gap: 0, alignItems: 'center', justifyContent: 'center' }}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Score circle */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: `5px solid ${currentColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${currentColor}20`,
        transition: 'all 0.4s ease',
      }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: '#1c1c1e', lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#636366', marginTop: 1 }}>
          mRS
        </span>
      </div>

      <p style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#636366',
        textAlign: 'center',
        margin: '6px 0 0',
        padding: '0 8px',
      }}>
        {label}
      </p>

      {/* Debug panel */}
      <div style={{ width: '100%', padding: '6px 8px 0', boxSizing: 'border-box' }}>
        <button
          onClick={() => setDebugOpen(d => !d)}
          style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 4,
            border: '1px solid #ddd', background: 'transparent',
            cursor: 'pointer', color: '#aaa', width: '100%',
          }}
        >
          {debugOpen ? '▲ hide' : '▼ verify'}
        </button>
        {debugOpen && (
          <div style={{
            marginTop: 6, fontFamily: 'monospace', fontSize: 10,
            padding: 8, background: '#f7f7f7', borderRadius: 6,
            border: '1px solid #e0e0e0', overflowX: 'auto',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#555' }}>Sent to model</div>
            <pre style={{ margin: 0 }}>{JSON.stringify({
              age:                patientData?.age,
              nihss_score:        patientData?.nihss,
              prestroke_mrs:      patientData?.prestroke_mrs,
              sys_blood_pressure: patientData?.sys_bp,
              dis_blood_pressure: patientData?.dis_bp,
              glucose:            patientData?.glucose,
              cholesterol:        patientData?.cholesterol,
              thresholds,
            }, null, 2)}</pre>
            <div style={{ margin: '6px 0 2px', fontWeight: 700, color: '#555' }}>
              mRS {score} — {label}
            </div>
            <div style={{ fontWeight: 700, color: '#555', marginBottom: 2 }}>Top SHAP</div>
            <pre style={{ margin: 0 }}>{JSON.stringify(shapData?.top ?? {}, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskScore;