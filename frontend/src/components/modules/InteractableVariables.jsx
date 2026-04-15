import React from "react";

const InteractableVariables = ({ values, onChange }) => {
  const configs = [
    { label: "BP Systolic", key: "sys_bp", unit: "mmHg", min: 60, max: 240, safe: [80, 220] },
    { label: "BP Diastolic", key: "dis_bp", unit: "mmHg", min: 20, max: 220, safe: [60, 120] },
    { label: "Glucose", key: "glucose", unit: "mg/DL", min: 60, max: 220, safe: [80, 180] },
  ];

  return (
    <div className="clinical-vars-wrapper">
      <h2 className="clinical-title">Changeable variables</h2>
      {configs.map((s) => {
        const val = values[s.key] || s.min;
        // Calculate gradient percentages for the "Safe Zone"
        const start = ((s.safe[0] - s.min) / (s.max - s.min)) * 100;
        const end = ((s.safe[1] - s.min) / (s.max - s.min)) * 100;

        return (
          <div key={s.key} className="clinical-var-row">
            <div className="var-info">
              <span className="var-name">{s.label}</span>
            </div>

            <div className="var-controls">
              <div className="value-display-box">
                <span className="v-num">{val}</span>
                <span className="v-unit">{s.unit}</span>
              </div>

              <div className="slider-container">
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  value={val}
                  onChange={(e) => onChange({ ...values, [s.key]: Number(e.target.value) })}
                  className="clinical-range"
                  style={{
                    background: `linear-gradient(to right, #ffe5e5 0%, #ffe5e5 ${start}%, #e8f2ff ${start}%, #e8f2ff ${end}%, #ffe5e5 ${end}%, #ffe5e5 100%)`
                  }}
                />
                <div className="slider-ticks">
                  <span>{s.min}</span>
                  <span>{s.safe[0]}</span>
                  <span>{s.safe[1]}</span>
                  <span>{s.max}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InteractableVariables;