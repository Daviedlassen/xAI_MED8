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
    <div className="full-container loading-container" style={{ gap: 0 }}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Score hero */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '20px 0',
      }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `6px solid ${currentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 20px ${currentColor}66`,
          background: `${currentColor}15`,
          transition: 'all 0.4s ease',
        }}>
          <span style={{ fontSize: 64, fontWeight: 900, color: '#333', lineHeight: 1 }}>
            {score}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 20,
            background: isGoodOutcome ? '#C2EFB388' : '#F8A8A888',
            color: '#444',
            fontWeight: 700,
            fontSize: 13,
          }}>
            mRS {score}
          </span>
          <p style={{ fontSize: 13, color: '#555', marginTop: 8, fontWeight: 600 }}>
            {label}
          </p>
        </div>
      </div>

      {/* Debug / verification panel */}
      <div style={{ padding: '0 16px 16px' }}>
        <button
          onClick={() => setDebugOpen(d => !d)}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: 'transparent',
            cursor: 'pointer',
            color: '#888',
            width: '100%',
          }}
        >
          {debugOpen ? '▲ Hide verification' : '▼ Show verification'}
        </button>

        {debugOpen && (
          <div style={{
            marginTop: 8,
            fontFamily: 'monospace',
            fontSize: 11,
            padding: 12,
            background: '#f7f7f7',
            borderRadius: 8,
            border: '1px solid #e0e0e0',
            overflowX: 'auto',
          }}>
            <div style={{ marginBottom: 8, color: '#555', fontWeight: 700 }}>Sent to model</div>
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

            <div style={{ margin: '10px 0 4px', color: '#555', fontWeight: 700 }}>
              Predicted mRS: <span style={{ color: '#222' }}>{score}</span> — {label}
            </div>

            <div style={{ marginBottom: 4, color: '#555', fontWeight: 700 }}>Top SHAP factors</div>
            <pre style={{ margin: 0 }}>{JSON.stringify(shapData?.top ?? {}, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskScore;