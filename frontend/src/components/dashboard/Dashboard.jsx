/*V1*/
import React, { useState, useMemo, useEffect } from "react";
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

const MAX_MODULES = 8;
const STORAGE_KEY = "clinical-dashboard-layout-v3";
const PRESETS_KEY = "dashboard-presets-v1";

// STEP 2 PREP: This is your "Master Layout".
// Anyone who loads the project for the first time will see this.
const DEFAULT_LAYOUT = [
  { id: "c_1776167311497", contentId: "history", size: "size-normal" },
  { id: "c_1776165859467", contentId: "risk", size: "size-risk-score" },
  { id: "c_1776252291422", contentId: "tabs", size: "size-wide" },
  { id: "c_1776252294573", contentId: "tabs", size: "size-wide" },
  { id: "c_1776252297659", contentId: "interact", size: "size-wide" },
  { id: "c_1776252303382", contentId: "analysis", size: "size-wide" }
];

const availableModules = [
  { id: "history", label: "📋 Patient History", defaultSize: "size-normal" },
  { id: "analysis", label: "📊 SHAP Analysis", defaultSize: "size-wide" },
  { id: "interact", label: "🎛️ Variables", defaultSize: "size-wide" },
  { id: "risk", label: "🎯 Risk Score", defaultSize: "size-risk-score" },
  { id: "tabs", label: "🕹️ Variable Controls", defaultSize: "size-wide" },
];

const Dashboard = () => {
  const [patientData] = useState({
  nihss: 5,
  age: 65,
  glucose: 110,
  sys_bp: 140,
  cholesterol: 200
});

  const [thresholds, setThresholds] = useState({
  sys_bp: { low: 80, high: 220 },
  glucose: { low: 80, high: 180 },
  cholesterol: { low: 60, high: 100 },
  nihss: { low: 0, high: 4 }
});

  const [activeVariableCategory, setActiveVariableCategory] = useState("top");
  const [isLocked, setIsLocked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [presets, setPresets] = useState([]);

  // Derive SHAP data
  const shapData = useMemo(() => [
    { name: "NIHSS Score", value: parseFloat((patientData.nihss * 0.05).toFixed(2)) },
    { name: "Age", value: parseFloat((patientData.age * 0.004).toFixed(2)) },
    { name: "Blood Glucose", value: parseFloat(((patientData.glucose - 100) * 0.001).toFixed(2)) },
    { name: "Prior Stroke", value: 0.15 },
  ], [patientData]);

  // Initial State from LocalStorage or Default
  const [containers, setContainers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : DEFAULT_LAYOUT;
      } catch (e) {
        return DEFAULT_LAYOUT;
      }
    }
    return DEFAULT_LAYOUT;
  });

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedPresets = localStorage.getItem(PRESETS_KEY);
    if (savedPresets) setPresets(JSON.parse(savedPresets));
  }, []);

  // AUTO-SAVE logic
  useEffect(() => {
    if (containers && containers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(containers));
    }
  }, [containers]);

  // COMPONENT MAP - defined inside to access shapData and patientData
  const COMPONENT_MAP = {
  history: () => <PatientHistory />,
  analysis: (size) => <AnalysisChart data={shapData} size={size} />,
  interact: (size) => (
    <InteractableVariables
      patientData={patientData}     // Static patient facts
      thresholds={thresholds}       // Adjustable boundaries
      onChange={setThresholds}      // Slider updates the limit
      activeCategory={activeVariableCategory}
      size={size}
    />
  ),
  risk: (size) => <RiskScore score={0.24} size={size} />,
  tabs: () => (
    <TabModule
      activeCategory={activeVariableCategory}
      onCategoryChange={setActiveVariableCategory}
    />
  ),
};

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addContainer = () => {
    if (containers.length < MAX_MODULES) {
      setContainers([...containers, { id: `c_${Date.now()}`, contentId: null, size: "size-normal" }]);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id && !isLocked) {
      setContainers((items) => arrayMove(items, items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id)));
    }
  };

  return (
    <div className={`app-layout ${!isSidebarOpen ? "sidebar-closed" : ""} ${isLocked ? "is-locked" : ""}`}>
      <main className="dashboard-wrapper">
        <div className="header-area">
          <div className="header-left">
            <h1>xAI <span>MED8</span></h1>
            <button className={`lock-toggle-btn ${isLocked ? 'active' : ''}`} onClick={() => setIsLocked(!isLocked)}>
              {isLocked ? "🔓 Unlock" : "🔒 Lock"}
            </button>
          </div>
          {!isLocked && <button className="add-container-btn" onClick={addContainer}>+</button>}
        </div>

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
          <hr style={{ margin: '20px 0', border: '0.5px solid #eee' }} />
          <h3>Presets</h3>
          <button className="save-preset-btn" onClick={() => {
             const name = prompt("Name:");
             if(name) {
               const newP = [...presets, { id: Date.now(), name, layout: [...containers] }];
               setPresets(newP);
               localStorage.setItem(PRESETS_KEY, JSON.stringify(newP));
             }
          }}>💾 Save Layout</button>
          <div className="presets-list">
            {presets.map(p => (
              <div key={p.id} className="preset-item">
                <button className="preset-load-btn" onClick={() => setContainers(p.layout)}>{p.name}</button>
                <button className="preset-delete-btn" onClick={() => {
                  const up = presets.filter(pr => pr.id !== p.id);
                  setPresets(up);
                  localStorage.setItem(PRESETS_KEY, JSON.stringify(up));
                }}>×</button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;