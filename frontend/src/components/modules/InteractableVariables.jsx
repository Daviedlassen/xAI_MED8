import React from "react";

const InteractableVariables = ({ values, onChange }) => {
  const updateValue = (key, val) => {
    onChange((prev) => ({ ...prev, [key]: Number(val) }));
  };

  const configs = [
    { label: "NIHSS Score", key: "nihss", min: 0, max: 42 },
    { label: "Pre-stroke mRS", key: "prestroke_mrs", min: 0, max: 5 },
    { label: "Age", key: "age", min: 18, max: 100 },
    { label: "Systolic BP", key: "sys_bp", min: 80, max: 220 }
  ];

  return (
    <div className="module-card">
      <div className="module-header"><h3>Patient Variables</h3></div>
      <div className="module-body">
        <div className="variables-container"> {/* Uses your Modules.css spacing */}
          {configs.map((s) => (
            <div key={s.key} className="variable-group">
              <div className="var-header">
                <label>{s.label}</label>
                <span className="var-value">{values[s.key]}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                value={values[s.key]}
                onChange={(e) => updateValue(s.key, e.target.value)}
                className="ios-slider"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractableVariables;