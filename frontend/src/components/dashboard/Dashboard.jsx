import React, { useState, useEffect, useCallback } from "react";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "motion/react";

import SortableModule from "./SortableModule";
import PatientHistory from "../modules/PatientHistory";
import AnalysisChart from "../modules/AnalysisChart";
import InteractableVariables from "../modules/InteractableVariables";
import RiskScore from "../modules/RiskScore";
import TabModule from "../modules/TabModule";

import "./Dashboard.css";

const STORAGE_KEY = "clinical-dashboard-layout-v3";

const DEFAULT_LAYOUT = [
  { id: "c_1", contentId: "history",  size: "size-normal" },
  { id: "c_2", contentId: "risk",     size: "size-risk-score" },
  { id: "c_3", contentId: "tabs",     size: "size-wide" },
  { id: "c_4", contentId: "interact", size: "size-wide" },
  { id: "c_5", contentId: "analysis", size: "size-wide" },
];

const availableModules = [
  { id: "history",  label: "📋 Patient History",   defaultSize: "size-normal" },
  { id: "analysis", label: "📊 SHAP Analysis",      defaultSize: "size-wide" },
  { id: "interact", label: "🎛️ Variables",          defaultSize: "size-wide" },
  { id: "risk",     label: "🎯 Risk Score",         defaultSize: "size-risk-score" },
  { id: "tabs",     label: "🕹️ Variable Controls", defaultSize: "size-wide" },
];

/* ─────────────────────────────────────────────────────────────
   PATIENT REGISTRY
   Only display info + the 7 slider-controlled model fields.
   All other features are loaded from the backend on selection.
   ───────────────────────────────────────────────────────────── */
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
    model: {
      nihss: 18, age: 63, glucose: 173,
      sys_bp: 154, dis_bp: 100, cholesterol: 88, prestroke_mrs: 2,
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
      nihss: 12, age: 71, glucose: 140,
      sys_bp: 178, dis_bp: 95, cholesterol: 112, prestroke_mrs: 1,
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
      nihss: 7, age: 58, glucose: 210,
      sys_bp: 135, dis_bp: 82, cholesterol: 145, prestroke_mrs: 0,
    },
  },
};

const Dashboard = () => {
  const [selectedPatientId,      setSelectedPatientId]      = useState(null);
  const [fullPatientRecord,      setFullPatientRecord]      = useState({});
  const [patientData,            setPatientData]            = useState({});
  const [thresholds, setThresholds] = useState({
    nihss:       { low: 0,   high: 8 },   // Added default for NIHSS
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

  const IS_LOCKED = true;

  /* ── Load full patient record from backend ── */
  const handleSelectPatient = useCallback(async (id) => {
    setSelectedPatientId(id);
    setPatientData(PATIENTS_DISPLAY[id].model);
    setFullPatientRecord({});

    try {
      const res  = await fetch(`http://127.0.0.1:8000/api/ml/patient/${id}`);
      const json = await res.json();
      if (json.status === "success") {
        setFullPatientRecord(json.patient);
      } else {
        console.warn("Patient fetch returned error:", json);
      }
    } catch (err) {
      console.error("Failed to load full patient record:", err);
    }
  }, []);

  /* ── Load first patient on mount ── */
  useEffect(() => {
    handleSelectPatient("171223");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleThresholdsChange = useCallback((updaterOrValue) => {
    setThresholds(prev =>
      typeof updaterOrValue === "function"
        ? updaterOrValue(prev)
        : updaterOrValue
    );
  }, []);

  /* ── Prediction call ── */
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
      const response = await fetch("http://127.0.0.1:8000/api/ml/debug/predict_verbose", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.status === "success") {
        setMrsScore(data.mrs_score);
        setShapData(data.shap_values);
      } else {
        console.error("API error:", data.message);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [patientData, thresholds, fullPatientRecord, selectedPatientId]);

  /* ── Debounced auto-predict ── */
  useEffect(() => {
    if (!selectedPatientId) return;
    const timer = setTimeout(fetchPrediction, 2000);
    return () => clearTimeout(timer);
  }, [fetchPrediction, selectedPatientId]);

  /* ── Module render map ── */
  const selectedPatient = selectedPatientId ? PATIENTS_DISPLAY[selectedPatientId] : null;

  const COMPONENT_MAP = {
    history:  ()     => <PatientHistory rows={selectedPatient?.info ?? []} />,
    analysis: (size) => <AnalysisChart shapData={shapData} loading={loading} size={size} />,
    interact: (size) => (
      <InteractableVariables
        patientData={patientData}
        thresholds={thresholds}
        onChange={handleThresholdsChange}
        activeCategory={activeVariableCategory}
        size={size}
      />
    ),
    risk: (size) => (
      <RiskScore
        score={mrsScore}
        loading={loading}
        size={size}
        patientData={patientData}
        thresholds={thresholds}
        shapData={shapData}
      />
    ),
    tabs: () => (
      <TabModule
        activeCategory={activeVariableCategory}
        onCategoryChange={setActiveVariableCategory}
      />
    ),
  };

  const [containers, setContainers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id && !IS_LOCKED) {
      setContainers((items) => arrayMove(
        items,
        items.findIndex(i => i.id === active.id),
        items.findIndex(i => i.id === over.id),
      ));
    }
  };

  return (
    <div className={`app-layout is-locked ${!isSidebarOpen ? "sidebar-closed" : ""}`}>
      <main className="dashboard-wrapper">
        <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(o => !o)}>
          {isSidebarOpen ? "›" : "‹"}
        </button>

        <div className="workspace-scaler">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="ios-grid-container">
              <SortableContext items={containers.map(c => c.id)} strategy={rectSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  {containers.map((c) => (
                    <SortableModule
                      key={c.id}
                      id={c.id}
                      isLocked={IS_LOCKED}
                      contentId={c.contentId}
                      size={c.size}
                      renderContent={() => COMPONENT_MAP[c.contentId] ? COMPONENT_MAP[c.contentId](c.size) : null}
                      onRemove={() => {}}
                      onDropModule={() => {}}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </main>

      <aside className="module-sidebar">
        <div className="sidebar-content">
          <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Patients</h3>
          <p className="sidebar-sub">Select a patient to load their data.</p>

          {Object.entries(PATIENTS_DISPLAY).map(([id, p]) => {
            const infoAge    = p.info.find(r => r.label === "Age")?.value    ?? "—";
            const infoGender = p.info.find(r => r.label === "Gender")?.value ?? "—";
            const isSelected = id === selectedPatientId;

            return (
              <div
                key={id}
                className="sidebar-item"
                onClick={() => handleSelectPatient(id)}
                style={{
                  cursor:      "pointer",
                  background:  isSelected ? "#e8f2ff" : "white",
                  borderColor: isSelected ? "#007aff" : "rgba(0,0,0,0.05)",
                  borderWidth:  1,
                  borderStyle: "solid",
                  transition:  "all 0.15s ease",
                }}
              >
                <span style={{ fontWeight: 800, color: isSelected ? "#007aff" : "#1c1c1e" }}>
                  #{id}
                </span>
                <span style={{ fontWeight: 500, color: "#8e8e93", marginLeft: 8 }}>
                  {infoGender}, {infoAge}
                </span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;