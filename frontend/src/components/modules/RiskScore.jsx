import React, { useState } from 'react';



// Each level fills a proportional arc (score/6 * 100%)
const scoreToProgress = (score) => `${Math.round((score / 6) * 100)}%`;

const RiskScore = ({ score, loading, patientData, thresholds, shapData }) => {

  const safeScore = score ?? 0;

  const progress  = scoreToProgress(safeScore);

  return (
    <div className="mrs-donut-wrap">

      {/* ── Large conic-gradient donut ── */}
      <div
        className={`mrs-ring mrs-level-${safeScore}`}
        style={{ '--progress': progress }}
      >
        <div className="mrs-ring-inner">
          <span className="mrs-score-num">{safeScore}</span>
          <span className="mrs-score-label">mRS</span>
        </div>
      </div>

      {/* ── Outcome label ── */}


      {/* ── Debug toggle ── */}

    </div>
  );
};

export default RiskScore;