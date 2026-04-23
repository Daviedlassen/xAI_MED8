import React, { useMemo, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   SLIDER CONFIG
   ───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   UPDATED SLIDER CONFIG
   ───────────────────────────────────────────────────────────── */
const SLIDER_CONFIG = [
  // Adding NIHSS here makes it interactive!
  { key: "nihss",       label: "NIHSS Score",     unit: "pts",   min: 0,   max: 42,  singleThreshold: true,  guidelines: "NIH Stroke Scale" },
  { key: "sys_bp",      label: "BP Systolic",     unit: "mmHg",  min: 60,  max: 240, singleThreshold: false, guidelines: "American Heart Association" },
  { key: "dis_bp",      label: "BP Diastolic",    unit: "mmHg",  min: 20,  max: 220, singleThreshold: true,  guidelines: "American Heart Association" },
  { key: "glucose",     label: "Glucose",         unit: "mg/dL", min: 20,  max: 400, singleThreshold: false, guidelines: "American Heart Association" },
  { key: "cholesterol", label: "LDL Cholesterol", unit: "mg/dL", min: 0,   max: 300, singleThreshold: false, guidelines: "American Heart Association" },
];

const OTHER_CONFIGS = {
  metabolic: [
    { key: "ich_volume",       label: "ICH Volume",                 unit: "mL", type: "input" },
    { key: "ich_score",        label: "ICH Score",                  min: 0, max: 6,  type: "scale",  subLabels: ["Lower severity", "Higher severity"] },
    { key: "hunt_hess",        label: "Hunt Hess Scale",            options: ["i","ii","iii","iv","v"], type: "scale", subLabels: ["Mild headache", "Coma"] },
    { key: "ivt_count",        label: "Number of IVT",              options: ["No","Yes"], type: "toggle" },
    { key: "ct_perfusion",     label: "CT Perfusion Score",         min: 0, max: 10, reverse: true, type: "scale", subLabels: ["Normal", "Large infarct"] },
    { key: "ct_hypoperfusion", label: "CT Perfusion Hypoperfusion", type: "label_only" },
  ],
  med: [
    { key: "anti_diabetics", label: "Anti Diabetics",                            type: "toggle", options: ["No","Yes"] },
    { key: "cilostazol",     label: "Cilostazol",                                type: "toggle", options: ["No","Yes"] },
    { key: "clopidogrel",    label: "Clopidogrel",                               type: "toggle", options: ["No","Yes"] },
    { key: "ticagrelor",     label: "Ticagrelor",                                type: "toggle", options: ["No","Yes"] },
    { key: "ticlopidine",    label: "Ticlopidine",                               type: "toggle", options: ["No","Yes"] },
    { key: "prasugrel",      label: "Prasugrel",                                 type: "toggle", options: ["No","Yes"] },
    { key: "dipyridamol",    label: "Dipyridamol, Slow Release",                 type: "toggle", options: ["No","Yes"] },
    { key: "divider", type: "divider" },
    { key: "rivoroxaban",    label: "Rivaroxaban for AF",                        type: "toggle", options: ["No","Yes"] },
    { key: "warfarin",       label: "Warfarin for AF",                           type: "toggle", options: ["No","Yes"] },
    { key: "edoxaban",       label: "Edoxaban for AF",                           type: "toggle", options: ["No","Yes"] },
    { key: "dabigatran",     label: "Dabigatran for AF",                         type: "toggle", options: ["No","Yes"] },
    { key: "heparin",        label: "Low Mol. Weight Heparin / Heparin for AF",  type: "toggle", options: ["No","Yes"] },
    { key: "apixaban",       label: "Apixaban for AF",                           type: "toggle", options: ["No","Yes"] },
  ],
  other: [
    { key: "active_smoker", label: "Active Smoker",                              type: "toggle", options: ["No","Yes"] },
    { key: "physio_72h",    label: "Physiotherapy initiated ≥ 72 hours after",   type: "toggle", options: ["No","Yes"] },
  ],
};

/* ── pure helpers ─────────────────────────────────────────── */
const pct        = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
const clamp      = (v, lo, hi)     => Math.max(lo, Math.min(hi, v));
const buildTicks = (min, max, n = 10) =>
  Array.from({ length: n + 1 }, (_, i) => Math.round(min + (i / n) * (max - min)));

const clientXToVal = (trackEl, min, max, clientX) => {
  const { left, width } = trackEl.getBoundingClientRect();
  return Math.round(min + clamp((clientX - left) / width, 0, 1) * (max - min));
};

/* ─────────────────────────────────────────────────────────────
   GAUGE ROW
   The patient triangle is driven purely by patientVal (read-only).
   Dragging the threshold handles ONLY updates thresholds — the
   patient marker never moves as a result of a drag.
   ───────────────────────────────────────────────────────────── */
const GaugeRow = ({ s, patientVal, low, high, onUpdate }) => {
  const { min, max, singleThreshold } = s;

  const lowPct  = pct(low,        min, max);
  const highPct = pct(high,       min, max);
  const patPct  = pct(patientVal, min, max);

  const isAbnormal = singleThreshold
    ? patientVal > high
    : patientVal < low || patientVal > high;

  const zoneBg = singleThreshold
    ? `linear-gradient(to right, #eef6fc 0% ${highPct}%, #fdeeed ${highPct}% 100%)`
    : `linear-gradient(to right, #fdeeed 0% ${lowPct}%, #eef6fc ${lowPct}% ${highPct}%, #fdeeed ${highPct}% 100%)`;

  const ticks = useMemo(() => buildTicks(min, max, 10), [min, max]);

  const makeDrag = useCallback((handle) => (e) => {
    e.preventDefault();
    const track = e.currentTarget.parentElement; // full gauge track

    const onMove = (me) => {
      const raw = clientXToVal(track, min, max, me.clientX);
      onUpdate(handle, raw);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    onMove(e);
  }, [min, max, onUpdate]);

  return (
    <div className="clinical-var-row-full-wide">
      <span className="var-label-bold">{s.label}</span>

      <div style={{ display: "flex", alignItems: "stretch", gap: 12, width: "100%" }}>
        {/* Value box — always shows the fixed patient value */}
        <div className="value-display-box-v3" style={{ minWidth: 80 }}>
          <span className={`v-num-v3 ${isAbnormal ? "danger" : "safe"}`}>{patientVal}</span>
          <span className="v-unit-v3">{s.unit}</span>
        </div>

        {/* Gauge track */}
        <div style={{ flex: 1, position: "relative", paddingBottom: 22 }}>
          <div style={{
            position: "relative",
            height: 50,
            borderRadius: 6,
            border: "1px solid #d1d1d6",
            background: zoneBg,
            overflow: "visible",
            userSelect: "none",
          }}>

            {/* Patient triangle + stem — read-only, never moves on drag */}
            <div style={{
              position: "absolute",
              left: `${patPct}%`,
              top: 0,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "none",
              zIndex: 6,
            }}>
              <div style={{ width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"12px solid #000" }} />
              <div style={{ width:2, height:38, background:"#000" }} />
            </div>

            {/* Low threshold handle */}
            {!singleThreshold && (
              <div
                onPointerDown={makeDrag("low")}
                style={{ position:"absolute", left:`${lowPct}%`, top:0, height:"100%", width:28, transform:"translateX(-50%)", cursor:"ew-resize", zIndex:8 }}
              >
                <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:0, height:"100%", borderLeft:"1.5px dashed #333", pointerEvents:"none" }} />
                <div style={{ position:"absolute", top:5, left:"50%", transform:"translateX(-50%)", fontSize:11, fontWeight:800, background:"rgba(255,255,255,0.9)", padding:"0 3px", borderRadius:3, whiteSpace:"nowrap", pointerEvents:"none", zIndex:2 }}>
                  {low}
                </div>
              </div>
            )}

            {/* High threshold handle */}
            <div
              onPointerDown={makeDrag("high")}
              style={{ position:"absolute", left:`${highPct}%`, top:0, height:"100%", width:28, transform:"translateX(-50%)", cursor:"ew-resize", zIndex:8 }}
            >
              <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:0, height:"100%", borderLeft:"1.5px dashed #333", pointerEvents:"none" }} />
              <div style={{ position:"absolute", top:5, left:"50%", transform:"translateX(-50%)", fontSize:11, fontWeight:800, background:"rgba(255,255,255,0.9)", padding:"0 3px", borderRadius:3, whiteSpace:"nowrap", pointerEvents:"none", zIndex:2 }}>
                {high}
              </div>
            </div>
          </div>

          {/* Ruler ticks */}
          <div style={{ position:"relative", height:20, marginTop:2 }}>
            {ticks.map((val) => (
              <div key={val} style={{ position:"absolute", left:`${pct(val,min,max)}%`, top:0, transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:1, height:5, background:"#aaa" }} />
                <span style={{ fontSize:10, color:"#8e8e93", fontWeight:600, marginTop:1 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="guideline-text">
        Threshold based on the clinical guideline – Blood Pressure Management by{" "}
        <span>{s.guidelines}</span> <span className="guideline-icon">⎋</span>
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
const InteractableVariables = ({ patientData, thresholds, onChange, activeCategory }) => {
  // onPatientChange is intentionally NOT accepted here —
  // threshold drags must never modify patientData.

  const isSliderTab = activeCategory === "top" || activeCategory === "cardio";

  const otherList = useMemo(() => {
    const key = activeCategory === "top" ? "cardio" : activeCategory;
    return OTHER_CONFIGS[key] || [];
  }, [activeCategory]);

  /*
   * makeUpdater only calls onChange (thresholds) — it never touches patientData.
   * Clamping is done inside the functional updater so it always reads latest state.
   */
  const makeUpdater = useCallback((key, min, max) => (handle, raw) => {
    onChange((prev) => {
      const cur = prev[key] || { low: min, high: max };
      const next = handle === "low"
        ? { ...cur, low:  clamp(raw, min, cur.high - 1) }
        : { ...cur, high: clamp(raw, cur.low + 1, max)  };
      return { ...prev, [key]: next };
    });
  }, [onChange]);

  return (
    <div className="variable-content-module full-container">
      <header className="content-header">
        <h2 className="clinical-title">Changeable variables</h2>
      </header>

      <div className="variable-scroll-wrapper stack-layout">

        {/* Slider tab (cardio / top) */}
        {isSliderTab && SLIDER_CONFIG.map((s) => {
          const { low = s.min, high = s.max } = thresholds[s.key] || {};

          // 1. Get raw value
          let displayVal = patientData[s.key] ?? 0;

          // 2. Mirror backend unit conversion so the UI triangle matches the mg/dL scale
          if (s.key === "glucose" && displayVal > 0 && displayVal < 50) {
            displayVal = Number((displayVal * 18.01).toFixed(1));
          }
          if (s.key === "cholesterol" && displayVal > 0 && displayVal < 25) {
            displayVal = Number((displayVal * 38.67).toFixed(1));
          }

          return (
            <GaugeRow
              key={s.key}
              s={s}
              patientVal={displayVal} // Pass the adjusted value here
              low={low}
              high={high}
              onUpdate={makeUpdater(s.key, s.min, s.max)}
            />
          );
        })}

        {/* Other tabs — read-only controls */}
        {!isSliderTab && otherList.map((s, i) => {
          if (s.type === "divider") return <hr key={`div-${i}`} className="med-divider" />;

          const currentVal = thresholds[s.key]?.val ?? patientData[s.key];

          if (s.type === "input") return (
            <div key={s.key} className="control-block-full read-only">
              <span className="var-label-small">{s.label}</span>
              <div className="styled-num-input-box locked">
                <input type="number" className="styled-num-input" value={currentVal || ""} readOnly />
                <span className="styled-num-unit">{s.unit}</span>
              </div>
            </div>
          );

          const options = s.options || (s.reverse
            ? Array.from({ length: s.max - s.min + 1 }, (_, k) => s.max - k)
            : Array.from({ length: s.max - s.min + 1 }, (_, k) => k + s.min));

          return (
            <div key={s.key} className="control-block-full read-only">
              <span className="var-label-small">{s.label}</span>
              <div className={s.type === "scale" ? "discrete-box-group" : "segmented-toggle-group"}>
                {options.map((opt) => (
                  <button
                    key={opt}
                    className={`${s.type === "scale" ? "discrete-btn" : "segmented-btn"} ${currentVal === opt ? "active" : ""}`}
                    disabled
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractableVariables;