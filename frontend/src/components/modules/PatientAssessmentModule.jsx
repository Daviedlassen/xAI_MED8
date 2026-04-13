import React, { useState, useEffect, useCallback } from 'react';
import InteractableVariables from './InteractableVariables';
import RiskScore from './RiskScore';

const PatientAssessmentModule = () => {
  const [values, setValues] = useState({
    nihss: 5,
    age: 65,
    glucose: 110,
    prestroke_mrs: 0,
    sys_bp: 140,
    dis_bp: 90,
    cholesterol: 200
  });

  const [mrsScore, setMrsScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPrediction = useCallback(async (v) => {
    setLoading(true);
    console.log("📡 Sending data to backend:", v);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ml/predict_mrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: v.age,
          nihss_score: v.nihss,
          prestroke_mrs: v.prestroke_mrs,
          sys_blood_pressure: v.sys_bp,
          dis_blood_pressure: v.dis_bp,
          glucose: v.glucose,
          cholesterol: v.cholesterol
        })
      });

      if (!response.ok) throw new Error("Backend unreachable");

      const data = await response.json();
      if (data.status === 'success') {
        setMrsScore(data.mrs_score);
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce API calls (wait 300ms after slider stops)
  useEffect(() => {
    const timer = setTimeout(() => fetchPrediction(values), 300);
    return () => clearTimeout(timer);
  }, [values, fetchPrediction]);

  return (
    <div className="assessment-container" style={{ display: 'flex', gap: '30px', padding: '20px' }}>
      <InteractableVariables values={values} onChange={setValues} />
      <RiskScore score={mrsScore} loading={loading} />
    </div>
  );
};

export default PatientAssessmentModule;