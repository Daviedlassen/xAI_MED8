import os
import joblib
import pandas as pd
import numpy as np
import shap
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from routers.trainer_engine import train_dynamic_model

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])
MODEL_DIR = r"C:\Users\Bruger\PycharmProjects\P8Project\backend\model"
CSV_PATH = os.path.join(MODEL_DIR, "dataREanonymized_long.csv")


class PatientData(BaseModel):
    age: float
    nihss_score: float
    prestroke_mrs: int
    sys_blood_pressure: float
    dis_blood_pressure: float
    glucose: float
    cholesterol: float
    thresholds: Dict[str, Any]
    extra_features: Dict[str, Any] = {}


def get_binned_value(val: float, thresh_key: str, thresholds: dict) -> int:
    t = thresholds.get(thresh_key, {})
    low = float(t.get("low", 0))
    high = float(t.get("high", 999))
    if val < low: return 0
    if val <= high: return 1
    return 2


@router.get("/patient/{subject_id}")
async def get_patient_data(subject_id: str):
    try:
        df_long = pd.read_csv(CSV_PATH, low_memory=False)
        df_p = df_long[df_long["subject_id"].astype(str) == str(subject_id)]
        if df_p.empty: raise HTTPException(status_code=404, detail="Patient not found")

        patient_dict = df_p.set_index("variable")["Value"].to_dict()
        for k, v in patient_dict.items():
            try:
                if str(v).lower() not in ["nan", "none"]:
                    patient_dict[k] = float(v)
            except:
                pass
        return {"status": "success", "patient": patient_dict}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/debug/predict_verbose")
async def predict_verbose(data: PatientData):
    try:
        # 1. Retrain and get Suggested Thresholds
        model_path, suggested_t = train_dynamic_model(data.thresholds)
        art = joblib.load(model_path)
        model, features, medians = art["model"], art["features"], art["medians"]

        # 2. Preparation & Unit Handling for current patient
        # If user puts in 7.0 for glucose, we assume mmol/L and convert to ~126 mg/dL
        adj_glucose = data.glucose * 18.01 if data.glucose < 50 else data.glucose
        adj_cholesterol = data.cholesterol * 38.67 if data.cholesterol < 25 else data.cholesterol

        # Build feature row from medians first
        row = {f: medians.get(f, 0.0) for f in features}

        # Overlay with real patient data from the GET request
        for f, v in data.extra_features.items():
            if f in row and v is not None:
                try:
                    row[f] = float(v)
                except:
                    pass

        # Overlay with active UI sliders (Highest Priority)
                # Overlay with active UI sliders (Highest Priority)
                row.update({
                    "age": float(data.age),
                    # CHANGED: Use data.nihss_score (from the slider) instead of static record
                    "nihss_score": float(data.nihss_score),
                    "prestroke_mrs": float(data.prestroke_mrs),

                    # These are binned (0, 1, 2)
                    "sys_blood_pressure": float(get_binned_value(data.sys_blood_pressure, "sys_bp", suggested_t)),
                    "dis_blood_pressure": float(get_binned_value(data.dis_blood_pressure, "dis_bp", suggested_t)),
                    "glucose": float(get_binned_value(adj_glucose, "glucose", suggested_t)),
                    "cholesterol": float(get_binned_value(adj_cholesterol, "cholesterol", suggested_t)),
                })

        df = pd.DataFrame([row])[features]

        # 3. Predict
        prediction = int(model.predict(df)[0])
        proba = model.predict_proba(df)[0]

        # 4. SHAP Logic
        explainer = shap.TreeExplainer(model)
        sv = explainer.shap_values(df)

        # Handle multiclass output (list of arrays)
        target_sv = sv[prediction] if isinstance(sv, list) else sv
        flat_sv = np.array(target_sv).flatten()

        # Format feature names for React DISPLAY_NAMES (Title Case)
        all_shap = {
            feat.replace("_", " ").title(): float(val)
            for feat, val in zip(features, flat_sv)
            if abs(val) > 0.0001
        }

        # Sort and take top 4
        sorted_s = sorted(all_shap.items(), key=lambda x: abs(x[1]), reverse=True)
        top_4 = dict(sorted_s[:4])
        others_list = sorted_s[4:]
        other_sum = float(np.sum([x[1] for x in others_list])) if others_list else 0.0

        return {
            "status": "success",
            "mrs_score": prediction,
            "suggested_thresholds": suggested_t,
            "probabilities": {f"mRS_{i}": round(float(p), 4) for i, p in enumerate(proba)},
            "shap_values": {
                "top": top_4,
                "other_sum": other_sum,
                "all_others": dict(others_list)
            }
        }
    except Exception as e:
        import traceback;
        traceback.print_exc()
        return {"status": "error", "message": str(e)}