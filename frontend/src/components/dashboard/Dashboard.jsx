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
  { id: "history", label: "📋 Patient History", defaultSize: "size-wide" },
  { id: "analysis", label: "📊 SHAP Analysis", defaultSize: "size-large" },
  { id: "interact", label: "🎛️ Variables", defaultSize: "size-normal" },
  { id: "risk", label: "🎯 Risk Score", defaultSize: "size-normal" },
];

const Dashboard = () => {
  // --- 1. STATE: Clinical Data ---
  const [patientData, setPatientData] = useState({
    nihss: 5,
    age: 65,
    glucose: 110,
    prestroke_mrs: 0,
    sys_bp: 140,
    dis_bp: 90,
    cholesterol: 200
  });

  const [mrsScore, setMrsScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- 2. LOGIC: Backend API Integration ---
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

  // --- 3. LOGIC: SHAP (Internal UI logic) ---
  const shapData = useMemo(() => {
    return [
      { name: "NIHSS Score", value: parseFloat((patientData.nihss * 0.05).toFixed(2)) },
      { name: "Age", value: parseFloat((patientData.age * 0.004).toFixed(2)) },
      { name: "Blood Glucose", value: parseFloat(((patientData.glucose - 100) * 0.001).toFixed(2)) },
      { name: "Prior Stroke", value: 0.15 },
    ];
  }, [patientData]);

  // --- 4. MAPPING: Components ---
  const COMPONENT_MAP = {
    history: (props) => <PatientHistory {...props} />,
    analysis: (props) => <AnalysisChart data={shapData} size={props.size} />,
    interact: (props) => <InteractableVariables values={patientData} onChange={setPatientData} size={props.size} />,
    risk: (props) => <RiskScore score={mrsScore} loading={loading} size={props.size} />,
  };

  // --- 5. STATE: Layout & Scaling ---
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

  useEffect(() => {
    localStorage.setItem("clinical-dashboard-layout-v2", JSON.stringify(containers));
  }, [containers]);

  // Restored: Auto-Scaling Logic
  const handleResize = () => {
    if (!workspaceRef.current || !containerRef.current) return;
    const originalTransform = workspaceRef.current.style.transform;
    workspaceRef.current.style.transform = "none";
    const contentHeight = workspaceRef.current.scrollHeight;
    workspaceRef.current.style.transform = originalTransform;
    const paddingBuffer = isSidebarOpen ? 200 : 140;
    const availableHeight = containerRef.current.offsetHeight - paddingBuffer;

    if (contentHeight > availableHeight) {
      setScale(Math.max(Math.min((availableHeight / contentHeight) * 0.95, 1), 0.3));
    } else {
      setScale(1);
    }
  };

  useLayoutEffect(() => {
    handleResize();
    const timer = setTimeout(handleResize, 510);
    return () => clearTimeout(timer);
  }, [containers, isSidebarOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleDragEnd = (event) => {
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
    if (containers.length >= MAX_MODULES) return;
    setContainers([...containers, { id: `c_${Date.now()}`, contentId: null, size: "size-normal" }]);
  };

  const removeContainer = (id) => setContainers(containers.filter((c) => c.id !== id));

  const handleModuleDrop = (cId, mId) => {
    const modDef = availableModules.find(m => m.id === mId);
    setContainers(containers.map((c) =>
      (c.id === cId ? { ...c, contentId: mId, size: modDef?.defaultSize || "size-normal" } : c)
    ));
  };

  // Note: cycleSize function is permanently removed! Modules autosize via their defaultSize on drop.

  return (
    <div className={`app-layout ${!isSidebarOpen ? "sidebar-closed" : ""}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isSidebarOpen ? "›" : "‹"}
      </button>

      <main className="dashboard-wrapper" ref={containerRef}>
        <div className="header-area">
          <h1>xAI <span>MED8</span></h1>
          <button
            className={`add-container-btn ${containers.length >= MAX_MODULES ? 'disabled' : ''}`}
            onClick={addContainer}
          >
            +
          </button>
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
                      contentId={c.contentId}
                      size={c.size}
                      renderContent={() => COMPONENT_MAP[c.contentId]({ size: c.size })}
                      componentMap={COMPONENT_MAP}
                      onRemove={() => removeContainer(c.id)}
                      onDropModule={(mId) => handleModuleDrop(c.id, mId)}
                      /* REMOVED: onCycleSize */
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
          <h3>Tool Library</h3>
          <p className="sidebar-sub">Drag and drop into workspace</p>
          <div className="sidebar-list">
            {availableModules.map((mod) => (
              <div
                key={mod.id}
                className="sidebar-item"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("moduleId", mod.id)}
              >
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