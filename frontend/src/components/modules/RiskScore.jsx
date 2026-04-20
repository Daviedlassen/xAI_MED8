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

const getScoreColor = (val) => {
  if (val <= 2) return '#2ecc71';
  if (val <= 4) return '#f1c40f';
  return '#e74c3c';
};

const RiskScore = ({ score, loading }) => {
  const color = getScoreColor(score);
  const label = MRS_LABELS[score] ?? '—';
  const isGoodOutcome = score <= 2;

  // Build tick marks 0–6
  const ticks = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="full-container loading-container" style={{ gap: 0 }}>
      {/* Loading overlay — uses existing CSS */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      <header className="content-header">
        <h2 className="clinical-title">Predicted mRS</h2>
      </header>

      {/* Score hero */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        {/* Big score circle */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `6px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 28px ${color}33`,
          background: `${color}11`,
          transition: 'all 0.4s ease',
        }}>
          <span style={{
            fontSize: 64,
            fontWeight: 900,
            color,
            lineHeight: 1,
            transition: 'color 0.3s ease',
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
            background: `${color}22`,
            color,
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

      {/* 0–6 scale bar */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ position: 'relative', height: 36, marginBottom: 20 }}>
          {/* Gradient track */}
          <div style={{
            position: 'absolute',
            top: 8,
            left: 0,
            right: 0,
            height: 20,
            borderRadius: 6,
            background: 'linear-gradient(to right, #2ecc71 0%, #2ecc71 28%, #f1c40f 28%, #f1c40f 57%, #e74c3c 57%, #e74c3c 100%)',
            border: '1px solid #e5e5ea',
          }} />

          {/* Active score needle */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: `${(score / 6) * 100}%`,
            transform: 'translateX(-50%)',
            transition: 'left 0.4s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '10px solid #000',
            }} />
            <div style={{ width: 2, height: 28, background: '#000' }} />
          </div>
        </div>

        {/* Tick numbers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
          {ticks.map(t => (
            <span key={t} style={{
              fontSize: 13,
              fontWeight: t === score ? 900 : 600,
              color: t === score ? color : '#8e8e93',
              transition: 'color 0.3s',
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskScore;
