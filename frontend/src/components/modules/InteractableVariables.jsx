import React, { useState, useMemo, useCallback } from "react";


// ── Guideline data ──────────────────────────────────────────────────────────
const GUIDELINES = {
  sys_bp: {
    source:    "American Heart Association",
    fullTitle: "2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke — American Heart Association / American Stroke Association",
    section:   "4.3. Blood Pressure Management",
    redBox:    "Recommendations for Blood Pressure Management. Referenced studies that support the recommendations are summarized in the online data supplement.",
    rows: [
      { cor: "1",  loe: "C-LD", corColor: "#3a8f5a", loeColor: "#3a8f5a",
        text: "In patients with AIS, hypotension and hypovolemia should be corrected to maintain systemic perfusion levels necessary to support organ function." },
      { cor: "1",  loe: "C-EO", corColor: "#3a8f5a", loeColor: "#3a8f5a",
        text: "In patients with AIS, early treatment of hypertension is indicated when required by comorbid conditions (eg, concomitant acute coronary event, acute heart failure, aortic dissection, post-thrombolysis sICH, or preeclampsia/eclampsia) to reduce the risk of complications." },
      { cor: "2b", loe: "C-EO", corColor: "#c47d1a", loeColor: "#c47d1a",
        text: "In patients with BP ≥220/120 mm Hg who did not receive IVT or EVT and have no comorbid conditions requiring urgent antihypertensive treatment, the benefit of initiating or reinitiating treatment of hypertension within the first 48 hours is uncertain." },
    ],
  },
  dis_bp: {
    source:    "American Heart Association",
    fullTitle: "2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke — American Heart Association / American Stroke Association",
    section:   "4.3. Blood Pressure Management",
    redBox:    "Recommendations for Blood Pressure Management. Referenced studies that support the recommendations are summarized in the online data supplement.",
    rows: [
      { cor: "1",  loe: "C-LD", corColor: "#3a8f5a", loeColor: "#3a8f5a",
        text: "In patients with AIS, hypotension and hypovolemia should be corrected to maintain systemic perfusion levels necessary to support organ function." },
      { cor: "1",  loe: "C-EO", corColor: "#3a8f5a", loeColor: "#3a8f5a",
        text: "Early treatment of hypertension is indicated when required by comorbid conditions." },
    ],
  },
  glucose: {
    source:    "American Heart Association",
    fullTitle: "2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke — American Heart Association / American Stroke Association",
    section:   "4.4. Glucose Management",
    redBox:    "Recommendations for Glucose Management. Referenced studies are summarized in the online data supplement.",
    rows: [
      { cor: "1",  loe: "C-LD", corColor: "#3a8f5a", loeColor: "#3a8f5a",
        text: "Hypoglycemia (blood glucose <60 mg/dL) should be treated in patients with AIS." },
      { cor: "2a", loe: "C-LD", corColor: "#3a7ab5", loeColor: "#3a7ab5",
        text: "It is reasonable to treat hyperglycemia to achieve blood glucose levels in the range of 140–180 mg/dL and to closely monitor to prevent hypoglycemia." },
    ],
  },
  cholesterol: {
    source:    "American Heart Association",
    fullTitle: "2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease — American Heart Association",
    section:   "6.1. LDL Cholesterol Targets",
    redBox:    "Recommendations for LDL Cholesterol Management. Referenced studies are summarized in the online data supplement.",
    rows: [
      { cor: "1",  loe: "A",    corColor: "#3a8f5a", loeColor: "#3a8f5a",
        text: "In patients with clinical ASCVD, reduce LDL-C by ≥50% from baseline and aim for LDL-C <70 mg/dL." },
      { cor: "2a", loe: "B-R",  corColor: "#3a7ab5", loeColor: "#3a7ab5",
        text: "In very high-risk ASCVD, a LDL-C goal of <55 mg/dL is reasonable." },
    ],
  },
};

