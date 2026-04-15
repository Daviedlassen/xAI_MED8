import React from "react";

const PatientHistory = () => {
  const data = [
    { label: "Patient ID", value: "#171223" },
    { label: "Age", value: "63" },
    { label: "Gender", value: "Male" },
    { label: "Chronic diseases", value: "Diabetes, Hypertension" },
    { label: "Medicin before onset", value: "Clopidogrel" },
    { label: "NIHSS", value: "18" },
  ];

  return (
    <div className="clinical-header-grid">
      {data.map((item, idx) => (
        <div key={idx} className="header-stat">
          <span className="stat-label"> {item.label}:</span>
          <span className="stat-value"> {item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default PatientHistory;