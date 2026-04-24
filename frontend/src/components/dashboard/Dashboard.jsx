import React, { useState, useEffect, useCallback } from "react";
import PatientHistory from "../modules/PatientHistory";
import AnalysisChart from "../modules/AnalysisChart";
import InteractableVariables from "../modules/InteractableVariables";
import RiskScore from "../modules/RiskScore";
import TabModule from "../modules/TabModule";
import "./Dashboard.css";

// ── Static display data for the 3 demo patients ───────────────────────────
const PATIENTS_DISPLAY = {
  "171223": {
    info: [
      { label: "Patient ID",               value: "#171223" },
      { label: "Age",                      value: "63" },
      { label: "Gender",                   value: "Male" },
      { label: "Covid positive",           value: "Yes" },
      { label: "Chronic diseases",         value: "Diabetes, Hyperlipidemia, Hypertension" },
      { label: "Medicine before onset",    value: "Clopidogrel" },
      { label: "Stroke mimics",            value: "Yes" },
      { label: "In-hospital stroke",       value: "No" },
      { label: "Source of bleeding found", value: "Yes" },
      { label: "Previous IS/TIA",          value: "Yes" },
      { label: "Previous ICH",             value: "Yes" },
      { label: "NIHSS",                    value: "18" },
      { label: "TICI score",               value: "Grade 3" },
      { label: "mRS 2–5",                  value: "Yes" },
    ],
    // CSV variable name → value  (keys match the debug/patient-vars output exactly)
    model: {
      age:             63,
      nihss_score:     18,
      prestroke_mrs:   2,
      sys_bp:          154, // Changed from sys_blood_pressure
      dis_bp:          100, // Changed from dis_blood_pressure
      glucose:         173,   // stored in mmol in CSV, converted in backend
      cholesterol:     88,    // same
      // risk factors
      risk_hypertension:         1,
      risk_diabetes:             1,
      risk_hyperlipidemia:       1,
      risk_smoker:               0,
      risk_previous_ischemic_stroke:    1,
      risk_previous_hemorrhagic_stroke: 1,
      risk_congestive_heart_failure:    0,
      risk_coronary_artery_disease_or_myocardial_infarction: 0,
      risk_hiv:                  0,
      // before onset meds
      anti_diabetics:  0,
      cilostazol:     0,
      clopidrogel:    1,   // note: typo in CSV is intentional
      ticagrelor:     0,
      ticlopidine:    0,
      prasugrel:      0,
      dipyridamol:    0,
      warfarin:       0,
      // discharge meds
      discharge_antidiabetics:   0,
      discharge_cilostazol:      0,
      discharge_clopidrogel:     0,
      discharge_ticagrelor:      0,
      discharge_ticlopidine:     0,
      discharge_prasugrel:       0,
      discharge_dipyridamol:     0,
      discharge_warfarin:        0,
      discharge_dabigatran:      0,
      discharge_rivaroxaban:     0,
      discharge_apixaban:        0,
      discharge_edoxaban:        0,
      discharge_heparin:         0,
      // other
      hospital_stroke:                    0,
      thrombolysis:                       0,
      physiotherapy_start_within_3days:   1,
      covid_test:                         1,
      stroke_mimics_diagnosis:            1,
    },
  },
  "204401": {
    info: [
      { label: "Patient ID",               value: "#204401" },
      { label: "Age",                      value: "71" },
      { label: "Gender",                   value: "Female" },
      { label: "Covid positive",           value: "No" },
      { label: "Chronic diseases",         value: "Hypertension, Atrial Fibrillation" },
      { label: "Medicine before onset",    value: "Warfarin, Lisinopril" },
      { label: "Stroke mimics",            value: "No" },
      { label: "In-hospital stroke",       value: "No" },
      { label: "Source of bleeding found", value: "No" },
      { label: "Previous IS/TIA",          value: "No" },
      { label: "Previous ICH",             value: "No" },
      { label: "NIHSS",                    value: "12" },
      { label: "TICI score",               value: "Grade 2b" },
      { label: "mRS 2–5",                  value: "Yes" },
    ],
    model: {
      age:             71,
      nihss_score:     12,
      prestroke_mrs:   1,
      sys_bp: 178,
      dis_bp: 95,
      glucose:         140,
      cholesterol:     112,
      risk_hypertension:         1,
      risk_diabetes:             0,
      risk_hyperlipidemia:       0,
      risk_smoker:               0,
      risk_previous_ischemic_stroke:    0,
      risk_previous_hemorrhagic_stroke: 0,
      risk_congestive_heart_failure:    0,
      risk_coronary_artery_disease_or_myocardial_infarction: 0,
      risk_hiv:                  0,
      before_onset_antidiabetics:  0,
      before_onset_cilostazol:     0,
      before_onset_clopidrogel:    0,
      before_onset_ticagrelor:     0,
      before_onset_ticlopidine:    0,
      before_onset_prasugrel:      0,
      before_onset_dipyridamol:    0,
      before_onset_warfarin:       1,
      discharge_antidiabetics:   0,
      discharge_cilostazol:      0,
      discharge_clopidrogel:     0,
      discharge_ticagrelor:      0,
      discharge_ticlopidine:     0,
      discharge_prasugrel:       0,
      discharge_dipyridamol:     0,
      discharge_warfarin:        1,
      discharge_dabigatran:      0,
      discharge_rivaroxaban:     0,
      discharge_apixaban:        0,
      discharge_edoxaban:        0,
      discharge_heparin:         0,
      hospital_stroke:                   0,
      thrombolysis:                      0,
      physiotherapy_start_within_3days:  1,
      covid_test:                        0,
      stroke_mimics_diagnosis:           0,
    },
  },
  "198832": {
    info: [
      { label: "Patient ID",               value: "#198832" },
      { label: "Age",                      value: "58" },
      { label: "Gender",                   value: "Male" },
      { label: "Covid positive",           value: "No" },
      { label: "Chronic diseases",         value: "Type 2 Diabetes" },
      { label: "Medicine before onset",    value: "Metformin" },
      { label: "Stroke mimics",            value: "No" },
      { label: "In-hospital stroke",       value: "Yes" },
      { label: "Source of bleeding found", value: "Yes" },
      { label: "Previous IS/TIA",          value: "No" },
      { label: "Previous ICH",             value: "No" },
      { label: "NIHSS",                    value: "7" },
      { label: "TICI score",               value: "Grade 3" },
      { label: "mRS 2–5",                  value: "No" },
    ],
    model: {
      age:             58,
      nihss_score:     7,
      prestroke_mrs:   0,
      sys_bp: 135,
      dis_bp: 82,
      glucose:         210,
      cholesterol:     145,
      risk_hypertension:         0,
      risk_diabetes:             1,
      risk_hyperlipidemia:       0,
      risk_smoker:               0,
      risk_previous_ischemic_stroke:    0,
      risk_previous_hemorrhagic_stroke: 0,
      risk_congestive_heart_failure:    0,
      risk_coronary_artery_disease_or_myocardial_infarction: 0,
      risk_hiv:                  0,
      before_onset_antidiabetics:  1,
      before_onset_cilostazol:     0,
      before_onset_clopidrogel:    0,
      before_onset_ticagrelor:     0,
      before_onset_ticlopidine:    0,
      before_onset_prasugrel:      0,
      before_onset_dipyridamol:    0,
      before_onset_warfarin:       0,
      discharge_antidiabetics:   1,
      discharge_cilostazol:      0,
      discharge_clopidrogel:     0,
      discharge_ticagrelor:      0,
      discharge_ticlopidine:     0,
      discharge_prasugrel:       0,
      discharge_dipyridamol:     0,
      discharge_warfarin:        0,
      discharge_dabigatran:      0,
      discharge_rivaroxaban:     0,
      discharge_apixaban:        0,
      discharge_edoxaban:        0,
      discharge_heparin:         0,
      hospital_stroke:                   1,
      thrombolysis:                      0,
      physiotherapy_start_within_3days:  1,
      covid_test:                        0,
      stroke_mimics_diagnosis:           0,
    },
  },
};

