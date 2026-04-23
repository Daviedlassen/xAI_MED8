import React from "react";

const TABS = [
  { id: "top",       label: "Top Contributors" },
  { id: "cardio",    label: "Cardiometabolic markers" },
  { id: "metabolic", label: "Metrics" },
  { id: "med",       label: "Discharge Medication" },
  { id: "other",     label: "Other" },
];

const TabModule = ({ activeCategory, onCategoryChange }) => (
  <div className="tab-scroll-wrapper">
    {TABS.map(({ id, label }) => (
      <button
        key={id}
        className={`v-tab${activeCategory === id ? " active" : ""}`}
        onClick={() => onCategoryChange(id)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default TabModule;