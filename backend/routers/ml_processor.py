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

class PatientState(BaseModel):
    bpSystolic: float
    glucose: float
    physioTime: float
    ldl: float


@router.post("/predict")
async def predict_outcome(data: PatientState):
    # mRS logic: 0 is best (No symptoms), 6 is worst (Dead).
    # We start with a baseline "Moderate Disability" (mRS 3)
    base_mrs = 3.0

    # Positive values here INCREASE the mRS (make it worse/more red)
    # Negative values here DECREASE the mRS (make it better/more green)

    # High BP (>120) increases disability score
    impact_bp = (data.bpSystolic - 120) * 0.05

    # High Glucose (>110) increases disability score
    impact_glucose = (data.glucose - 110) * 0.02

    # DELAYED Physio (>24hrs) increases disability score
    impact_physio = (data.physioTime - 24) * 0.03

    # High LDL (>3.0) increases disability score
    impact_ldl = (data.ldl - 3.0) * 0.2

    # Calculate raw mRS
    raw_score = base_mrs + impact_bp + impact_glucose + impact_physio + impact_ldl

    # Clamp the score strictly between 0 and 6
    final_mrs = max(0, min(6, raw_score))

    return {
        "recoveryScore": round(final_mrs, 1),
        "impacts": [
            # Note: We invert the 'value' for the SHAP bars
            # so that 'Better' results push the bar LEFT (negative)
            # and 'Worse' results push the bar RIGHT (positive).
            {"feature": "BP Systolic", "value": round(impact_bp, 2)},
            {"feature": "Glucose", "value": round(impact_glucose, 2)},
            {"feature": "Physio Initiation", "value": round(impact_physio, 2)},
            {"feature": "LDL Cholesterol", "value": round(impact_ldl, 2)},
        ]
    }