// ── Maps UI control keys → CSV variable names ─────────────────────────────
const UI_TO_CSV = {
  // Sliders (handled separately as binned values — listed here for completeness)
  sys_bp:        "sys_blood_pressure",
  dis_bp:        "dis_blood_pressure",
  glucose:       "glucose",
  cholesterol:   "cholesterol",
  // Metrics tab
  ich_score:     "ich_score",
  hunt_hess:     "hunt_hess_score",
  ivt_count:     "thrombolysis",
  // Before onset meds
  anti_diabetics: "before_onset_antidiabetics",
  cilostazol:    "before_onset_cilostazol",
  clopidogrel:   "before_onset_clopidrogel",   // typo in CSV is intentional
  ticagrelor:    "before_onset_ticagrelor",
  ticlopidine:   "before_onset_ticlopidine",
  prasugrel:     "before_onset_prasugrel",
  dipyridamol:   "before_onset_dipyridamol",
  warfarin:      "before_onset_warfarin",
  // Discharge meds (keyed with dc_ prefix to avoid collision)
  dc_antidiabetics: "discharge_antidiabetics",
  dc_cilostazol:    "discharge_cilostazol",
  dc_clopidogrel:   "discharge_clopidrogel",
  dc_ticagrelor:    "discharge_ticagrelor",
  dc_ticlopidine:   "discharge_ticlopidine",
  dc_prasugrel:     "discharge_prasugrel",
  dc_dipyridamol:   "discharge_dipyridamol",
  dc_warfarin:      "discharge_warfarin",
  dc_dabigatran:    "discharge_dabigatran",
  dc_rivoroxaban:   "discharge_rivaroxaban",
  dc_apixaban:      "discharge_apixaban",
  dc_edoxaban:      "discharge_edoxaban",
  dc_heparin:       "discharge_heparin",
  // Other tab
  active_smoker: "risk_smoker",
  physio_72h:    "physiotherapy_start_within_3days",
  // Non-actionable
  age:           "age",
  nihss:         "nihss_score",
  prestroke_mrs: "prestroke_mrs",
  covid_positive: "covid_test",
  stroke_mimics:  "stroke_mimics_diagnosis",
  in_hospital:    "hospital_stroke",
};

