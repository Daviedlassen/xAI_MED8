import React, { useMemo } from "react";

const InteractableVariables = ({ patientData, thresholds, onChange, activeCategory }) => {
  const categoryConfigs = {
    cardio: [
      { key: "sys_bp", label: "BP Systolic", unit: "mmHg", min: 60, max: 240, type: 'slider' },
      { key: "dis_bp", label: "BP Diastolic", unit: "mmHg", min: 20, max: 220, type: 'slider' },
      { key: "glucose", label: "Glucose", unit: "mg/DL", min: 20, max: 210, type: 'slider' },
      { key: "cholesterol", label: "LDL Cholesterol", unit: "mg/DL", min: 0, max: 190, type: 'slider' },
    ],
    metabolic: [
      { key: "ich_volume", label: "ICH Volume", unit: "mL", type: 'input' },
      { key: "ich_score", label: "ICH Score", min: 0, max: 6, type: 'scale', subLabels: ['Lower severity', 'Higher severity'] },
      { key: "hunt_hess", label: "Hunt Hess Scale", options: ['i', 'ii', 'iii', 'iv', 'v'], type: 'scale', subLabels: ['Mild headache', 'Coma'] },
      { key: "ivt_count", label: "Number of IVT", options: ['No', 'Yes'], type: 'toggle' },
      { key: "ct_perfusion", label: "CT Perfusion Score", min: 0, max: 10, reverse: true, type: 'scale', subLabels: ['Normal', 'Large infarct'] },
      { key: "ct_hypoperfusion", label: "CT Perfusion Hypopfusion", type: 'label_only' }
    ],
    med: [
      { key: "anti_diabetics", label: "Anti diabetics", type: 'toggle', options: ['No', 'Yes'] },
      { key: "cilostazol", label: "Cilostazol", type: 'toggle', options: ['No', 'Yes'] },
      { key: "clopidogrel", label: "Clopidogrel", type: 'toggle', options: ['No', 'Yes'] },
      { key: "ticagrelol", label: "Ticagrelol", type: 'toggle', options: ['No', 'Yes'] },
      { key: "ticlopidine", label: "Ticlopidine", type: 'toggle', options: ['No', 'Yes'] },
      { key: "prasugrel", label: "Prasugrel", type: 'toggle', options: ['No', 'Yes'] },
      { key: "dipyridamol", label: "Dipyridamol, slow release", type: 'toggle', options: ['No', 'Yes'] },

      { key: "divider", type: 'divider' }, // Inserts the horizontal line

      { key: "rivoroxaban", label: "Rivoroxaban for AF", type: 'toggle', options: ['No', 'Yes'] },
      { key: "warfarin", label: "Warfarin for AF", type: 'toggle', options: ['No', 'Yes'] },
      { key: "edoxaban", label: "Edoxaban for AF", type: 'toggle', options: ['No', 'Yes'] },
      { key: "dabigatran", label: "Dabigatran for AF", type: 'toggle', options: ['No', 'Yes'] },
      { key: "heparin", label: "Low molecular weight heparin/heparin for AF", type: 'toggle', options: ['No', 'Yes'] },
      { key: "apixaban", label: "Apixaban for AF", type: 'toggle', options: ['No', 'Yes'] },
    ],
    other: [
      { key: "active_smoker", label: "Active smoker", type: 'toggle', options: ['No', 'Yes'] },
      { key: "physio_72h", label: "Physiotherapy initiated >= 72 hours after", type: 'toggle', options: ['No', 'Yes'] },
    ]
  };

  const renderList = useMemo(() => {
    const targetKey = activeCategory === 'top' ? 'cardio' : activeCategory;
    return categoryConfigs[targetKey] || [];
  }, [activeCategory]);

  const handleUpdate = (key, type, newVal) => {
    if (!key || key === 'divider') return;
    const current = thresholds[key] || { low: 0, high: 100, val: 'No' };
    onChange({ ...thresholds, [key]: { ...current, [type]: newVal } });
  };

  return (
    <div className="variable-content-module full-container">
      <header className="content-header">
        <h2 className="clinical-title">Changable variables</h2>
      </header>

      <div className={`variable-scroll-wrapper ${activeCategory === 'med' ? 'grid-layout' : 'stack-layout'}`}>
        {renderList.map((s, index) => {
          // --- TYPE 0: DIVIDER ---
          if (s.type === 'divider') {
            return <hr key={`div-${index}`} className="med-divider" />;
          }

          // --- TYPE 1: LABEL ONLY ---
          if (s.type === 'label_only') {
            return (
              <div key={s.key} className="control-block-full">
                <span className="var-label-bold">{s.label}</span>
              </div>
            );
          }

          // --- TYPE 2: SLIDERS (Unchanged) ---
          if (s.type === 'slider') {
            const patientVal = patientData[s.key] || 0;
            const { low, high } = thresholds[s.key] || { low: s.min, high: s.max };
            const lowPct = ((low - s.min) / (s.max - s.min)) * 100;
            const highPct = ((high - s.min) / (s.max - s.min)) * 100;
            const patientPct = ((patientVal - s.min) / (s.max - s.min)) * 100;

            return (
              <div key={s.key} className="clinical-var-row-full">
                <div className="var-header-inline">
                  <span className="var-label-bold">{s.label}</span>
                  <div className="patient-val-pill">{patientVal} {s.unit}</div>
                </div>
                <div className="dual-slider-container-full">
                  <div className="gauge-track-wide" style={{ background: `linear-gradient(to right, #ffe5e5 0% ${lowPct}%, #e8f2ff ${lowPct}% ${highPct}%, #ffe5e5 ${highPct}% 100%)` }}>
                    <div className="patient-marker" style={{ left: `${patientPct}%` }} />
                    <span className="tick-label" style={{ left: `${lowPct}%` }}>{low}</span>
                    <span className="tick-label" style={{ left: `${highPct}%` }}>{high}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} value={low} className="thumb-input-wide" onChange={(e) => handleUpdate(s.key, 'low', Number(e.target.value))} />
                  <input type="range" min={s.min} max={s.max} value={high} className="thumb-input-wide" onChange={(e) => handleUpdate(s.key, 'high', Number(e.target.value))} />
                </div>
              </div>
            );
          }

          // --- TYPE 3: NUMBER INPUT ---
          if (s.type === 'input') {
            const currentVal = thresholds[s.key]?.val ?? patientData[s.key] ?? 30;
            return (
              <div key={s.key} className="control-block-full">
                <span className="var-label-bold">{s.label}</span>
                <div className="styled-num-input-box">
                  <input type="number" className="styled-num-input" value={currentVal} onChange={(e) => handleUpdate(s.key, 'val', e.target.value)} />
                  <span className="styled-num-unit">{s.unit}</span>
                </div>
              </div>
            );
          }

          // --- TYPE 4 & 5: SCALES & TOGGLES ---
          const options = s.options || (s.reverse
            ? Array.from({ length: s.max - s.min + 1 }, (_, i) => s.max - i)
            : Array.from({ length: s.max - s.min + 1 }, (_, i) => i + s.min));

          const isScale = s.type === 'scale';

          return (
            <div key={s.key} className="control-block-full">
              <span className="var-label-bold">{s.label}</span>

              {isScale ? (
                // Scale rendering (Individual boxes)
                <>
                  <div className="discrete-box-group">
                    {options.map(opt => (
                      <button key={opt} className={`discrete-btn ${thresholds[s.key]?.val === opt ? 'active' : ''}`} onClick={() => handleUpdate(s.key, 'val', opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {s.subLabels && (
                    <div className="sub-labels">
                      <span>{s.subLabels[0]}</span>
                      <span>{s.subLabels[1]}</span>
                    </div>
                  )}
                </>
              ) : (
                // Toggle rendering (Segmented flat buttons)
                <div className="segmented-toggle-group">
                  {options.map(opt => (
                    <button key={opt} className={`segmented-btn ${thresholds[s.key]?.val === opt ? 'active' : ''}`} onClick={() => handleUpdate(s.key, 'val', opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractableVariables;