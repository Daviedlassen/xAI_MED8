import pandas as pd
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/ml",
    tags=["Machine Learning"]
)

class PatientState(BaseModel):
    # Required fields (sent by React)
    sys_blood_pressure: float
    dis_blood_pressure: float
    glucose: float
    cholesterol: float
    nihss_score: float
    door_to_needle: float
    risk_smoker: bool
    risk_diabetes: bool

    # Optional fields (Defaults provided to prevent 422 error)
    age: float = 65.0
    discharge_nihss_score: float = 0.0
    prestroke_mrs: float = 0.0
    tici_score: float = 3.0
    perfusion_core: float = 0.0
    hypoperfusion_core: float = 0.0
    risk_hypertension: bool = False
    risk_hyperlipidemia: bool = False
    risk_congestive_heart_failure: bool = False
    risk_coronary_artery_disease_or_myocardial_infarction: bool = False
    risk_hiv: bool = False
    risk_previous_hemorrhagic_stroke: bool = False
    risk_previous_ischemic_stroke: bool = False
    covid_test: bool = False
    hospital_stroke: bool = False
    imaging_done: bool = True
    door_to_imaging: float = 20.0
    onset_to_door: float = 60.0
    prenotification: bool = False
    physiotherapy_start_within_3days: bool = True
    occup_physiotherapy_received: bool = True


@router.post("/predict")
async def predict_outcome(data: PatientState):
    base_mrs = 3.0

    # Calculate impacts
    impact_bp = (data.sys_blood_pressure - 120) * 0.05
    impact_timing = (data.door_to_needle - 60) * 0.02
    impact_nihss = (data.nihss_score - 10) * 0.1
    impact_chol = (data.cholesterol - 3.5) * 0.1

    raw_score = base_mrs + impact_bp + impact_timing + impact_nihss + impact_chol

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