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
CSV_PATH  = os.path.join(MODEL_DIR, "dataREanonymized_long.csv")

ORDINAL_THRESHOLDS = [0, 1, 2, 3, 4, 5]


class PatientData(BaseModel):
    age:                float
    nihss_score:        float
    prestroke_mrs:      int
    sys_blood_pressure: float
    dis_blood_pressure: float
    glucose:            float
    cholesterol:        float
    thresholds:         Dict[str, Any]
    extra_features:     Dict[str, Any] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_binned_value(val: float, thresh_key: str, thresholds: dict, single: bool = False) -> float:
    t    = thresholds.get(thresh_key, {})
    low  = float(t.get("low",  0))
    high = float(t.get("high", 999))
    if single:
        return 1.0 if val > high else 0.0
    if val < low:   return 0.0
    if val <= high: return 1.0
    return 2.0


def ordinal_predict(models: dict, df_row: pd.DataFrame) -> tuple:
    raw_probs = np.array([
        models[t].predict_proba(df_row)[0][1]
        for t in ORDINAL_THRESHOLDS
    ])

    # Enforce monotonicity: P(mRS > t) must be >= P(mRS > t+1)
    raw_probs = np.maximum.accumulate(raw_probs[::-1])[::-1]

    class_probs    = np.zeros(7)
    class_probs[0] = 1.0 - raw_probs[0]
    for i in range(1, 6):
        class_probs[i] = raw_probs[i - 1] - raw_probs[i]
    class_probs[6] = raw_probs[5]

    class_probs = np.clip(class_probs, 0, 1)
    class_probs /= class_probs.sum()

    return int(np.argmax(class_probs)), class_probs, raw_probs


def aggregate_shap_ordinal(
    models: dict,
    df_row: pd.DataFrame,
    features: list,
    raw_probs: np.ndarray,
) -> dict:
    """
    Aggregate SHAP values across all 6 binary ordinal models.

    Each model t explains P(mRS > t).  We weight model t's SHAP vector by
    how "decisive" that cut-point is for the final prediction:

        decisiveness[t] = |P(mRS > t) − 0.5|

    A model whose probability is near 0.5 is the active decision boundary;
    one near 0 or 1 has already settled and contributes little.
    Weights are normalised to sum to 1 before aggregation.

    Sign convention is preserved: positive SHAP → pushes toward higher mRS,
    negative SHAP → pushes toward lower mRS, consistent across all models
    because all models predict P(mRS > t) in the same direction.
    """
    shap_matrix = np.zeros((len(ORDINAL_THRESHOLDS), len(features)))

    for i, t in enumerate(ORDINAL_THRESHOLDS):
        explainer = shap.TreeExplainer(models[t])
        sv = explainer.shap_values(df_row)
        # TreeExplainer binary: returns array of shape (1, n_features)
        shap_matrix[i] = np.array(sv).flatten()[:len(features)]

    decisiveness = np.abs(raw_probs - 0.5)
    weights = decisiveness / decisiveness.sum() if decisiveness.sum() > 0 else np.ones(6) / 6

    aggregated = (shap_matrix * weights[:, np.newaxis]).sum(axis=0)

    return {
        feat.replace("_", " ").title(): float(val)
        for feat, val in zip(features, aggregated)
        if abs(val) > 0.0001
    }


def _load_csv() -> pd.DataFrame:
    """Load CSV and normalise column names to lowercase."""
    df = pd.read_csv(CSV_PATH, low_memory=False)
    df.columns = df.columns.str.strip()
    return df


def _detect_columns(df: pd.DataFrame) -> tuple[str, str, str]:
    """
    Return (subject_col, variable_col, value_col) by sniffing column names.
    The CSV is in long format so we look for the obvious candidates.
    """
    cols_lower = {c.lower(): c for c in df.columns}

    subject_col  = cols_lower.get("subject_id",  cols_lower.get("patientid",  "subject_id"))
    variable_col = cols_lower.get("variable",     cols_lower.get("feature",    "variable"))
    value_col    = cols_lower.get("value",        cols_lower.get("val",        "Value"))

    return subject_col, variable_col, value_col


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/patient/{subject_id}")
async def get_patient_data(subject_id: str):
    """
    Fetch all variables for a single patient from the long-format CSV.

    Common 404 causes fixed here:
      1. subject_id stored as int in CSV → compare as string on both sides
      2. 'Value' column capitalisation varies → sniffed dynamically
      3. Trailing whitespace in column names → stripped on load
    """
    try:
        df = _load_csv()
        sub_col, var_col, val_col = _detect_columns(df)

        # Normalise both sides to string for comparison
        mask = df[sub_col].astype(str).str.strip() == str(subject_id).strip()
        df_p = df[mask]

        if df_p.empty:
            # Return available IDs to help debug without crashing the frontend
            available = df[sub_col].astype(str).unique()[:10].tolist()
            raise HTTPException(
                status_code=404,
                detail=f"Patient '{subject_id}' not found. Sample IDs: {available}",
            )

        patient_dict: dict = {}
        for _, row in df_p[[var_col, val_col]].iterrows():
            key = str(row[var_col])
            val = row[val_col]
            try:
                if str(val).lower() not in ("nan", "none", ""):
                    patient_dict[key] = float(val)
                else:
                    patient_dict[key] = None
            except (ValueError, TypeError):
                patient_dict[key] = str(val)

        return {"status": "success", "patient": patient_dict}

    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/predict_mrs")
async def predict_mrs(data: PatientData):
    try:
        # 1. Retrain & capture effective thresholds
        model_path, suggested_t = train_dynamic_model(data.thresholds)
        art = joblib.load(model_path)
        models, features, medians = art["models"], art["features"], art["medians"]

        # 2. Unit normalisation
        adj_glucose     = data.glucose     * 18.01 if data.glucose     < 50 else data.glucose
        adj_cholesterol = data.cholesterol * 38.67 if data.cholesterol < 25 else data.cholesterol

        # 3. Feature row — medians → patient record → UI sliders
        row = {f: medians.get(f, 0.0) for f in features}

        for f, v in data.extra_features.items():
            if f in row and v is not None:
                try:
                    row[f] = float(v)
                except Exception:
                    pass

        row.update({
            "age":                float(data.age),
            "nihss_score":        float(data.nihss_score),
            "prestroke_mrs":      float(data.prestroke_mrs),
            "sys_blood_pressure": get_binned_value(data.sys_blood_pressure, "sys_bp",     suggested_t),
            "dis_blood_pressure": get_binned_value(data.dis_blood_pressure, "dis_bp",     suggested_t, single=True),
            "glucose":            get_binned_value(adj_glucose,             "glucose",    suggested_t),
            "cholesterol":        get_binned_value(adj_cholesterol,         "cholesterol", suggested_t),
        })

        df = pd.DataFrame([row])[features]

        # 4. Ordinal prediction
        prediction, class_probs, raw_probs = ordinal_predict(models, df)

        # 5. Aggregated SHAP
        all_shap = aggregate_shap_ordinal(models, df, features, raw_probs)

        sorted_s    = sorted(all_shap.items(), key=lambda x: abs(x[1]), reverse=True)
        top_4       = dict(sorted_s[:4])
        others_list = sorted_s[4:]
        other_sum   = float(np.sum([x[1] for x in others_list])) if others_list else 0.0

        return {
            "status":               "success",
            "mrs_score":            prediction,
            "suggested_thresholds": suggested_t,
            "probabilities":        {f"mRS_{i}": round(float(p), 4) for i, p in enumerate(class_probs)},
            "shap_values": {
                "top":        top_4,
                "other_sum":  other_sum,
                "all_others": dict(others_list),
            },
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}