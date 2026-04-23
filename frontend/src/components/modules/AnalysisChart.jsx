import React, { useState } from "react";

// Maps the actual backend-formatted names (seen in the UI screenshot) to
// clean clinical labels. Both "Before Onset" and "Discharge" variants are
// covered — they're kept distinguishable with a small suffix so clinicians
// can tell which timepoint drove the prediction.
const DISPLAY_NAMES = {
  // ── Cardiovascular ───────────────────────────────────────────────────────
  "Sys Blood Pressure":                     "BP Systolic",
  "Dis Blood Pressure":                     "BP Diastolic",
  "Bp Systolic":                            "BP Systolic",
  "Bp Diastolic":                           "BP Diastolic",
  "Cholesterol":                            "LDL Cholesterol",
  "Ldl Cholesterol":                        "LDL Cholesterol",
  "Glucose":                                "Glucose",

  // ── Neurological ─────────────────────────────────────────────────────────
  "Hunt Hess":                              "Hunt Hess Scale",
  "Ich Volume":                             "ICH - Volume",
  "Ich Score":                              "ICH - Score",
  "Ivt Count":                              "Number of IVT",
  "Ct Perfusion":                           "CT Perfusion Score",
  "Ct Hypoperfusion":                       "CT Perfusion Hyperperfusion",

  // ── Antiplatelet — Before Onset ──────────────────────────────────────────
  "Before Onset Clopidogrel":               "Clopidogrel",
  "Before Onset Clopidrogel":               "Clopidogrel",          // backend typo guard
  "Before Onset Cilostazol":                "Cilostazol",
  "Before Onset Ticagrelor":                "Ticagrelor",
  "Before Onset Ticlopidine":               "Ticlopidine",
  "Before Onset Prasugrel":                 "Prasugrel",
  "Before Onset Dipyridamol":               "Dipyridamol, Slow Release",
  "Before Onset Antidiabetics":             "Anti Diabetics",
  "Before Onset Anti Diabetics":            "Anti Diabetics",

  // ── Anticoagulants for AF — Before Onset ────────────────────────────────
  "Before Onset Warfarin":                  "Warfarin for AF",
  "Before Onset Edoxaban":                  "Edoxaban for AF",
  "Before Onset Apixaban":                  "Apixaban for AF",
  "Before Onset Rivoroxaban":               "Rivaroxaban for AF",
  "Before Onset Rivaroxaban":               "Rivaroxaban for AF",
  "Before Onset Dabigatran":                "Dabigatran for AF",
  "Before Onset Heparin":                   "Low Mol. Weight Heparin / Heparin for AF",

  // ── Antiplatelet — Discharge ─────────────────────────────────────────────
  "Discharge Clopidogrel":                  "Clopidogrel (Discharge)",
  "Discharge Clopidrogel":                  "Clopidogrel (Discharge)",
  "Discharge Cilostazol":                   "Cilostazol (Discharge)",
  "Discharge Ticagrelor":                   "Ticagrelor (Discharge)",
  "Discharge Ticlopidine":                  "Ticlopidine (Discharge)",
  "Discharge Prasugrel":                    "Prasugrel (Discharge)",
  "Discharge Dipyridamol":                  "Dipyridamol, Slow Release (Discharge)",
  "Discharge Antidiabetics":                "Anti Diabetics (Discharge)",
  "Discharge Anti Diabetics":               "Anti Diabetics (Discharge)",

  // ── Anticoagulants for AF — Discharge ────────────────────────────────────
  "Discharge Warfarin":                     "Warfarin for AF (Discharge)",
  "Discharge Edoxaban":                     "Edoxaban for AF (Discharge)",
  "Discharge Apixaban":                     "Apixaban for AF (Discharge)",
  "Discharge Rivoroxaban":                  "Rivaroxaban for AF (Discharge)",
  "Discharge Rivaroxaban":                  "Rivaroxaban for AF (Discharge)",
  "Discharge Dabigatran":                   "Dabigatran for AF (Discharge)",
  "Discharge Heparin":                      "Low Mol. Weight Heparin / Heparin for AF (Discharge)",

  // ── Lifestyle / other ────────────────────────────────────────────────────
  "Active Smoker":                          "Active Smoker",
  "Physio 72H":                             "Physiotherapy ≤ 72h After",

  // ── Core patient metrics ─────────────────────────────────────────────────
  "Age":                                    "Age",
  "Nihss Score":                            "NIHSS Score",
  "Prestroke Mrs":                          "Pre-Stroke mRS",
};

const formatName = (raw) => DISPLAY_NAMES[raw] ?? raw;

const AnalysisChart = ({ shapData, loading }) => {
  const [showOthers, setShowOthers] = useState(false);
  const { top = {}, other_sum = 0, all_others = {} } = shapData || {};

  const allValues = [
    ...Object.values(top),
    other_sum,
    ...Object.values(all_others),
  ].map(v => Math.abs(Number(v)));

  const maxVal = allValues.length > 0 ? Math.max(...allValues) * 1.1 : 1;

  const renderShapRow = (rawName, value, isOther = false) => {
    const isPos = value > 0;
    const barWidthPercent = (Math.abs(value) / maxVal) * 50;
    const displayName = formatName(rawName);

    return (
      <div className={`shap-row-new ${isOther ? "is-other-item" : ""}`} key={rawName} style={{ alignSelf: 'stretch' }}>
        <div className="shap-label-column" title={displayName}>
          {displayName}
        </div>
        <div className="shap-track-column">
          <div
            className={`bar-fill ${isPos ? "pos" : "neg"}`}
            style={{
              width: `${barWidthPercent}%`,
              [isPos ? "left" : "right"]: "50%",
            }}
          >
            <span className={`bar-val-text ${isPos ? "val-pos" : "val-neg"}`}>
              {isPos ? `+${value.toFixed(3)}` : value.toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="shap-viz-container loading-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      <h2 className="clinical-title" style={{ marginBottom: '10px' }}>Feature Impact (SHAP)</h2>

      {/* This container ensures content starts at the very top */}
      <div className={`shap-grid-body ${loading ? "content-loading-blur" : ""}`} style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // Forces items to the top
        alignItems: 'stretch',        // Ensures bars take full width
        position: 'relative',
        flex: 1,                      // Fills the remaining space
        paddingTop: '5px'             // Small nudge from the title
      }}>
        <div className="vertical-axis-line" />

        {/* Impact Rows */}
        {Object.entries(top).map(([name, value]) => renderShapRow(name, value))}

        {/* Other Factors Toggle */}
        <div
          className="shap-row-new other-summary-row"
          onClick={() => setShowOthers(!showOthers)}
          style={{ cursor: "pointer", borderTop: '1px solid #eee' }}
        >
          <div className="shap-label-column summary-label">
            Other Factors {showOthers ? "▲" : "▼"}
          </div>
          <div className="shap-track-column">
            <div
              className={`bar-fill ${other_sum > 0 ? "pos" : "neg"}`}
              style={{
                opacity: 0.6,
                width: `${(Math.abs(other_sum) / maxVal) * 50}%`,
                [other_sum > 0 ? "left" : "right"]: "50%",
              }}
            >
              <span className={`bar-val-text ${other_sum > 0 ? "val-pos" : "val-neg"}`}>
                {other_sum.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {showOthers && (
          <div className="others-expanded-list">
            {Object.entries(all_others).map(([name, value]) =>
              renderShapRow(name, value, true)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisChart;