// Convert a Yes/No or numeric UI value to 0/1 float for the model
const toModelVal = (v) => {
  if (v === "Yes") return 1;
  if (v === "No")  return 0;
  if (v == null)   return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

const Dashboard = () => {
  const [selectedPatientId,      setSelectedPatientId]      = useState(null);
  const [patientData,            setPatientData]            = useState({});
  const [thresholds,             setThresholds]             = useState({
    sys_bp:      { low: 130, high: 160 },
    dis_bp:      { low: 60,  high: 110 },
    glucose:     { low: 80,  high: 180 },
    cholesterol: { low: 0,   high: 70  },
  });
  const [mrsScore,               setMrsScore]               = useState(0);
  const [shapData,               setShapData]               = useState({ top: {}, other_sum: 0, all_others: {} });
  const [loading,                setLoading]                = useState(false);
  const [activeVariableCategory, setActiveVariableCategory] = useState("top");
  const [isSidebarOpen,          setIsSidebarOpen]          = useState(true);

  const handleSelectPatient = useCallback((id) => {
    setSelectedPatientId(id);
    setPatientData(PATIENTS_DISPLAY[id].model);
  }, []);

  useEffect(() => { handleSelectPatient("171223"); }, []); // eslint-disable-line

  const handleThresholdsChange = useCallback((updaterOrValue) => {
    setThresholds(prev =>
      typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue
    );
  }, []);

  const fetchPrediction = useCallback(async () => {
    if (!selectedPatientId) return;
    setLoading(true);

    // Build extra_features: all non-slider patient values mapped to CSV keys
    const extra = {};
    Object.entries(patientData).forEach(([uiKey, uiVal]) => {
  // Skip the 4 slider keys
  if (["sys_bp", "dis_bp", "glucose", "cholesterol"].includes(uiKey)) return;

  // FIX: If it's in the map, translate it. Otherwise, keep the key as-is!
  const csvKey = UI_TO_CSV[uiKey] || uiKey;

  if (csvKey) {
    const v = toModelVal(uiVal);
    if (v !== null) extra[csvKey] = v;
  }
});

    const payload = {
      age:                patientData.age          ?? 0,
      nihss_score:        patientData.nihss_score  ?? patientData.nihss ?? 0,
      prestroke_mrs:      patientData.prestroke_mrs ?? 0,
      sys_blood_pressure: patientData.sys_blood_pressure ?? patientData.sys_bp ?? 0,
      dis_blood_pressure: patientData.dis_blood_pressure ?? patientData.dis_bp ?? 0,
      glucose:            patientData.glucose      ?? 0,
      cholesterol:        patientData.cholesterol  ?? 0,
      thresholds,
      extra_features: extra,
    };

    try {
      const res  = await fetch("http://127.0.0.1:8000/api/ml/predict_mrs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        setMrsScore(data.mrs_score);
        setShapData(data.shap_values);
      } else {
        console.error("Prediction error:", data.detail ?? data);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [patientData, thresholds, selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) return;
    const t = setTimeout(fetchPrediction, 800);
    return () => clearTimeout(t);
  }, [fetchPrediction, selectedPatientId]);

  const selectedPatient = selectedPatientId ? PATIENTS_DISPLAY[selectedPatientId] : null;

  return (
    <div className={`app-layout ${!isSidebarOpen ? "sidebar-closed" : ""}`}>

      <main className="dashboard-wrapper">

        <div className="header-section">
          <div className="header-left-col">
            <div className="info-card">
              <PatientHistory rows={selectedPatient?.info ?? []} />
            </div>
            <div className="tab-row-container">
              <div className="tab-strip">
                <TabModule
                  activeCategory={activeVariableCategory}
                  onCategoryChange={setActiveVariableCategory}
                />
              </div>
              <div className="changeable-box">
                Changeable, not actionable
                <span style={{ marginLeft: "8px", fontWeight: "900" }}>⌄</span>
              </div>
            </div>
          </div>

          <div className="mrs-card loading-container">
            {loading && (
              <div className="loading-overlay">
                <div className="spinner" />
              </div>
            )}
            <RiskScore score={mrsScore} />
          </div>
        </div>

        <div className="content-row">
          <div className="panel-left">
            <InteractableVariables
              patientData={patientData}
              thresholds={thresholds}
              onChange={handleThresholdsChange}
              activeCategory={activeVariableCategory}
            />
          </div>
          <div className="panel-right">
            <AnalysisChart shapData={shapData} loading={loading} />
          </div>
        </div>

      </main>

      <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(o => !o)}>
        {isSidebarOpen ? "›" : "‹"}
      </button>

      <aside className="module-sidebar">
        <div className="sidebar-content">
          <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Patients</h3>
          <p className="sidebar-sub">Select a patient to load their data.</p>
          {Object.entries(PATIENTS_DISPLAY).map(([id, p]) => {
            const age    = p.info.find(r => r.label === "Age")?.value    ?? "—";
            const gender = p.info.find(r => r.label === "Gender")?.value ?? "—";
            const sel    = id === selectedPatientId;
            return (
              <div
                key={id}
                className="sidebar-item"
                onClick={() => handleSelectPatient(id)}
                style={{
                  background:  sel ? "#e8f2ff" : "white",
                  borderColor: sel ? "#007aff" : "rgba(0,0,0,0.06)",
                  borderWidth: 1, borderStyle: "solid",
                }}
              >
                <span style={{ fontWeight: 800, color: sel ? "#007aff" : "#1c1c1e" }}>#{id}</span>
                <span style={{ fontWeight: 500, color: "#8e8e93", marginLeft: 6 }}>{gender}, {age}</span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;