import React from "react";

const AnalysisChart = ({ data }) => {
  const features = data || [
    { name: "BP Systolic", value: 3.0 },
    { name: "BP Diastolic", value: 2.2 },
    { name: "Glucose", value: -1.2 },
    { name: "LDL Cholesterol", value: -1.0 },
  ];

  return (
    <div className="shap-viz">
      <h2 className="clinical-title">SHAP/LIME</h2>
      <div className="shap-axis-wrapper">
        <div className="vertical-axis"></div>
        {features.map((f, i) => {
          const isPos = f.value > 0;
          const absVal = Math.abs(f.value);
          const width = Math.min((absVal / 5) * 100, 100); // Scale relative to 5.0

          return (
            <div key={i} className="shap-row-new">
              <div className="shap-label-new">{f.name}</div>
              <div className="bar-track">
                <div
                  className={`bar-fill ${isPos ? "pos" : "neg"}`}
                  style={{
                    width: `${width / 2}%`,
                    [isPos ? "left" : "right"]: "50%"
                  }}
                >
                  <span className="bar-val-text">{isPos ? `+${f.value}` : f.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisChart;