import React from 'react';

const MRS_LABELS = {
  0: 'No symptoms',
  1: 'No significant disability',
  2: 'Slight disability',
  3: 'Moderate disability',
  4: 'Moderately severe disability',
  5: 'Severe disability',
  6: 'Dead',
};

// Your new color palette
const SCORE_COLORS = {
  0: '#C2EFB3',
  1: '#CBE3B1',
  2: '#D4D7AF',
  3: '#DDCCAE',
  4: '#E6C0AC',
  5: '#EFB4AA',
  6: '#F8A8A8',
};

const RiskScore = ({ score, loading }) => {
  // Fallback to score 0 color if score is undefined
  const currentColor = SCORE_COLORS[score] ?? SCORE_COLORS[0];
  const label = MRS_LABELS[score] ?? '—';
  const isGoodOutcome = score <= 2;



  return (
    <div className="full-container loading-container" style={{ gap: 0 }}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />

        </div>
      )}

      <header className="content-header">

      </header>

      {/* Score hero */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '20px 0'
      }}>
        {/* Big score circle */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `6px solid ${currentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Subtle glow using the new specific color
          boxShadow: `0 0 20px ${currentColor}66`,
          background: `${currentColor}15`,
          transition: 'all 0.4s ease',
        }}>
          <span style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#333', // Darker text for better contrast against pale colors
            lineHeight: 1,
          }}>
            {score}
          </span>
        </div>

        {/* Outcome label */}
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
            {isGoodOutcome ? '✓ Good Outcome' : '⚠ Poor Outcome'}
          </span>
          <p style={{ fontSize: 13, color: '#555', marginTop: 8, fontWeight: 600 }}>
            {label}
          </p>
        </div>
      </div>

      {/* 0–6 Segmented Scale Bar */}

    </div>
  );
};

export default RiskScore;