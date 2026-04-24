import os
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
import joblib

_MODEL_CACHE: dict | None = None
_CACHE_KEY:   str  | None = None

THRESHOLD_KEY_TO_COLUMN = {
    "sys_bp":      "sys_blood_pressure",
    "dis_bp":      "dis_blood_pressure",
    "glucose":     "glucose",
    "cholesterol": "cholesterol",
}

ORDINAL_THRESHOLDS = [0, 1, 2, 3, 4, 5]


def train_dynamic_model(thresholds: dict) -> tuple:
    global _MODEL_CACHE, _CACHE_KEY

    # Build a stable cache key from the threshold values
    cache_key = str(sorted(
        (k, v.get("low"), v.get("high"))
        for k, v in thresholds.items()
    ))

    if _MODEL_CACHE is not None and _CACHE_KEY == cache_key:
        return _MODEL_CACHE["path"], _MODEL_CACHE["thresholds"]

    BASE_DIR = r"C:\Users\Bruger\PycharmProjects\P8Project\backend\model"
    CSV_PATH = os.path.join(BASE_DIR, "dataREanonymized_long.csv")

    # ── 1. Load & Pivot ───────────────────────────────────────────────────────
    df_long = pd.read_csv(CSV_PATH, low_memory=False)

    valid_subjects = (
        df_long[
            (df_long["variable"] == "three_m_mrs") & df_long["Value"].notna()
        ]["subject_id"].unique()
    )

    df_wide = (
        df_long[df_long["subject_id"].isin(valid_subjects)]
        .pivot(index="subject_id", columns="variable", values="Value")
        .reset_index()
    )
    df_wide = df_wide[df_wide["stroke_type"] == "ischemic"]

    # ── 2. Target ─────────────────────────────────────────────────────────────
    target = pd.to_numeric(df_wide["three_m_mrs"], errors="coerce")
    mask   = target.notna() & target.between(0, 6)
    df_wide = df_wide.loc[mask].copy()
    target  = target.loc[mask].astype(int).copy()

    # ── 3. Features ───────────────────────────────────────────────────────────
    DROP_COLS = [
        "three_m_mrs", "subject_id", "stroke_type",
        "hospitalized_in", "before_onset_antidiabetics",
        "bleeding_volume_value", "department_type",
        "door_to_groin", "door_to_imaging", "door_to_needle",
        "imaging_done", "imaging_type",
        "occup_physiotherapy_received", "onset_to_door",
        "perfusion_core", "no_thrombolysis_reason",
        "dysphagia_screening_type",
    ]

    X = df_wide.drop(columns=DROP_COLS, errors="ignore")
    X = X.dropna(axis=1, how="all")
    X = X.apply(pd.to_numeric, errors="coerce")
    feature_medians = X.median(numeric_only=True)
    X = X.fillna(feature_medians)

    # ── 4. Unit conversion ────────────────────────────────────────────────────
    if "glucose" in X.columns and X["glucose"].max() < 50:
        X["glucose"] = X["glucose"] * 18.01
    if "cholesterol" in X.columns and X["cholesterol"].max() < 25:
        X["cholesterol"] = X["cholesterol"] * 38.67

    # ── 5. Dynamic binning & threshold capture ────────────────────────────────
    effective_thresholds = {}
    for frontend_key, col_name in THRESHOLD_KEY_TO_COLUMN.items():
        if col_name not in X.columns:
            continue

        t        = thresholds.get(frontend_key, {})
        low      = float(t.get("low",  X[col_name].quantile(0.33)))
        high     = float(t.get("high", X[col_name].quantile(0.66)))
        data_min = float(X[col_name].min())
        data_max = float(X[col_name].max())

        if low >= high or high <= data_min or low >= data_max:
            low  = float(X[col_name].quantile(0.33))
            high = float(X[col_name].quantile(0.66))

        effective_thresholds[frontend_key] = {
            "low":  round(low,  1),
            "high": round(high, 1),
        }

        # Diastolic BP: single threshold in the original model
        if frontend_key == "dis_bp":
            X[col_name] = (X[col_name] > high).astype(float)
        else:
            X[col_name] = pd.cut(
                X[col_name],
                bins=[-np.inf, low, high, np.inf],
                labels=[0, 1, 2],
                include_lowest=True,
            ).astype(float)

    feature_list = X.columns.tolist()

    # ── 6. Train one binary classifier per ordinal cut-point ──────────────────
    models = {}
    for t in ORDINAL_THRESHOLDS:
        y_bin = (target > t).astype(int)
        clf = XGBClassifier(
            objective="binary:logistic",
            eval_metric="logloss",
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
        )
        clf.fit(X, y_bin)
        models[t] = clf

    # ── 7. Save ───────────────────────────────────────────────────────────────
    output_path = os.path.join(BASE_DIR, "live_model.pkl")
    joblib.dump(
        {
            "models":   models,
            "features": feature_list,
            "medians":  feature_medians.to_dict(),
        },
        output_path,
    )

    _MODEL_CACHE = {"path": output_path, "thresholds": effective_thresholds}
    _CACHE_KEY = cache_key

    return output_path, effective_thresholds