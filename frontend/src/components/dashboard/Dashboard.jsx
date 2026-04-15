import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "motion/react";
import SortableModule from "./SortableModule";

// Module Imports
import PatientHistory from "../modules/PatientHistory";
import AnalysisChart from "../modules/AnalysisChart";
import InteractableVariables from "../modules/InteractableVariables";
import RiskScore from "../modules/RiskScore";

import "./Dashboard.css";

const MAX_MODULES = 6;

const availableModules = [
  { id: "history", label: "📋 Patient History", defaultSize: "size-normal" },
  { id: "analysis", label: "📊 SHAP Analysis", defaultSize: "size-wide" },
  { id: "interact", label: "🎛️ Variables", defaultSize: "size-wide" },
  { id: "risk", label: "🎯 Risk Score", defaultSize: "size-risk-score" },
];

const Dashboard = () => {
  // --- 1. STATE: Clinical & UI Mode ---
  const [patientData, setPatientData] = useState({
    nihss: 5,
    age: 65,
    glucose: 110,
    prestroke_mrs: 0,
    sys_bp: 140,
    dis_bp: 90,
    cholesterol: 200
  });

  const [isLocked, setIsLocked] = useState(false);
  const [mrsScore, setMrsScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- 2. STATE: Sidebar & Presets ---
  const [activeTab, setActiveTab] = useState("modules"); // 'modules' or 'presets'
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem("clinical-dashboard-presets");
    return saved ? JSON.parse(saved) : [];
  });

  // --- 3. LOGIC: Backend API Integration ---
  const fetchPrediction = useCallback(async (v) => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ml/predict_mrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: v.age,
          nihss_score: v.nihss,
          prestroke_mrs: v.prestroke_mrs,
          sys_blood_pressure: v.sys_bp,
          dis_blood_pressure: v.dis_bp,
          glucose: v.glucose,
          cholesterol: v.cholesterol
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMrsScore(data.mrs_score);
      }
    } catch (err) {
      console.error("❌ Backend Connection Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPrediction(patientData), 300);
    return () => clearTimeout(timer);
  }, [patientData, fetchPrediction]);

  // --- 4. LOGIC: SHAP Data ---
  const shapData = useMemo(() => {
    return [
      { name: "NIHSS Score", value: parseFloat((patientData.nihss * 0.05).toFixed(2)) },
      { name: "Age", value: parseFloat((patientData.age * 0.004).toFixed(2)) },
      { name: "Blood Glucose", value: parseFloat(((patientData.glucose - 100) * 0.001).toFixed(2)) },
      { name: "Prior Stroke", value: 0.15 },
    ];
  }, [patientData]);

  // --- 5. MAPPING: Components ---
  const COMPONENT_MAP = {
    history: (props) => <PatientHistory {...props} />,
    analysis: (props) => <AnalysisChart data={shapData} size={props.size} />,
    interact: (props) => <InteractableVariables values={patientData} onChange={setPatientData} size={props.size} />,
    risk: (props) => <RiskScore score={mrsScore} loading={loading} size={props.size} />,
  };

  // --- 6. STATE: Layout ---
  const [containers, setContainers] = useState(() => {
    const saved = localStorage.getItem("clinical-dashboard-layout-v2");
    return saved ? JSON.parse(saved) : [
      { id: "cont_1", contentId: "history", size: "size-wide" },
      { id: "cont_2", contentId: "analysis", size: "size-large" },
      { id: "cont_3", contentId: "interact", size: "size-normal" },
      { id: "cont_4", contentId: "risk", size: "size-normal" },
    ];
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [scale, setScale] = useState(1);
  const workspaceRef = useRef(null);
  const containerRef = useRef(null);

  // Save Layout & Presets
  useEffect(() => {
    localStorage.setItem("clinical-dashboard-layout-v2", JSON.stringify(containers));
  }, [containers]);

  useEffect(() => {
    localStorage.setItem("clinical-dashboard-presets", JSON.stringify(presets));
  }, [presets]);

  // --- 7. LOGIC: Presets ---
  const handleSavePreset = () => {
    const name = prompt("Enter a name for this layout preset (e.g., 'ICU Default'):");
    if (name) {
      setPresets([...presets, { id: Date.now(), name, layout: [...containers] }]);
    }
  };

  const handleLoadPreset = (layout) => {
    setContainers(layout);
  };

  const handleDeletePreset = (id) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  // --- 8. LOGIC: Auto-Scaling ---
  const handleResize = useCallback(() => {
    if (!workspaceRef.current || !containerRef.current) return;
    const originalTransform = workspaceRef.current.style.transform;
    workspaceRef.current.style.transform = "none";
    const contentHeight = workspaceRef.current.scrollHeight;
    workspaceRef.current.style.transform = originalTransform;

    // Buffer based strictly on sidebar open state, regardless of lock
    const paddingBuffer = isSidebarOpen ? 200 : 100;
    const availableHeight = containerRef.current.offsetHeight - paddingBuffer;

    if (contentHeight > availableHeight) {
      setScale(Math.max(Math.min((availableHeight / contentHeight) * 0.95, 1), 0.3));
    } else {
      setScale(1);
    }
  }, [isSidebarOpen]);

  useLayoutEffect(() => {
    handleResize();
    const timer = setTimeout(handleResize, 510);
    return () => clearTimeout(timer);
  }, [containers, isSidebarOpen, handleResize]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // --- 9. LOGIC: Interactions ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    if (isLocked) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setContainers((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addContainer = () => {
    if (containers.length >= MAX_MODULES || isLocked) return;
    setContainers([...containers, { id: `c_${Date.now()}`, contentId: null, size: "size-normal" }]);
  };

  const removeContainer = (id) => {
    if (isLocked) return;
    setContainers(containers.filter((c) => c.id !== id));
  };

  const handleModuleDrop = (cId, mId) => {
    if (isLocked) return;
    const modDef = availableModules.find(m => m.id === mId);
    setContainers(containers.map((c) =>
      (c.id === cId ? { ...c, contentId: mId, size: modDef?.defaultSize || "size-normal" } : c)
    ));
  };

  return (
    <div className={`app-layout ${!isSidebarOpen ? "sidebar-closed" : ""} ${isLocked ? "is-locked" : ""}`}>

      {/* Sidebar Toggle: Always visible now */}
      <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? "›" : "‹"}
      </button>

      <main className="dashboard-wrapper" ref={containerRef}>
        <div className="header-area">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <h1>xAI <span>MED8</span></h1>
            <button
              className={`lock-toggle-btn ${isLocked ? 'active' : ''}`}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? "🔓 Unlock Layout" : "🔒 Lock Dashboard"}
            </button>
          </div>

          {!isLocked && (
            <button
              className={`add-container-btn ${containers.length >= MAX_MODULES ? 'disabled' : ''}`}
              onClick={addContainer}
            >
              +
            </button>
          )}
        </div>

        <div
          className="workspace-scaler"
          ref={workspaceRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: "100%",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform"
          }}
        >
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="ios-grid-container">
              <SortableContext items={containers.map((c) => c.id)} strategy={rectSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  {containers.map((c) => (
                    <SortableModule
                      key={c.id}
                      id={c.id}
                      isLocked={isLocked}
                      contentId={c.contentId}
                      size={c.size}
                      renderContent={() => COMPONENT_MAP[c.contentId] ? COMPONENT_MAP[c.contentId]({ size: c.size }) : null}
                      onRemove={() => removeContainer(c.id)}
                      onDropModule={(mId) => handleModuleDrop(c.id, mId)}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </main>

      <aside className="module-sidebar">
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            Modules
          </button>
          <button
            className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Presets
          </button>
        </div>

        <div className="sidebar-content">
          {activeTab === 'modules' && (
            <div className="tab-pane">
              <h3>Tool Library</h3>
              <p className="sidebar-sub">
                {isLocked ? "Unlock dashboard to drag modules." : "Drag and drop into workspace"}
              </p>
              <div className="sidebar-list">
                {availableModules.map((mod) => (
                  <div
                    key={mod.id}
                    className={`sidebar-item ${isLocked ? 'disabled' : ''}`}
                    draggable={!isLocked}
                    onDragStart={(e) => {
                      if (!isLocked) e.dataTransfer.setData("moduleId", mod.id);
                    }}
                  >
                    {mod.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="tab-pane">
              <h3>Saved Layouts</h3>
              <p className="sidebar-sub">Quickly switch views</p>

              {!isLocked && (
                <button className="save-preset-btn" onClick={handleSavePreset}>
                  + Save Current Layout
                </button>
              )}

              <div className="sidebar-list">
                {presets.length === 0 ? (
                  <p className="empty-presets">No presets saved yet.</p>
                ) : (
                  presets.map((preset) => (
                    <div key={preset.id} className="preset-item">
                      <button
                        className="preset-load-btn"
                        onClick={() => handleLoadPreset(preset.layout)}
                      >
                        {preset.name}
                      </button>
                      <button
                        className="preset-delete-btn"
                        onClick={() => handleDeletePreset(preset.id)}
                        title="Delete Preset"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;