import React from 'react';

const scoreToProgress = (score) => `${Math.round((score / 6) * 100)}%`;

const RiskScore = ({ score }) => {
  const safeScore = score ?? 0;
  const progress  = scoreToProgress(safeScore);

  return (
    <div className="mrs-donut-wrap">
      <div
        className={`mrs-ring mrs-level-${safeScore}`}
        style={{ ['--progress']: progress }}
      >
        <div className="mrs-ring-inner">
          <span className="mrs-score-num">{safeScore}</span>
          <span className="mrs-score-label">mRS</span>
        </div>
      </div>
    </div>
  );
};

export default RiskScore;