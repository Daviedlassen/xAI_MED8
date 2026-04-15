/*V1*/
import React from 'react';
import './Modules.css';

const RiskScore = ({ score, loading }) => {
  // Ensure the math results in a clean percentage string
  const fillPercentage = loading ? "0%" : `${Math.max(0, 100 - (score * 16.6))}%`;

  return (
    <div className="risk-container">
      <div
        className={`mrs-circle mrs-level-${score}`}
        style={{
          // Use the exact variable name defined in CSS
          "--progress": fillPercentage
        }}
      >
        <span className="mrs-number">{loading ? "..." : score}</span>
      </div>
    </div>
  );
};

export default RiskScore;