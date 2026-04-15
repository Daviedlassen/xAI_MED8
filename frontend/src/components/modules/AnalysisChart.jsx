import React from "react";

const AnalysisChart = ({ data }) => {
  const features = data || [];

  return (
    <div className="shap-viz" style={{ width: '100%' }}>
      <h2 className="clinical-title">SHAP/LIME</h2>
      <div className="shap-axis-wrapper">
        <div className="vertical-axis"></div>
        {features.map((f, i) => {
          const isPos = f.value > 0;
          const absVal = Math.abs(f.value);
          const width = Math.min((absVal / 5) * 100, 100);

          return (
            <div key={i} className="shap-row-new">
              {/* Added ellipsis to label to prevent pushing box */}
              <div className="shap-label-new" style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: '8px'
              }}>
                {f.name}
              </div>

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