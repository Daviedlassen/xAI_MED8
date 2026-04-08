import React from "react";
import "./Modules.css";

const AnalysisChart = ({ data }) => {
  // If no data is passed yet, we'll use this mock set
  const features = data || [
    { name: "NIHSS Score", value: 0.85 },
    { name: "Age", value: 0.42 },
    { name: "Blood Glucose", value: -0.25 },
    { name: "Prior Stroke", value: 0.15 },
    { name: "Systolic BP", value: -0.12 },
  ];

  return (
    <div className="module-body shap-container">
      <div className="shap-header">
        <span className="shap-title">Feature Importance (SHAP)</span>
        <span className="shap-subtitle">Impact on Model Prediction</span>
      </div>

      <div className="shap-list">
        {features.map((f, i) => (
          <div key={i} className="shap-row">
            <div className="shap-label">{f.name}</div>
            <div className="shap-bar-wrapper">
              {/* Left side (Negative impact) */}
              <div className="shap-axis-half">
                {f.value < 0 && (
                  <div
                    className="shap-bar negative"
                    style={{ width: `${Math.abs(f.value) * 100}%` }}
                  />
                )}
              </div>
              {/* Right side (Positive impact) */}
              <div className="shap-axis-half">
                {f.value > 0 && (
                  <div
                    className="shap-bar positive"
                    style={{ width: `${f.value * 100}%` }}
                  />
                )}
              </div>
            </div>
            <div className="shap-value">
              {f.value > 0 ? `+${f.value}` : f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisChart;