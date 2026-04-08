import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
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

const MAX_MODULES = 20;


const availableModules = [
  { id: "history", label: "📋 Patient History", defaultSize: "size-wide" },
  { id: "analysis", label: "📊 SHAP Analysis", defaultSize: "size-large" },
  { id: "interact", label: "🎛️ Variables", defaultSize: "size-normal" },
  { id: "risk", label: "🎯 Risk Score", defaultSize: "size-normal" },
];

const Dashboard = () => {
  // 1. STATE: Patient Input Values
  const [patientData, setPatientData] = useState({
    nihss: 8,
    age: 65,
    glucose: 140,
  });

  // 2. LOGIC: Simulated SHAP calculation based on inputs
  const shapData = useMemo(() => {
    return [
        { name: "NIHSS Score", value: parseFloat((patientData.nihss * 0.05).toFixed(2)) },
        { name: "Age", value: parseFloat((patientData.age * 0.004).toFixed(2)) },
        { name: "Blood Glucose", value: parseFloat(((patientData.glucose - 100) * 0.001).toFixed(2)) },
        { name: "Prior Stroke", value: 0.15 },
    ];
  }, [patientData]);

const riskScore = useMemo(() => {
  // Baseline mRS (starting point)
  const baseline = 1;
  // Sum SHAP values (assuming they are calibrated for mRS impact)
  const sumSHAP = shapData.reduce((acc, item) => acc + item.value, 0);

  // Final score clamped between 0 and 6
  const rawScore = Math.round(baseline + (sumSHAP * 2));
  return Math.min(Math.max(rawScore, 0), 6);
}, [shapData]);

  // 3. MAPPING: Passing state into components
  const COMPONENT_MAP = {
    history: PatientHistory,
    analysis: () => <AnalysisChart data={shapData} />,
    interact: () => <InteractableVariables values={patientData} onChange={setPatientData} />,
      risk: () => <RiskScore score={riskScore} />, // Add this line
  };

  // 4. STATE: Layout and UI
  const [containers, setContainers] = useState(() => {
    const saved = localStorage.getItem("clinical-dashboard-layout-v2");
    return saved ? JSON.parse(saved) : [
      { id: "cont_1", contentId: "history", size: "size-wide" },
      { id: "cont_2", contentId: "analysis", size: "size-large" },
      { id: "cont_3", contentId: "interact", size: "size-normal" },
    ];
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [scale, setScale] = useState(1);
  const workspaceRef = useRef(null);
  const containerRef = useRef(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem("clinical-dashboard-layout-v2", JSON.stringify(containers));
  }, [containers]);

  // Scaling Logic
  const handleResize = () => {
    if (!workspaceRef.current || !containerRef.current) return;
    const originalTransform = workspaceRef.current.style.transform;
    workspaceRef.current.style.transform = "none";
    const contentHeight = workspaceRef.current.scrollHeight;
    workspaceRef.current.style.transform = originalTransform;

    const paddingBuffer = isSidebarOpen ? 180 : 140;
    const availableHeight = containerRef.current.offsetHeight - paddingBuffer;

    if (contentHeight > availableHeight) {
      const newScale = (availableHeight / contentHeight) * 0.95;
      setScale(Math.max(Math.min(newScale, 1), 0.3));
    } else {
      setScale(1);
    }
  };

  useLayoutEffect(() => {
    handleResize();
    const timer = setTimeout(handleResize, 450);
    return () => clearTimeout(timer);
  }, [containers, isSidebarOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handlers
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

  const cycleSize = (id) => {
    const sizes = ["size-normal", "size-wide", "size-large"];
    setContainers(containers.map(c => {
      if (c.id === id) {
        const nextIndex = (sizes.indexOf(c.size) + 1) % sizes.length;
        return { ...c, size: sizes[nextIndex] };
      }
      return c;
    }));
  };

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
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
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
                      componentMap={COMPONENT_MAP}
                      onRemove={() => removeContainer(c.id)}
                      onCycleSize={() => cycleSize(c.id)}
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