import React from "react";
import "./Modules.css";

const RiskScore = ({ score }) => {
  // score is 0-6
  const mRS = Math.min(Math.max(score, 0), 6);

  // Mapping 0-6 to 0-100 for the SVG circle
  const percentage = (mRS / 6) * 100;

  const mRSLabels = [
    "No symptoms",
    "No significant disability",
    "Slight disability",
    "Moderate disability",
    "Mod. severe disability",
    "Severe disability",
    "Dead"
  ];

  const getStatusColor = (val) => {
    if (val <= 1) return "#34c759"; // Green (Good outcome)
    if (val <= 3) return "#ffcc00"; // Yellow
    return "#ff3b30"; // Red
  };

  const color = getStatusColor(mRS);

  return (
    <div className="module-body risk-container">
      <div className="risk-header">
        <span className="risk-title">Predicted mRS</span>
      </div>

      <div className="risk-display">
        <svg viewBox="0 0 36 36" className="circular-chart">
          <path className="circle-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path className="circle"
            strokeDasharray={`${percentage}, 100`}
            stroke={color}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <text x="18" y="21" className="mrs-number" fill={color}>{mRS}</text>
        </svg>
      </div>

      <div className="risk-status" style={{ color: color }}>
        {mRSLabels[mRS]}
      </div>

      <p className="risk-meta">Modified Rankin Scale (mRS)</p>
    </div>
  );
};

export default RiskScore;