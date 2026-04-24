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

def _safe(val):
    """Convert any value to JSON-safe Python primitive."""
    if val is None:
        return None
    if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
        return None
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return None if np.isnan(val) else float(val)
    return val


def get_binned_value(val: float, thresh_key: str, thresholds: dict, single: bool = False) -> float:
    t    = thresholds.get(thresh_key, {})
    low  = float(t.get("low",  0))
    high = float(t.get("high", 999))
    if single:
        return 1.0 if val > high else 0.0
    if val < low:   return 0.0
    if val <= high: return 1.0
    return 2.0


def _load_csv() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH, low_memory=False)
    df.columns = df.columns.str.strip()
    return df


def _detect_columns(df: pd.DataFrame) -> tuple[str, str, str]:
    cols_lower = {c.lower(): c for c in df.columns}
    subject_col  = cols_lower.get("subject_id",  cols_lower.get("patientid",  "subject_id"))
    variable_col = cols_lower.get("variable",     cols_lower.get("feature",    "variable"))
    value_col    = cols_lower.get("value",        cols_lower.get("val",        "Value"))
    return subject_col, variable_col, value_col


def ordinal_predict(models: dict, df_row: pd.DataFrame) -> tuple:
    raw_probs = np.array([
        models[t].predict_proba(df_row)[0][1]
        for t in ORDINAL_THRESHOLDS
    ])
    raw_probs   = np.maximum.accumulate(raw_probs[::-1])[::-1]
    class_probs = np.zeros(7)
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
    shap_matrix = np.zeros((len(ORDINAL_THRESHOLDS), len(features)))
    for i, t in enumerate(ORDINAL_THRESHOLDS):
        explainer = shap.TreeExplainer(models[t])
        sv = explainer.shap_values(df_row)
        shap_matrix[i] = np.array(sv).flatten()[:len(features)]

    decisiveness = np.abs(raw_probs - 0.5)
    weights = decisiveness / decisiveness.sum() if decisiveness.sum() > 0 else np.ones(6) / 6
    aggregated = (shap_matrix * weights[:, np.newaxis]).sum(axis=0)

    return {
        feat.replace("_", " ").title(): float(val)
        for feat, val in zip(features, aggregated)
        if abs(val) > 0.0001
    }


# ── Model cache ───────────────────────────────────────────────────────────────

_MODEL_CACHE: dict | None = None
_CACHE_KEY:   str  | None = None
_ARTIFACT:    dict | None = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/debug/csv")
async def debug_csv():
    df = _load_csv()
    sub_col, var_col, val_col = _detect_columns(df)
    return {
        "columns":    df.columns.tolist(),
        "detected":   {"subject": sub_col, "variable": var_col, "value": val_col},
        "sample_ids": df[sub_col].astype(str).unique()[:10].tolist(),
        "row_count":  len(df),
    }


@router.get("/debug/patient-vars")
async def debug_patient_vars():
    df = _load_csv()
    sub_col, var_col, val_col = _detect_columns(df)
    sample_id = df[sub_col].astype(str).iloc[0]
    mask = df[sub_col].astype(str) == sample_id
    rows = df[mask][[var_col, val_col]].copy()

    # Sanitise NaN before JSON serialisation
    result = []
    for _, r in rows.iterrows():
        result.append({
            var_col:  str(r[var_col]),
            val_col:  _safe(r[val_col]),
        })

    return {"sample_id": sample_id, "variables": result}


@router.get("/patients")
async def list_patients():
    df = _load_csv()
    sub_col, _, _ = _detect_columns(df)
    ids = df[sub_col].astype(str).unique().tolist()
    return {"status": "success", "patient_ids": ids[:50]}


@router.get("/patient/{subject_id}")
async def get_patient_data(subject_id: str):
    try:
        df = _load_csv()
        sub_col, var_col, val_col = _detect_columns(df)
        mask = df[sub_col].astype(str).str.strip() == str(subject_id).strip()
        df_p = df[mask]

        if df_p.empty:
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict_mrs")
async def predict_mrs(data: PatientData):
    global _MODEL_CACHE, _CACHE_KEY, _ARTIFACT

    try:
        # Cache key from threshold values — only retrain when thresholds change
        cache_key = str(sorted(
            (k, v.get("low") if isinstance(v, dict) else v,
                v.get("high") if isinstance(v, dict) else v)
            for k, v in data.thresholds.items()
        ))

        if _MODEL_CACHE is None or _CACHE_KEY != cache_key:
            model_path, suggested_t = train_dynamic_model(data.thresholds)
            _ARTIFACT   = joblib.load(model_path)
            _MODEL_CACHE = suggested_t
            _CACHE_KEY   = cache_key
        else:
            suggested_t = _MODEL_CACHE

        models, features, medians = _ARTIFACT["models"], _ARTIFACT["features"], _ARTIFACT["medians"]

        adj_glucose     = data.glucose     * 18.01 if data.glucose     < 50 else data.glucose
        adj_cholesterol = data.cholesterol * 38.67 if data.cholesterol < 25 else data.cholesterol

        # Start from medians, overlay patient record, then overlay UI values
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
            "sys_blood_pressure": get_binned_value(data.sys_blood_pressure, "sys_bp",      suggested_t),
            "dis_blood_pressure": get_binned_value(data.dis_blood_pressure, "dis_bp",      suggested_t, single=True),
            "glucose":            get_binned_value(adj_glucose,             "glucose",     suggested_t),
            "cholesterol":        get_binned_value(adj_cholesterol,         "cholesterol", suggested_t),
        })

        df = pd.DataFrame([row])[features]

        prediction, class_probs, raw_probs = ordinal_predict(models, df)
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
        raise HTTPException(status_code=500, detail=str(e))