// ── Guideline Overlay ───────────────────────────────────────────────────────
const GuidelineOverlay = ({ data, onClose }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

    {/* Dark header bar */}
    <div style={{
      background: "#111", color: "#fff", padding: "10px 12px",
      display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0,
    }}>
      {/* AHA logo mark */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", background: "#c8102e",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 17, lineHeight: 1,
      }}>❤</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: "#aaa", marginBottom: 3, fontWeight: 600, letterSpacing: "0.04em" }}>
          NOW READING:
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.4 }}>
          {data.fullTitle}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none", border: "1.5px solid #555", borderRadius: "50%",
          color: "#fff", width: 22, height: 22, cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, lineHeight: 1, marginTop: 2,
        }}
      >✕</button>
    </div>

    {/* Scrollable body */}
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 16px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12, color: "#1c1c1e" }}>
        {data.section}
      </h2>

      {/* Red box */}
      <div style={{
        background: "#c8102e", color: "#fff", borderRadius: 6,
        padding: "10px 13px", marginBottom: 14, fontSize: 11.5,
        fontWeight: 700, lineHeight: 1.55,
      }}>
        {data.redBox.replace("online data supplement", "")}
        <span style={{ textDecoration: "underline", color: "#a8d8f0" }}>online data supplement</span>.
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead>
          <tr style={{ background: "#e0e0e5" }}>
            {["COR", "LOE", "Recommendations"].map((h, i) => (
              <th key={h} style={{
                padding: "7px 9px", textAlign: i < 2 ? "center" : "left",
                fontWeight: 800, border: "1px solid #ccc",
                width: i < 2 ? 52 : undefined,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              <td style={{
                padding: 9, textAlign: "center", fontWeight: 900, fontSize: 14,
                background: row.corColor, color: "#fff", border: "1px solid #ccc",
              }}>{row.cor}</td>
              <td style={{
                padding: 9, textAlign: "center", fontWeight: 700,
                background: row.loeColor, color: "#fff", border: "1px solid #ccc",
              }}>{row.loe}</td>
              <td style={{ padding: "9px 12px", lineHeight: 1.55, border: "1px solid #ccc", color: "#1c1c1e" }}>
                {i + 1}. {row.text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SLIDER_CONFIG = [

  { key: "sys_bp",      label: "BP Systolic",     unit: "mmHg", min: 60, max: 240, singleThreshold: false, guidelines: "American Heart Association" },
  { key: "dis_bp",      label: "BP Diastolic",    unit: "mmHg", min: 20, max: 220, singleThreshold: true,  guidelines: "American Heart Association" },
  { key: "glucose",     label: "Glucose",         unit: "mg/dL",min: 20, max: 400, singleThreshold: false, guidelines: "American Heart Association" },
  { key: "cholesterol", label: "LDL Cholesterol", unit: "mg/dL",min: 0,  max: 300, singleThreshold: false, guidelines: "American Heart Association" },
];



const OTHER_CONFIGS = {
  metabolic: [
    { key: "ich_volume",   label: "ICH Volume",        unit: "mL", type: "input" },
    { key: "ich_score",    label: "ICH Score",          min: 0, max: 6, type: "scale" },
    { key: "hunt_hess",    label: "Hunt Hess Scale",    options: ["i","ii","iii","iv","v"], type: "scale" },
    { key: "ivt_count",    label: "Number of IVT",      options: ["No","Yes"], type: "toggle" },
    { key: "ct_perfusion", label: "CT Perfusion Score", min: 0, max: 10, reverse: true, type: "scale" },
  ],
  med: [
    { key: "anti_diabetics", label: "Anti Diabetics",                           type: "toggle", options: ["No","Yes"] },
    { key: "cilostazol",     label: "Cilostazol",                               type: "toggle", options: ["No","Yes"] },
    { key: "clopidogrel",    label: "Clopidogrel",                              type: "toggle", options: ["No","Yes"] },
    { key: "ticagrelor",     label: "Ticagrelor",                               type: "toggle", options: ["No","Yes"] },
    { key: "ticlopidine",    label: "Ticlopidine",                              type: "toggle", options: ["No","Yes"] },
    { key: "prasugrel",      label: "Prasugrel",                                type: "toggle", options: ["No","Yes"] },
    { key: "dipyridamol",    label: "Dipyridamol, Slow Release",                type: "toggle", options: ["No","Yes"] },
    { key: "divider", type: "divider" },
    { key: "rivoroxaban",    label: "Rivaroxaban for AF",                       type: "toggle", options: ["No","Yes"] },
    { key: "warfarin",       label: "Warfarin for AF",                          type: "toggle", options: ["No","Yes"] },
    { key: "edoxaban",       label: "Edoxaban for AF",                          type: "toggle", options: ["No","Yes"] },
    { key: "dabigatran",     label: "Dabigatran for AF",                        type: "toggle", options: ["No","Yes"] },
    { key: "heparin",        label: "Low Mol. Weight Heparin / Heparin for AF", type: "toggle", options: ["No","Yes"] },
    { key: "apixaban",       label: "Apixaban for AF",                          type: "toggle", options: ["No","Yes"] },
  ],
  other: [
    { key: "active_smoker", label: "Active Smoker",              type: "toggle", options: ["No","Yes"] },
    { key: "physio_72h",    label: "Physiotherapy ≥ 72h after",  type: "toggle", options: ["No","Yes"] },
  ],
  // "Changeable, not actionable" tab — read-only demographic/clinical facts
  nonaction: [
    { key: "age",             label: "Age",                      type: "input", unit: "yrs" },
    { key: "prestroke_mrs",   label: "Pre-stroke mRS",           min: 0, max: 6, type: "scale" },
    { key: "nihss",           label: "NIHSS Score",              type: "input", unit: "pts" },
    { key: "covid_positive",  label: "Covid Positive",           type: "toggle", options: ["No","Yes"] },
    { key: "stroke_mimics",   label: "Stroke Mimics",            type: "toggle", options: ["No","Yes"] },
    { key: "in_hospital",     label: "In-hospital Stroke",       type: "toggle", options: ["No","Yes"] },
    { key: "prev_is_tia",     label: "Previous IS/TIA",          type: "toggle", options: ["No","Yes"] },
    { key: "prev_ich",        label: "Previous ICH",             type: "toggle", options: ["No","Yes"] },
  ],
};

const pct   = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
const clamp = (v, lo, hi)     => Math.max(lo, Math.min(hi, v));

const buildTicks = (min, max, n = 10) =>
  Array.from({ length: n + 1 }, (_, i) => Math.round(min + (i / n) * (max - min)));

const clientXToVal = (el, min, max, clientX) => {
  const { left, width } = el.getBoundingClientRect();
  return Math.round(min + clamp((clientX - left) / width, 0, 1) * (max - min));
};

/* ── Compact Gauge Row ── */
// Change the signature:
const GaugeRow = ({ s, patientVal, low, high, onUpdate, onGuidelineClick }) => {
  const { min, max, singleThreshold } = s;
  const lowPct  = pct(low,  min, max);
  const highPct = pct(high, min, max);
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
    const track = e.currentTarget.parentElement;
    const onMove = (me) => {
      const raw = clientXToVal(track, min, max, me.clientX);
      onUpdate(handle, raw);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    onMove(e);
  }, [min, max, onUpdate]);

  return (
    <div className="gauge-row">
      <span className="gauge-row-label">{s.label}</span>
      <div className="gauge-row-inner">
        <div className="value-box">
          <span className={`v-num-v3 ${isAbnormal ? "danger" : "safe"}`}>{patientVal}</span>
          <span className="v-unit-v3">{s.unit}</span>
        </div>
        <div className="gauge-track-wrap">
          <div className="gauge-track" style={{ background: zoneBg }}>
            {/* Patient marker */}
            <div style={{
              position: "absolute", left: `${patPct}%`, top: 0,
              transform: "translateX(-50%)", display: "flex",
              flexDirection: "column", alignItems: "center",
              pointerEvents: "none", zIndex: 6,
            }}>
              <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "9px solid #000" }} />
              <div style={{ width: 2, height: 23, background: "#000" }} />
            </div>

            {/* Low handle */}
            {!singleThreshold && (
              <div
                onPointerDown={makeDrag("low")}
                style={{ position: "absolute", left: `${lowPct}%`, top: 0, height: "100%", width: 24, transform: "translateX(-50%)", cursor: "ew-resize", zIndex: 8 }}
              >
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 0, height: "100%", borderLeft: "1.5px dashed #555", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.92)", padding: "0 2px", borderRadius: 2, whiteSpace: "nowrap", pointerEvents: "none" }}>{low}</div>
              </div>
            )}

            {/* High handle */}
            <div
              onPointerDown={makeDrag("high")}
              style={{ position: "absolute", left: `${highPct}%`, top: 0, height: "100%", width: 24, transform: "translateX(-50%)", cursor: "ew-resize", zIndex: 8 }}
            >
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 0, height: "100%", borderLeft: "1.5px dashed #555", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.92)", padding: "0 2px", borderRadius: 2, whiteSpace: "nowrap", pointerEvents: "none" }}>{high}</div>
            </div>
          </div>

          <div className="gauge-ticks">
            {ticks.map(val => (
              <div key={val} className="gauge-tick" style={{ left: `${pct(val, min, max)}%` }}>
                <div className="gauge-tick-line" />
                <span className="gauge-tick-label">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p
        className="guideline-text"
        style={{ cursor: "pointer" }}
        onClick={() => onGuidelineClick(s.key)}
      >
        Threshold based on the clinical guideline –{" "}
        <span style={{ color: "#c8102e" }}>{s.guidelines}</span>{" "}
        <span className="guideline-icon">⎋</span>
      </p>
    </div>
  );
};

/* ── Generic control list (toggle / scale / input) ── */
const ControlList = ({ list, patientData, readOnly = false }) => (
  <div className="other-controls-list">
    {list.map((s, i) => {
      if (s.type === "divider") return <hr key={`div-${i}`} className="med-divider" />;
      const currentVal = patientData[s.key];

      if (s.type === "input") return (
        <div key={s.key} className="control-row">
          <span className="control-label">{s.label}</span>
          <div className="styled-num-input-box">
            <input className="styled-num-input" type="number" value={currentVal ?? ""} readOnly />
            <span className="styled-num-unit">{s.unit}</span>
          </div>
        </div>
      );

      const options = s.options || (s.reverse
        ? Array.from({ length: s.max - s.min + 1 }, (_, k) => s.max - k)
        : Array.from({ length: s.max - s.min + 1 }, (_, k) => k + s.min));

      return (
        <div key={s.key} className="control-row">
          <span className={`control-label${readOnly ? " not-actionable" : ""}`}>{s.label}</span>
          <div className={s.type === "scale" ? "discrete-box-group" : "segmented-toggle-group"}>
            {options.map((opt) => (
              <button
                key={opt}
                disabled
                className={`${s.type === "scale" ? "discrete-btn" : "segmented-btn"} ${currentVal === opt ? "active" : ""}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/* ── Main Component ── */
const InteractableVariables = ({ patientData, thresholds, onChange, activeCategory }) => {
  // Tabs that show the gauge/slider UI
  const isSliderTab = activeCategory === "top" || activeCategory === "cardio";
  const [openGuideline, setOpenGuideline] = useState(null);

  // Map tab id → OTHER_CONFIGS key
  const otherKey = useMemo(() => {
    if (activeCategory === "top")      return null; // handled by isSliderTab
    if (activeCategory === "cardio")   return null;
    if (activeCategory === "metabolic") return "metabolic";
    if (activeCategory === "med")      return "med";
    if (activeCategory === "other")    return "other";
    return null;
  }, [activeCategory]);

  const otherList = otherKey ? OTHER_CONFIGS[otherKey] ?? [] : [];
  const isNonAction = activeCategory === "nonaction";

  const makeUpdater = useCallback((key, min, max) => (handle, raw) => {
    onChange((prev) => {
      const cur  = prev[key] || { low: min, high: max };
      const next = handle === "low"
        ? { ...cur, low:  clamp(raw, min, cur.high - 1) }
        : { ...cur, high: clamp(raw, cur.low + 1, max)  };
      return { ...prev, [key]: next };
    });
  }, [onChange]);

  // If a guideline is open, show it instead of the normal panel content
  if (openGuideline && GUIDELINES[openGuideline]) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <GuidelineOverlay
          data={GUIDELINES[openGuideline]}
          onClose={() => setOpenGuideline(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div className="panel-title">
        {isNonAction ? "Not actionable variables" : "Changeable variables"}
      </div>

      {isSliderTab ? (
        <div className="panel-left-inner">
          {SLIDER_CONFIG.map((s) => {
            const { low = s.min, high = s.max } = thresholds[s.key] || {};
            let displayVal = patientData[s.key] ?? 0;
            if (s.key === "glucose"     && displayVal > 0 && displayVal < 50) displayVal = Number((displayVal * 18.01).toFixed(1));
            if (s.key === "cholesterol" && displayVal > 0 && displayVal < 25) displayVal = Number((displayVal * 38.67).toFixed(1));
            return (
              <GaugeRow
                key={s.key}
                s={s}
                patientVal={displayVal}
                low={low}
                high={high}
                onUpdate={makeUpdater(s.key, s.min, s.max)}
                onGuidelineClick={setOpenGuideline}   // ← new
              />
            );
          })}
        </div>
      ) : (
        <ControlList
          list={otherList}
          patientData={patientData}
          readOnly={isNonAction}
        />
      )}
    </div>
  );
};

export default InteractableVariables;