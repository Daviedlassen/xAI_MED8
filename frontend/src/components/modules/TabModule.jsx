import React from "react";

const TabModule = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: "top",       label: "Top Contributors" },
    { id: "cardio",    label: "Cardiometabolic markers" },
    { id: "metabolic", label: "Metrics" },
    { id: "med",       label: "Discharge Medication" },
    { id: "other",     label: "Other" },
  ];

  return (
    <div className="tab-navigation-module">
      <div className="tab-scroll-wrapper">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`v-tab ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabModule;