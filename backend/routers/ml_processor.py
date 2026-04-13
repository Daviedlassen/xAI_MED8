import os
import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

# --- DYNAMIC PATH LOGIC (Cross-Platform) ---
# 1. Get the directory of this file (backend/routers)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Build path: Up one level to 'backend', then into 'model'
# Added normalization to handle different OS slash directions properly
BACKEND_DIR = os.path.dirname(BASE_DIR)
# IMPORTANT: Casing must match exactly for Mac (Capital B in XGBoost)
FILENAME = "XGBoostOrdinal_20260406_112345.pkl"
MODEL_PATH = os.path.normpath(os.path.join(BACKEND_DIR, "model", FILENAME))

# LOAD MODEL
try:
    if os.path.exists(MODEL_PATH):
        ml_model = joblib.load(MODEL_PATH)
        print(f"✅ Model Loaded from: {MODEL_PATH}")
    else:
        # If it fails, this print tells the Mac user exactly what path was attempted
        print(f"❌ Model file NOT found at: {MODEL_PATH}")
        ml_model = None
except Exception as e:
    print(f"❌ Load Error: {e}")
    ml_model = None


class PatientData(BaseModel):
    age: float
    nihss_score: float
    prestroke_mrs: int
    sys_blood_pressure: float
    dis_blood_pressure: float
    glucose: float
    cholesterol: float


@router.post("/predict_mrs")
async def predict_mrs(data: PatientData):
    print(f"🔥 INCOMING PREDICTION: Age={data.age}, NIHSS={data.nihss_score}")

    if not ml_model:
        raise HTTPException(
            status_code=500,
            detail=f"Machine Learning model not loaded. Searched path: {MODEL_PATH}"
        )

    try:
        # Full feature list - ensuring exact match with model training
        payload = {
            "age": data.age, "before_onset_antidiabetics": 0, "before_onset_cilostazol": 0,
            "before_onset_clopidrogel": 0, "before_onset_dipyridamol": 0, "before_onset_prasugrel": 0,
            "before_onset_ticagrelor": 0, "before_onset_ticlopidine": 0, "before_onset_warfarin": 0,
            "cholesterol": data.cholesterol, "covid_test": 0, "dis_blood_pressure": data.dis_blood_pressure,
            "discharge_antidiabetics": 0, "discharge_apixaban": 0, "discharge_cilostazol": 0,
            "discharge_clopidrogel": 0, "discharge_dabigatran": 0, "discharge_dipyridamol": 0,
            "discharge_edoxaban": 0, "discharge_heparin": 0, "discharge_nihss_score": 0.0,
            "discharge_prasugrel": 0, "discharge_rivaroxaban": 0, "discharge_ticagrelor": 0,
            "discharge_ticlopidine": 0, "discharge_warfarin": 0, "door_to_imaging": 0.0,
            "door_to_needle": 0.0, "glucose": data.glucose, "hospital_stroke": 0,
            "hypoperfusion_core": 0.0, "imaging_done": 1, "nihss_score": data.nihss_score,
            "occup_physiotherapy_received": 0, "onset_to_door": 0.0, "perfusion_core": 0.0,
            "physiotherapy_start_within_3days": 0, "prenotification": 0, "prestroke_mrs": data.prestroke_mrs,
            "risk_congestive_heart_failure": 0, "risk_coronary_artery_disease_or_myocardial_infarction": 0,
            "risk_diabetes": 0, "risk_hiv": 0, "risk_hyperlipidemia": 0, "risk_hypertension": 0,
            "risk_previous_hemorrhagic_stroke": 0, "risk_previous_ischemic_stroke": 0,
            "risk_smoker": 0, "sys_blood_pressure": data.sys_blood_pressure, "tici_score": 0.0
        }

        df = pd.DataFrame([payload])

        # Support for single models or ordinal ensembles (dictionaries)
        if isinstance(ml_model, dict):
            res = sum(int(ml_model[i].predict(df)[0]) for i in range(len(ml_model)))
        else:
            res = int(ml_model.predict(df)[0])

        return {"status": "success", "mrs_score": res}

    except Exception as e:
        print(f"❌ Prediction Error: {e}")
        return {"status": "error", "message": str(e)}