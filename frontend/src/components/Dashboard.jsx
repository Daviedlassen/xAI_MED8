import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [patientState, setPatientState] = useState({
    bpSystolic: 120,
    glucose: 110,
    physioTime: 24,
    ldl: 3.5
  });

  const [inference, setInference] = useState({
    recoveryScore: 0, // This is our mRS Score (0-6)
    impacts: [
      { feature: 'BP Systolic', value: 0 },
      { feature: 'Glucose', value: 0 },
      { feature: 'Physio Initiation', value: 0 },
      { feature: 'LDL Cholesterol', value: 0 }
    ]
  });

  useEffect(() => {
    const updatePrediction = async () => {
      try {
        const response = await fetch("http://localhost:8000/ml/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientState),
        });
        const result = await response.json();
        setInference(result);
      } catch (e) {
        console.error("INFERENCE_FAILURE:", e);
      }
    };
    updatePrediction();
  }, [patientState]);

  // 1. mRS Clinical Color Logic: 0 (Green) -> 6 (Black/Red)
  const getMRSColor = (score) => {
    const s = Math.round(score);
    if (s <= 1) return '#2ecc71'; // Green (No disability)
    if (s === 2) return '#f1c40f'; // Yellow
    if (s === 3) return '#e67e22'; // Orange
    if (s === 4) return '#e74c3c'; // Red
    if (s === 5) return '#c0392b'; // Deep Red
    return '#1e293b';              // Slate/Black (mRS 6)
  };

  const renderSlider = (label, key, min, max, step = 1, unit = "") => (
    <div className="slider-group" key={key}>
      <div className="slider-header">
        <label>{label}</label>
        <span className="value-display">{patientState[key]}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={patientState[key]}
        onChange={(e) => setPatientState({...patientState, [key]: parseFloat(e.target.value)})}
      />
    </div>
  );

  // 2. Numerical Logic for the 0-6 Scale
  const displayScore = Math.min(Math.max(Math.round(inference.recoveryScore), 0), 6);
  const visualPercentage = (displayScore / 6) * 100;

  return (
    <div className="dashboard-container">
      <header className="patient-header">
        <div className="summary-item"><span className="label">PATIENT_ID</span><span className="val">#171223</span></div>
        <div className="summary-item"><span className="label">AGE</span><span className="val">83</span></div>
        <div className="summary-item"><span className="label">GENDER</span><span className="val">MALE</span></div>
        <div className="summary-item"><span className="label">HISTORY</span><span className="val">HYPERTENSION, DIABETES</span></div>
      </header>

      <div className="main-grid">
        <section className="controls-card">
          <h3 className="section-title">CHANGEABLE VARIABLES</h3>
          {renderSlider("BP Systolic", "bpSystolic", 90, 200, 1, " mmHg")}
          {renderSlider("Glucose", "glucose", 70, 300, 1, " mg/dL")}
          {renderSlider("Physio Initiation", "physioTime", 1, 120, 1, " hrs")}
          {renderSlider("LDL Cholesterol", "ldl", 1, 10, 0.1)}
        </section>

        <section className="explanation-card">
          <h3 className="section-title">SHAP / LIME ANALYSIS</h3>
          {inference.impacts.map((item, i) => {
            const isPos = item.value > 0;
            const isNeg = item.value < 0;
            const isNeutral = item.value === 0;
            return (
              <div key={i} className="bar-row">
                <div className="bar-label">{item.feature}</div>
                <div className="bar-track">
                  <div className="bar-fill pos" style={{ width: isPos ? `${Math.min(item.value * 10, 50)}%` : '0%', left: '50%', opacity: isPos ? 1 : 0 }}>
                    {item.value > 0.05 ? `+${item.value}` : ""}
                  </div>
                  <div className="bar-fill neg" style={{ width: isNeg ? `${Math.min(Math.abs(item.value) * 10, 50)}%` : '0%', right: '50%', opacity: isNeg ? 1 : 0 }}>
                    {item.value < -0.05 ? item.value : ""}
                  </div>
                  <div className="bar-neutral" style={{ opacity: isNeutral ? 1 : 0, transform: `translate(-50%, -50%) scale(${isNeutral ? 1 : 0.05})`, visibility: isNeutral ? 'visible' : 'hidden' }}>0</div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="outcome-card">
          <div className="recovery-widget">
            <h3 className="section-title">mRS_OUTCOME</h3>
            <div className="circle-container">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path
                  className="circle"
                  stroke={getMRSColor(displayScore)}
                  strokeDasharray={`${visualPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="percentage">{displayScore}</div>
            </div>
            <div className="status-label">mRS</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;