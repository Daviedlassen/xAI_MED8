/*push*/
import React from "react";

const PatientHistory = ({ rows = [] }) => {
  return (
    <div className="clinical-header-grid">
      {rows.map((item, idx) => (
        <div key={idx} className="header-stat">
          <span className="stat-label">{item.label}:</span>
          <span className="stat-value"> {item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default PatientHistory;