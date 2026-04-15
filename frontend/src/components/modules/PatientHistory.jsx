import React from "react";

const PatientHistory = () => {
  const data = [
    { label: "Patient ID", value: "#171223" },
    { label: "Age", value: "63" },
    { label: "Gender", value: "Male" },
      { label: "Covid positive", value: "Yes" },
      { label: "Chronic diseases", value: "Diabetes Hyperlipidemia Hypertension" },
      { label: "Medicine before onset", value: "Clopidogrel" },
      { label: "Stroke mimics", value: "Yes" },
      { label: "In-hopistal stroke", value: "No" },
      { label: "Source of bleeding found", value: "Yes" },
      { label: "Previous IS/TIA", value: "Yes" },
      { label: "Previous ICH", value: "Yes" },
      { label: "NIHSS", value: "18" },
      { label: "TICI score", value: "Grade 3" },
      { label: "mRS 2-5", value: "Yes" },

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