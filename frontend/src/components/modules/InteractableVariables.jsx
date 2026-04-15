/*V1*/
import React, { useMemo } from "react";

const InteractableVariables = ({ patientData, thresholds, onChange, activeCategory }) => {
  const allConfigs = {
    sys_bp: { label: "BP Systolic", unit: "mmHg", min: 60, max: 240, category: "cardio" },
    dis_bp: { label: "BP Diastolic", unit: "mmHg", min: 20, max: 220, category: "cardio" },
    glucose: { label: "Glucose", unit: "mg/DL", min: 60, max: 220, category: "metabolic" },
    cholesterol: { label: "LDL Cholesterol", unit: "mg/DL", min: 0, max: 190, category: "cardio" },
    clopidogrel: { label: "Clopidogrel", unit: "mg", min: 0, max: 150, category: "med" },
    nihss: { label: "NIHSS Score", unit: "pts", min: 0, max: 42, category: "other" },
  };

  const renderList = useMemo(() => {
    const keys = Object.keys(allConfigs);
    if (activeCategory === "top") {
      return ["sys_bp", "glucose", "nihss"].map(k => ({ ...allConfigs[k], key: k }));
    }
    return keys
      .filter(k => allConfigs[k].category === activeCategory)
      .map(k => ({ ...allConfigs[k], key: k }));
  }, [activeCategory]);

  const handleUpdate = (key, type, newVal) => {
    const current = thresholds[key] || { low: 0, high: 100 };
    const val = Number(newVal);
    if (type === 'low' && val >= current.high) return;
    if (type === 'high' && val <= current.low) return;

    onChange({
      ...thresholds,
      [key]: { ...current, [type]: val }
    });
  };

  return (
    <div className="variable-content-module" style={{ width: '100%', height: '100%' }}>
      <header className="content-header" style={{ marginBottom: '20px' }}>
        <h2 className="module-title">Risk Thresholds</h2>
      </header>

      <div className="sliders-scroll-area">
        {renderList.map((s) => {
          const patientVal = patientData[s.key] || 0;
          const { low, high } = thresholds[s.key] || { low: s.min, high: s.max };

          const lowPct = ((low - s.min) / (s.max - s.min)) * 100;
          const highPct = ((high - s.min) / (s.max - s.min)) * 100;
          const patientPct = ((patientVal - s.min) / (s.max - s.min)) * 100;
          const isUnsafe = patientVal < low || patientVal > high;

          return (
            <div key={s.key} className="clinical-var-row">
              <div className="var-value-stack">
                <span className={`v-num ${isUnsafe ? "critical" : ""}`}>{patientVal}</span>
                <span className="v-unit">{s.unit}</span>
              </div>

              <div className="dual-slider-container">
                <span className="var-label">{s.label}</span>
                <div
                  className="gauge-track"
                  style={{
                    background: `linear-gradient(to right, 
                      #ffe5e5 0%, #ffe5e5 ${lowPct}%, 
                      #e8f2ff ${lowPct}%, #e8f2ff ${highPct}%, 
                      #ffe5e5 ${highPct}%, #ffe5e5 100%)`
                  }}
                >
                  <div className="patient-marker" style={{ left: `${patientPct}%` }} />
                  <span className="tick-label" style={{ left: `${lowPct}%` }}>{low}</span>
                  <span className="tick-label" style={{ left: `${highPct}%` }}>{high}</span>
                </div>

                <input
                  type="range" min={s.min} max={s.max} value={low}
                  onChange={(e) => handleUpdate(s.key, 'low', e.target.value)}
                  className="thumb-input"
                />
                <input
                  type="range" min={s.min} max={s.max} value={high}
                  onChange={(e) => handleUpdate(s.key, 'high', e.target.value)}
                  className="thumb-input"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractableVariables;