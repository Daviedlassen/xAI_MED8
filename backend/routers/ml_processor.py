#ml_processor.py

import pandas as pd
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/ml",
    tags=["Machine Learning"]
)

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))

    # --- THE FIX IS HERE ---
    # Replace NaN values with None (which JSON turns into 'null')
    # or an empty string ""
    df = df.fillna("")
    # -----------------------

    return {
        "columns": df.columns.tolist(),
        "preview": df.head(3).to_dict(orient="records")
    }


# ml_processor.py

# ... (keep your imports and upload-csv router the same) ...

from pydantic import BaseModel

class PatientState(BaseModel):
    # These MUST match the keys in your React useState exactly
    sys_blood_pressure: float
    dis_blood_pressure: float
    glucose: float
    cholesterol: float
    age: float
    nihss_score: float
    discharge_nihss_score: float
    prestroke_mrs: float
    tici_score: float
    perfusion_core: float
    hypoperfusion_core: float
    risk_smoker: bool
    risk_diabetes: bool
    risk_hypertension: bool
    risk_hyperlipidemia: bool
    risk_congestive_heart_failure: bool
    risk_coronary_artery_disease_or_myocardial_infarction: bool
    risk_hiv: bool
    risk_previous_hemorrhagic_stroke: bool
    risk_previous_ischemic_stroke: bool
    covid_test: bool
    hospital_stroke: bool
    imaging_done: bool
    # Add more from your list as needed...
    door_to_imaging: float
    door_to_needle: float
    onset_to_door: float
    prenotification: bool
    physiotherapy_start_within_3days: bool
    occup_physiotherapy_received: bool


@router.post("/predict")
async def predict_outcome(data: PatientState):
    base_mrs = 3.0

    # FIX: Change data.bpSystolic to data.sys_blood_pressure
    impact_bp = (data.sys_blood_pressure - 120) * 0.05

    # FIX: Change timing to use door_to_needle
    impact_timing = (data.door_to_needle - 60) * 0.02

    # FIX: Change data.nihss to data.nihss_score
    impact_nihss = (data.nihss_score - 10) * 0.1

    # FIX: Change data.ldl to data.cholesterol
    impact_chol = (data.cholesterol - 3.5) * 0.1

    raw_score = base_mrs + impact_bp + impact_timing + impact_nihss + impact_chol

    # Binary risks
    if data.risk_smoker: raw_score += 0.4
    if data.risk_diabetes: raw_score += 0.5

    final_score = max(0, min(6, raw_score))

    return {
        "recoveryScore": round(final_score, 1),
        "impacts": [
            {"feature": "Blood Pressure", "value": round(impact_bp, 2)},
            {"feature": "Treatment Window", "value": round(impact_timing, 2)},
            {"feature": "NIHSS Severity", "value": round(impact_nihss, 2)},
            {"feature": "Cholesterol", "value": round(impact_chol, 2)}
        ]
    }