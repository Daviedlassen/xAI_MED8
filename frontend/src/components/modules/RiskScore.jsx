import React from 'react';
import './Modules.css';

const RiskScore = ({ score, loading }) => {
  return (
    <div className="module-card score-panel">
      <div className="module-header">
        <h3>Predicted 90-day mRS</h3>
      </div>
      <div className="module-body risk-score-body">
        <div className={`mrs-circle mrs-level-${score}`}>
          <span className="mrs-number">{loading ? "..." : score}</span>
        </div>

        <div className="mrs-description">
          <p className="mrs-outcome-text">
            {score <= 1 ? "Favorable Outcome" :
             score >= 5 ? "Severe Disability / Death" :
             "Moderate Disability"}
          </p>
          <p className="mrs-subtext">
            Based on current clinical variables
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskScore;