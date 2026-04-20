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


class PatientData(BaseModel):
    age: float
    nihss_score: float
    prestroke_mrs: int
    sys_blood_pressure: float
    dis_blood_pressure: float
    glucose: float
    cholesterol: float
    thresholds: Dict[str, Any]


def get_binned_value(val: float, key: str, thresholds: dict) -> int:
    """
    Bin a continuous value into 0 / 1 / 2 using the user-supplied thresholds.

    The threshold dict sent by the frontend uses camelCase-style keys:
        { "sys_bp": {"low": 110, "high": 220}, "glucose": {...}, ... }

    The map below converts those frontend keys to their backend equivalents
    so both sides stay in sync.
    """
    # Frontend key  →  threshold dict key (what JS sends)
    FRONTEND_KEY_MAP = {
        "sys_blood_pressure": "sys_bp",
        "dis_blood_pressure": "dis_bp",
        "glucose":            "glucose",
        "cholesterol":        "cholesterol",
    }
    thresh_key = FRONTEND_KEY_MAP.get(key, key)
    t = thresholds.get(thresh_key, {})

    low  = float(t.get("low",  0))
    high = float(t.get("high", 999))

    if val < low:
        return 0
    if val <= high:
        return 1
    return 2


@router.post("/predict_mrs")
async def predict_mrs(data: PatientData):
    try:
        # ── 1. Retrain model with updated threshold boundaries
        print(f"[predict_mrs] Received thresholds: {data.thresholds}")
        train_dynamic_model(data.thresholds)

        # ── 2. Load fresh model artefact
        model_path = os.path.join(MODEL_DIR, "live_model.pkl")
        if not os.path.exists(model_path):
            raise HTTPException(status_code=500, detail="live_model.pkl was not created by trainer")

        artefact = joblib.load(model_path)
        model    = artefact["model"]
        features = artefact["features"]
        medians  = artefact.get("medians", {})

        # ── 3. Build patient feature row
        #    Start with training-set medians so every feature has a value,
        #    then overwrite with the actual patient values we know.
        row = {f: medians.get(f, 0.0) for f in features}

        # Continuous features → binned exactly as training did
        row.update({
            "age":                data.age,
            "nihss_score":        data.nihss_score,
            "prestroke_mrs":      data.prestroke_mrs,
            "sys_blood_pressure": get_binned_value(data.sys_blood_pressure, "sys_blood_pressure", data.thresholds),
            "dis_blood_pressure": get_binned_value(data.dis_blood_pressure, "dis_blood_pressure", data.thresholds),
            "glucose":            get_binned_value(data.glucose,            "glucose",            data.thresholds),
            "cholesterol":        get_binned_value(data.cholesterol,        "cholesterol",        data.thresholds),
        })

        # Debug: show binned patient values
        print(f"[predict_mrs] Binned patient values → "
              f"sys_bp={row['sys_blood_pressure']}  "
              f"dis_bp={row['dis_blood_pressure']}  "
              f"glucose={row['glucose']}  "
              f"cholesterol={row['cholesterol']}")

        df = pd.DataFrame([row])[features]

        # ── 4. Predict
        prediction = int(model.predict(df)[0])
        print(f"[predict_mrs] Predicted mRS: {prediction}")

        # ── 5. SHAP
        explainer  = shap.TreeExplainer(model)
        sv_output  = explainer.shap_values(df)

        # sv_output is a list (one array per class) for multiclass XGBoost
        if isinstance(sv_output, list):
            target_sv = sv_output[prediction]
        else:
            target_sv = sv_output

        flat_sv = np.array(target_sv).flatten()

        # ── 6. Format SHAP: title-case display names, drop near-zero values
        all_shap = {
            feat.replace("_", " ").title(): float(val)
            for feat, val in zip(features, flat_sv)
            if abs(val) > 0.0001
        }

        sorted_shap = sorted(all_shap.items(), key=lambda x: abs(x[1]), reverse=True)
        top_4  = dict(sorted_shap[:4])
        others = dict(sorted_shap[4:])
        other_sum = float(np.sum(list(others.values()))) if others else 0.0

        return {
            "status":    "success",
            "mrs_score": prediction,
            "shap_values": {
                "top":        top_4,
                "other_sum":  other_sum,
                "all_others": others,
            },
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}