import React from "react";
import "./Modules.css";

const InteractableVariables = ({ values, onChange }) => {
  const updateValue = (key, val) => {
    onChange((prev) => ({ ...prev, [key]: parseFloat(val) }));
  };

  return (
    <div className="module-body variables-container">
      <div className="variable-group">
        <div className="var-header">
          <label>NIHSS Score</label>
          <span className="var-value">{values.nihss}</span>
        </div>
        <input
          type="range" min="0" max="42" step="1"
          value={values.nihss}
          onChange={(e) => updateValue("nihss", e.target.value)}
          className="ios-slider"
        />
      </div>

      <div className="variable-group">
        <div className="var-header">
          <label>Patient Age</label>
          <span className="var-value">{values.age}y</span>
        </div>
        <input
          type="range" min="18" max="100" step="1"
          value={values.age}
          onChange={(e) => updateValue("age", e.target.value)}
          className="ios-slider"
        />
      </div>

      <div className="variable-group">
        <div className="var-header">
          <label>Glucose (mg/dL)</label>
          <span className="var-value">{values.glucose}</span>
        </div>
        <input
          type="range" min="20" max="400" step="1"
          value={values.glucose}
          onChange={(e) => updateValue("glucose", e.target.value)}
          className="ios-slider"
        />
      </div>

      <div className="var-info-box">
        Adjust sliders to simulate "What-If" scenarios.
      </div>
    </div>
  );
};

export default InteractableVariables;