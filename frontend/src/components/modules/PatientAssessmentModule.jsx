import React, { useState, useEffect, useCallback } from 'react';
import InteractableVariables from './InteractableVariables';
import RiskScore from './RiskScore';
import AnalysisChart from './AnalysisChart';

const PatientAssessmentModule = () => {
  const [patientData, setPatientData] = useState({
    nihss: 5, age: 65, glucose: 110, prestroke_mrs: 0,
    sys_bp: 140, dis_bp: 90, cholesterol: 200
  });

  const [thresholds, setThresholds] = useState({
    sys_bp: { low: 110, high: 220 },
    dis_bp: { low: 70, high: 110 },
    glucose: { low: 60, high: 140 },
    cholesterol: { low: 100, high: 190 }
  });

  const [mrsScore, setMrsScore] = useState(0);
  const [shapData, setShapData] = useState({ top: {}, other_sum: 0, all_others: {} });
  const [loading, setLoading] = useState(false);

  const fetchPrediction = useCallback(async () => {
    console.log("🚀 fetchPrediction TRIGGERED"); // DEBUG LOG
    setLoading(true);

    const payload = {
      age: patientData.age,
      nihss_score: patientData.nihss,
      prestroke_mrs: patientData.prestroke_mrs,
      sys_blood_pressure: patientData.sys_bp,
      dis_blood_pressure: patientData.dis_bp,
      glucose: patientData.glucose,
      cholesterol: patientData.cholesterol,
      thresholds: thresholds
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ml/predict_mrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("✅ Backend Response:", data); // DEBUG LOG

      if (data.status === 'success') {
  setMrsScore(data.mrs_score);
  setShapData(data.shap_values);
}
    } catch (err) {
      console.error("❌ API Fetch Failed:", err);
    } finally {
      setLoading(false);
    }
  }, [patientData, thresholds]);

  useEffect(() => {
    console.log("⏱️ Debounce Timer Started (State Changed)"); // DEBUG LOG
    const timer = setTimeout(() => fetchPrediction(), 300);
    return () => clearTimeout(timer);
  }, [fetchPrediction]);

  return (
    <div className="assessment-container">
      <InteractableVariables
        patientData={patientData}
        thresholds={thresholds}
        onChange={(updaterOrValue) => {
  setThresholds(prev =>
    typeof updaterOrValue === 'function'
      ? updaterOrValue(prev)
      : updaterOrValue
  );
}}
        onPatientChange={setPatientData}
        activeCategory="cardio"
      />
      <RiskScore score={mrsScore} loading={loading} />
      <AnalysisChart shapData={shapData} />
    </div>
  );
};

export default PatientAssessmentModule;