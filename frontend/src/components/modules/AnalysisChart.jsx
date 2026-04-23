import React, { useState } from "react";

const DISPLAY_NAMES = {
  "Sys Blood Pressure": "BP Systolic",
  "Dis Blood Pressure": "BP Diastolic",
  "Cholesterol":        "LDL Cholesterol",
  "Glucose":            "Glucose",
  "Hunt Hess":          "Hunt Hess Scale",
  "Ich Volume":         "ICH Volume",
  "Ich Score":          "ICH Score",
  "Ivt Count":          "No. of IVT",
  "Age":                "Age",
  "Nihss Score":        "NIHSS Score",
  "Prestroke Mrs":      "Pre-Stroke mRS",
  "Before Onset Clopidogrel":  "Clopidogrel",
  "Before Onset Clopidrogel":  "Clopidogrel",
  "Before Onset Warfarin":     "Warfarin for AF",
  "Before Onset Antidiabetics":"Anti Diabetics",
  "Discharge Clopidogrel":     "Clopidogrel (Dc)",
  "Discharge Warfarin":        "Warfarin for AF (Dc)",
  "Active Smoker":      "Active Smoker",
  "Physio 72H":         "Physiotherapy ≤72h",
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

  const renderRow = (rawName, value, isOther = false) => {
    const isPos = value > 0;
    const barW  = (Math.abs(value) / maxVal) * 50;

    return (
      <div className={`shap-row-new ${isOther ? "is-other-item" : ""}`} key={rawName}>
        <div className="shap-label-column" title={formatName(rawName)}>
          {formatName(rawName)}
        </div>
        <div className="shap-track-column">
          <div
            className={`bar-fill ${isPos ? "pos" : "neg"}`}
            style={{ width: `${barW}%`, [isPos ? "left" : "right"]: "50%" }}
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div className="panel-title" style={{ flexShrink: 0 }}>Feature Impact (SHAP)</div>

      <div className={`shap-inner ${loading ? "content-loading-blur" : ""}`}>
        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}

        <div className="shap-axis-container">
          <div className="vertical-axis-line" />

          {Object.entries(top).map(([name, value]) => renderRow(name, value))}

          <div
            className="shap-row-new other-summary-row"
            onClick={() => setShowOthers(!showOthers)}
          >
            <div className="shap-label-column summary-label">
              Other Factors {showOthers ? "▲" : "▼"}
            </div>
            <div className="shap-track-column">
              <div
                className={`bar-fill ${other_sum > 0 ? "pos" : "neg"}`}
                style={{
                  opacity: 0.55,
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
              {Object.entries(all_others).map(([name, value]) => renderRow(name, value, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisChart;