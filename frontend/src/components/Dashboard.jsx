import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('vitals');

  // State keys updated to match your provided ML labels exactly
  const [patientState, setPatientState] = useState({
    // Vitals & Measurements
    sys_blood_pressure: 120,
    dis_blood_pressure: 80,
    glucose: 110,
    cholesterol: 3.5,
    age: 83,

    // Severity & Scores
    nihss_score: 12,
    discharge_nihss_score: 8,
    prestroke_mrs: 0,
    tici_score: 3,
    perfusion_core: 20,
    hypoperfusion_core: 40,

    // Clinical History / Risk (Binary)
    risk_smoker: false,
    risk_diabetes: false,
    risk_hypertension: true,
    risk_hyperlipidemia: false,
    risk_congestive_heart_failure: false,
    risk_coronary_artery_disease_or_myocardial_infarction: false,
    risk_hiv: false,
    risk_previous_hemorrhagic_stroke: false,
    risk_previous_ischemic_stroke: false,
    covid_test: false,
    hospital_stroke: false,
    imaging_done: true,

    // Medication Before Onset
    before_onset_antidiabetics: false,
    before_onset_cilostazol: false,
    before_onset_clopidrogel: false,
    before_onset_dipyridamol: false,
    before_onset_prasugrel: false,
    before_onset_ticagrelor: false,
    before_onset_ticlopidine: false,
    before_onset_warfarin: false,

    // Medication at Discharge
    discharge_antidiabetics: false,
    discharge_apixaban: false,
    discharge_cilostazol: false,
    discharge_clopidrogel: false,
    discharge_dabigatran: false,
    discharge_dipyridamol: false,
    discharge_edoxaban: false,
    discharge_heparin: false,
    discharge_prasugrel: false,
    discharge_rivaroxaban: false,
    discharge_ticagrelor: false,
    discharge_ticlopidine: false,
    discharge_warfarin: false,

    // Process & Hospital Metrics
    physiotherapy_start_within_3days: true,
    occup_physiotherapy_received: true,
    prenotification: true,
    door_to_imaging: 25,
    door_to_needle: 45,
    onset_to_door: 90
  });

  const [inference, setInference] = useState({
    recoveryScore: 0,
    impacts: []
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
      } catch (e) { console.error("INFERENCE_FAILURE:", e); }
    };
    updatePrediction();
  }, [patientState]);

  const getMRSColor = (score) => {
    const s = Math.round(score);
    if (s <= 1) return '#2ecc71';
    if (s === 2) return '#f1c40f';
    if (s === 3) return '#e67e22';
    if (s === 4) return '#e74c3c';
    if (s === 5) return '#c0392b';
    return '#1e293b';
  };

  const renderSlider = (label, key, min, max, step = 1, unit = "") => (
    <div className="slider-group" key={key}>
      <div className="slider-header">
        <label>{label}</label>
        <span className="value-display">{patientState[key]}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={patientState[key]}
        onChange={(e) => setPatientState({...patientState, [key]: parseFloat(e.target.value)})}
      />
    </div>
  );

  const renderSwitch = (label, key) => (
    <div className="switch-group" key={key}>
      <label>{label}</label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={patientState[key]}
          onChange={(e) => setPatientState({...patientState, [key]: e.target.checked})}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );

  const displayScore = Math.min(Math.max(Math.round(inference.recoveryScore), 0), 6);
  const visualPercentage = (displayScore / 6) * 100;

  return (
    <div className="dashboard-container">
      <header className="patient-header">
        <div className="summary-item"><span className="label">PATIENT_ID</span><span className="val">#171223</span></div>
        <div className="summary-item"><span className="label">AGE</span><span className="val">{patientState.age}</span></div>
        <div className="summary-item"><span className="label">mRS_PRE_STROKE</span><span className="val">{patientState.prestroke_mrs}</span></div>
      </header>

      <div className="main-grid">
        <section className="controls-card">
          <div className="tab-nav">
            <button className={activeTab === 'vitals' ? 'active' : ''} onClick={() => setActiveTab('vitals')}>VITALS</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>HISTORY</button>
            <button className={activeTab === 'meds' ? 'active' : ''} onClick={() => setActiveTab('meds')}>MEDS</button>
            <button className={activeTab === 'scores' ? 'active' : ''} onClick={() => setActiveTab('scores')}>SCORES</button>
            <button className={activeTab === 'process' ? 'active' : ''} onClick={() => setActiveTab('process')}>PROCESS</button>
          </div>

          <div className="tab-content scrollable">
            {activeTab === 'vitals' && (
              <>
                {renderSlider("Age", "age", 18, 100, 1, " yrs")}
                {renderSlider("Systolic BP", "sys_blood_pressure", 80, 220, 1, " mmHg")}
                {renderSlider("Diastolic BP", "dis_blood_pressure", 40, 140, 1, " mmHg")}
                {renderSlider("Glucose", "glucose", 50, 400, 1, " mg/dL")}
                {renderSlider("Cholesterol", "cholesterol", 1, 15, 0.1, " mmol/L")}
              </>
            )}

            {activeTab === 'history' && (
              <div className="switch-container">
                {renderSwitch("Smoker", "risk_smoker")}
                {renderSwitch("Diabetes", "risk_diabetes")}
                {renderSwitch("Hypertension", "risk_hypertension")}
                {renderSwitch("Hyperlipidemia", "risk_hyperlipidemia")}
                {renderSwitch("Heart Failure", "risk_congestive_heart_failure")}
                {renderSwitch("CAD / MI", "risk_coronary_artery_disease_or_myocardial_infarction")}
                {renderSwitch("HIV", "risk_hiv")}
                {renderSwitch("Prev. Ischemic", "risk_previous_ischemic_stroke")}
                {renderSwitch("Prev. Hemorrhagic", "risk_previous_hemorrhagic_stroke")}
                {renderSwitch("Covid Test", "covid_test")}
                {renderSwitch("Hospital Stroke", "hospital_stroke")}
              </div>
            )}

            {activeTab === 'meds' && (
              <div className="meds-grid">
                <h4 className="sub-label">PRE-ONSET</h4>
                {renderSwitch("Antidiabetics", "before_onset_antidiabetics")}
                {renderSwitch("Warfarin", "before_onset_warfarin")}
                {renderSwitch("Clopidrogel", "before_onset_clopidrogel")}
                <h4 className="sub-label">DISCHARGE</h4>
                {renderSwitch("Heparin", "discharge_heparin")}
                {renderSwitch("Apixaban", "discharge_apixaban")}
                {renderSwitch("Rivaroxaban", "discharge_rivaroxaban")}
              </div>
            )}

            {activeTab === 'scores' && (
              <>
                {renderSlider("NIHSS Score", "nihss_score", 0, 42)}
                {renderSlider("Discharge NIHSS", "discharge_nihss_score", 0, 42)}
                {renderSlider("TICI Score", "tici_score", 0, 3)}
                {renderSlider("Perfusion Core", "perfusion_core", 0, 100, 1, " ml")}
                {renderSlider("Hypoperfusion Core", "hypoperfusion_core", 0, 100, 1, " ml")}
                {renderSlider("Pre-stroke mRS", "prestroke_mrs", 0, 5)}
              </>
            )}

            {activeTab === 'process' && (
              <>
                <div className="switch-container">
                  {renderSwitch("Imaging Done", "imaging_done")}
                  {renderSwitch("Physio < 3 Days", "physiotherapy_start_within_3days")}
                  {renderSwitch("Occupational Received", "occup_physiotherapy_received")}
                  {renderSwitch("Prenotification", "prenotification")}
                </div>
                <hr />
                {renderSlider("Door to Imaging", "door_to_imaging", 0, 120, 1, " min")}
                {renderSlider("Door to Needle", "door_to_needle", 0, 180, 1, " min")}
                {renderSlider("Onset to Door", "onset_to_door", 0, 480, 1, " min")}
              </>
            )}
          </div>
        </section>

        <section className="explanation-card">
          <h3 className="section-title">SHAP | IMPACT ANALYSIS</h3>
          <div className="scrollable-impacts">
            {inference.impacts.map((item, i) => {
              const isPos = item.value > 0;
              const isNeg = item.value < 0;
              const isNeutral = item.value === 0;
              return (
                <div key={i} className="bar-row">
                  <div className="bar-label">{item.feature}</div>
                  <div className="bar-track">
                    <div className="bar-fill pos" style={{ width: isPos ? `${Math.min(item.value * 15, 50)}%` : '0%', left: '50%', opacity: isPos ? 1 : 0 }}>
                      {item.value > 0.05 ? `+${item.value}` : ""}
                    </div>
                    <div className="bar-fill neg" style={{ width: isNeg ? `${Math.min(Math.abs(item.value) * 15, 50)}%` : '0%', right: '50%', opacity: isNeg ? 1 : 0 }}>
                      {item.value < -0.05 ? item.value : ""}
                    </div>
                    <div className="bar-neutral" style={{ opacity: isNeutral ? 1 : 0, transform: `translate(-50%, -50%) scale(${isNeutral ? 1 : 0.05})`, visibility: isNeutral ? 'visible' : 'hidden' }}>0</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="outcome-card">
          <div className="recovery-widget">
            <h3 className="section-title">mRS | PREDICTION</h3>
            <div className="circle-container">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" stroke={getMRSColor(displayScore)} strokeDasharray={`${visualPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="percentage">{displayScore}</div>
            </div>
            <div className="status-label">PREDICTED DISABILITY</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;