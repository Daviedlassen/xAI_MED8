import React, { useState, useEffect, useCallback } from "react";
import PatientHistory from "../modules/PatientHistory";
import AnalysisChart from "../modules/AnalysisChart";
import InteractableVariables from "../modules/InteractableVariables";
import RiskScore from "../modules/RiskScore";
import TabModule from "../modules/TabModule";
import "./Dashboard.css";

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
    model: { nihss: 18, age: 63, glucose: 173, sys_bp: 154, dis_bp: 100, cholesterol: 88, prestroke_mrs: 2 },
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
    model: { nihss: 12, age: 71, glucose: 140, sys_bp: 178, dis_bp: 95, cholesterol: 112, prestroke_mrs: 1 },
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
    model: { nihss: 7, age: 58, glucose: 210, sys_bp: 135, dis_bp: 82, cholesterol: 145, prestroke_mrs: 0 },
  },
};

const Dashboard = () => {
  const [selectedPatientId,      setSelectedPatientId]      = useState(null);
  const [fullPatientRecord,      setFullPatientRecord]      = useState({});
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

  const handleSelectPatient = useCallback(async (id) => {
    setSelectedPatientId(id);
    setPatientData(PATIENTS_DISPLAY[id].model);
    setFullPatientRecord({});
    try {
      const res  = await fetch(`http://127.0.0.1:8000/api/ml/patient/${id}`);
      const json = await res.json();
      if (json.status === "success") setFullPatientRecord(json.patient);
    } catch (err) {
      console.error("Failed to load full patient record:", err);
    }
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
    const payload = {
      age:                patientData.age,
      nihss_score:        patientData.nihss,
      prestroke_mrs:      patientData.prestroke_mrs,
      sys_blood_pressure: patientData.sys_bp,
      dis_blood_pressure: patientData.dis_bp,
      glucose:            patientData.glucose,
      cholesterol:        patientData.cholesterol,
      thresholds,
      extra_features:     fullPatientRecord,
    };
    try {
      const res  = await fetch("http://127.0.0.1:8000/api/ml/predict_mrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        setMrsScore(data.mrs_score);
        setShapData(data.shap_values);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [patientData, thresholds, fullPatientRecord, selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) return;
    const t = setTimeout(fetchPrediction, 2000);
    return () => clearTimeout(t);
  }, [fetchPrediction, selectedPatientId]);

  const selectedPatient = selectedPatientId ? PATIENTS_DISPLAY[selectedPatientId] : null;

  return (
    <div className={`app-layout ${!isSidebarOpen ? "sidebar-closed" : ""}`}>

      {/* ── MAIN CONTENT ── */}
      <main className="dashboard-wrapper">

        {/* ROW 1: patient info + mRS */}
        <div className="row-top">
          <div className="panel-history">
            <PatientHistory rows={selectedPatient?.info ?? []} />
          </div>
          <div className="panel-mrs loading-container">
            <RiskScore
              score={mrsScore}
              loading={loading}
              patientData={patientData}
              thresholds={thresholds}
              shapData={shapData}
            />
          </div>
        </div>

        {/* ROW 2: single shared tab bar */}
        <div className="row-tabs">
          <TabModule
            activeCategory={activeVariableCategory}
            onCategoryChange={setActiveVariableCategory}
          />
        </div>

        {/* ROW 3: variables + SHAP side by side */}
        <div className="row-main">
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

      {/* ── SIDEBAR ── */}
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