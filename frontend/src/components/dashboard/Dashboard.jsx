/*V1.3 - Dynamic Training + Grouped SHAP*/
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
const PRESETS_KEY = "dashboard-presets-v1";


const DEFAULT_LAYOUT = [
  { id: "c_1", contentId: "history", size: "size-normal" },
  { id: "c_2", contentId: "risk", size: "size-risk-score" },
  { id: "c_3", contentId: "tabs", size: "size-wide" },
  { id: "c_4", contentId: "interact", size: "size-wide" },
  { id: "c_5", contentId: "analysis", size: "size-wide" }
];

const availableModules = [
  { id: "history", label: "📋 Patient History", defaultSize: "size-normal" },
  { id: "analysis", label: "📊 SHAP Analysis", defaultSize: "size-wide" },
  { id: "interact", label: "🎛️ Variables", defaultSize: "size-wide" },
  { id: "risk", label: "🎯 Risk Score", defaultSize: "size-risk-score" },
  { id: "tabs", label: "🕹️ Variable Controls", defaultSize: "size-wide" },
];


const Dashboard = () => {
  const [patientData, setPatientData] = useState({
    nihss: 14,
    age: 72,
    glucose: 110,
    sys_bp: 160,
    dis_bp: 120,
    cholesterol: 180,
    prestroke_mrs: 3
  });

  const [thresholds, setThresholds] = useState({
    sys_bp: { low: 80, high: 220 },
    dis_bp: { low: 60, high: 110 },
    glucose: { low: 80, high: 180 },
    cholesterol: { low: 0, high: 70 },
  });

  const [mrsScore, setMrsScore] = useState(0);
  const [shapData, setShapData] = useState({ top: {}, other_sum: 0, all_others: {} });
  const [loading, setLoading] = useState(false);
  const [activeVariableCategory, setActiveVariableCategory] = useState("top");
  const [isLocked, setIsLocked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [presets, setPresets] = useState([]);

  // API Logic
  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    const payload = {
      age: patientData.age,
      nihss_score: patientData.nihss,
      prestroke_mrs: patientData.prestroke_mrs,
      sys_blood_pressure: patientData.sys_bp,
      dis_blood_pressure: patientData.dis_bp,
      glucose: patientData.glucose,
      cholesterol: patientData.cholesterol,
      thresholds: thresholds
    };


    try {
      const response = await fetch('http://127.0.0.1:8000/api/ml/predict_mrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMrsScore(data.mrs_score);
        // We set the whole object so AnalysisChart can handle the "Other" expansion
        setShapData(data.shap_values);
      }
    } catch (err) {
      console.error("❌ API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [patientData, thresholds]);

  useEffect(() => {
      const timer = setTimeout(fetchPrediction, 2000); // 2s Debounce for training
      return () => clearTimeout(timer);
  }, [thresholds, fetchPrediction]);

  // Component Mapping
  const COMPONENT_MAP = {
    history: () => <PatientHistory />,
    analysis: (size) => <AnalysisChart shapData={shapData} loading={loading} size={size} />,
    interact: (size) => (
      <InteractableVariables
        patientData={patientData}
        thresholds={thresholds}
        onChange={(newThresholds) => setThresholds(newThresholds)}
        activeCategory={activeVariableCategory}
        size={size}
      />
    ),
    risk: (size) => <RiskScore score={mrsScore} loading={loading} size={size} />,
    tabs: () => (
      <TabModule
        activeCategory={activeVariableCategory}
        onCategoryChange={setActiveVariableCategory}
      />
    ),
  };

  // --- DND Logic ---
  const [containers, setContainers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id && !isLocked) {
      setContainers((items) => arrayMove(items, items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id)));
    }
  };


  return (
    <div className={`app-layout ${!isSidebarOpen ? "sidebar-closed" : ""} ${isLocked ? "is-locked" : ""}`}>
      <main className="dashboard-wrapper">
        <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
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
                      isLocked={isLocked}
                      contentId={c.contentId}
                      size={c.size}
                      renderContent={() => COMPONENT_MAP[c.contentId] ? COMPONENT_MAP[c.contentId](c.size) : null}
                      onRemove={() => setContainers(containers.filter(p => p.id !== c.id))}
                      onDropModule={(mId) => {
                        const modDef = availableModules.find(m => m.id === mId);
                        setContainers(prev => prev.map(cont => cont.id === c.id ? { ...cont, contentId: mId, size: modDef?.defaultSize } : cont));
                      }}
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
          <h3>Library</h3>
          <div className="sidebar-list">
            {availableModules.map((mod) => (
              <div key={mod.id} className="sidebar-item" draggable={!isLocked} onDragStart={(e) => e.dataTransfer.setData("moduleId", mod.id)}>
                {mod.label}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;