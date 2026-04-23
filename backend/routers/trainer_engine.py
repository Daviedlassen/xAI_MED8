import os
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
import joblib

THRESHOLD_KEY_TO_COLUMN = {
    "sys_bp": "sys_blood_pressure",
    "dis_bp": "dis_blood_pressure",
    "glucose": "glucose",
    "cholesterol": "cholesterol",
}


def train_dynamic_model(thresholds: dict) -> tuple:
    BASE_DIR = r"C:\Users\Bruger\PycharmProjects\P8Project\backend\model"
    CSV_PATH = os.path.join(BASE_DIR, "dataREanonymized_long.csv")

    # 1. Load & Pivot
    df_long = pd.read_csv(CSV_PATH, low_memory=False)
    valid_subjects = df_long[(df_long["variable"] == "discharge_mrs") & df_long["Value"].notna()]["subject_id"].unique()
    df_wide = df_long[df_long["subject_id"].isin(valid_subjects)].pivot(index="subject_id", columns="variable",
                                                                        values="Value").reset_index()
    df_wide = df_wide[df_wide["stroke_type"] == "ischemic"]

    # 2. Target: 3-month mRS
    target = pd.to_numeric(df_wide["three_m_mrs"], errors="coerce")
    mask = target.notna() & target.between(0, 6)
    df_wide = df_wide.loc[mask].copy()
    target = target.loc[mask].astype(int).copy()

    # 3. Features
    X = df_wide.drop(columns=["three_m_mrs", "subject_id", "stroke_type"], errors="ignore")
    X = X.apply(pd.to_numeric, errors="coerce")
    feature_medians = X.median(numeric_only=True)
    X = X.fillna(feature_medians)

    # 4. Units (Ensuring conversion happens for the whole training set)
    if "glucose" in X.columns and X["glucose"].max() < 50:
        X["glucose"] = X["glucose"] * 18.01
    if "cholesterol" in X.columns and X["cholesterol"].max() < 25:
        X["cholesterol"] = X["cholesterol"] * 38.67

    # 5. Dynamic Binning & Threshold Capture
    effective_thresholds = {}
    for frontend_key, col_name in THRESHOLD_KEY_TO_COLUMN.items():
        if col_name not in X.columns: continue

        t = thresholds.get(frontend_key, {})
        data_min, data_max = X[col_name].min(), X[col_name].max()

        # Default to quantiles if UI values are missing or invalid
        low = float(t.get("low", X[col_name].quantile(0.33)))
        high = float(t.get("high", X[col_name].quantile(0.66)))

        if low >= high or high <= data_min or low >= data_max:
            low, high = float(X[col_name].quantile(0.33)), float(X[col_name].quantile(0.66))

        effective_thresholds[frontend_key] = {"low": round(low, 1), "high": round(high, 1)}

        # Binning the training data
        X[col_name] = pd.cut(
            X[col_name],
            bins=[-np.inf, low, high, np.inf],
            labels=[0, 1, 2],
            include_lowest=True
        ).astype(float)

    # 6. Train
    model = XGBClassifier(
        objective="multi:softprob",
        num_class=7,
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        eval_metric="mlogloss"
    )
    model.fit(X, target)

    # 7. Save
    output_path = os.path.join(BASE_DIR, "live_model.pkl")
    joblib.dump({
        "model": model,
        "features": X.columns.tolist(),
        "medians": feature_medians.to_dict()
    }, output_path)

    return output_path, effective_thresholds