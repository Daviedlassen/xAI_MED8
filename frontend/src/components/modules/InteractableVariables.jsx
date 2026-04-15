import React, { useMemo } from "react";

const InteractableVariables = ({ values, onChange, shapData, activeCategory }) => {
  const allConfigs = {
    sys_bp: { label: "BP Systolic", unit: "mmHg", min: 60, max: 240, safe: [80, 220], category: "cardio" },
    dis_bp: { label: "BP Diastolic", unit: "mmHg", min: 20, max: 220, safe: [60, 120], category: "cardio" },
    glucose: { label: "Glucose", unit: "mg/DL", min: 60, max: 220, safe: [80, 180], category: "metabolic" },
    cholesterol: { label: "LDL Cholesterol", unit: "mg/DL", min: 0, max: 190, safe: [60, 100], category: "cardio" },
    clopidogrel: { label: "Clopidogrel", unit: "mg", min: 0, max: 150, safe: [0, 75], category: "med" },
    nihss: { label: "NIHSS Score", unit: "pts", min: 0, max: 42, safe: [0, 4], category: "other" },
  };

  const topContributorKeys = useMemo(() => {
    if (!shapData) return ["sys_bp", "glucose"];
    return [...shapData]
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .map(item => {
        const n = item.name.toLowerCase();
        if (n.includes("bp") || n.includes("systolic")) return "sys_bp";
        if (n.includes("glucose")) return "glucose";
        if (n.includes("nihss")) return "nihss";
        return null;
      }).filter(Boolean).slice(0, 4);
  }, [shapData]);

  const renderList = useMemo(() => {
    if (activeCategory === "top") return topContributorKeys.map(k => ({ ...allConfigs[k], key: k }));
    return Object.entries(allConfigs)
      .filter(([_, v]) => v.category === activeCategory)
      .map(([k, v]) => ({ ...v, key: k }));
  }, [activeCategory, topContributorKeys]);

  return (
    <div className="variable-content-module">
      <header className="content-header">
        <h2 className="module-title">Changeable variables</h2>
        <span className="non-actionable-tag">non-actionable</span>
      </header>

      <div className="sliders-scroll-area">
        {renderList.map((s) => {
          const val = values[s.key] || s.min;
          const start = ((s.safe[0] - s.min) / (s.max - s.min)) * 100;
          const end = ((s.safe[1] - s.min) / (s.max - s.min)) * 100;

          return (
            <div key={s.key} className="clinical-var-row">
              <span className="var-label">{s.label}</span>
              <div className="var-interaction-group">
                <div className="value-box">
                  <span className="v-num">{val}</span>
                  <span className="v-unit">{s.unit}</span>
                </div>
                <div className="slider-wrapper">
                  <input
                    type="range" min={s.min} max={s.max} value={val}
                    onChange={(e) => onChange({ ...values, [s.key]: Number(e.target.value) })}
                    className="clinical-range"
                    style={{
                      background: `linear-gradient(to right, #ffe5e5 ${start}%, #e8f2ff ${start}%, #e8f2ff ${end}%, #ffe5e5 ${end}%)`
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractableVariables;