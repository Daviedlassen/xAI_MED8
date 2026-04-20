import os
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
import joblib

# ── Key mapping: frontend threshold keys  →  DataFrame column names V2
THRESHOLD_KEY_TO_COLUMN = {
    "sys_bp":      "sys_blood_pressure",
    "dis_bp":      "dis_blood_pressure",
    "glucose":     "glucose",
    "cholesterol": "cholesterol",
}

def train_dynamic_model(thresholds: dict) -> str:
    """
    Re-train the XGBoost mRS predictor with unit conversion and dynamic binning.
    """
    BASE_DIR  = r"C:\Users\Bruger\PycharmProjects\P8Project\backend\model"
    CSV_PATH  = os.path.join(BASE_DIR, "dataREanonymized_long.csv")

    print(f"[trainer] Received thresholds: {thresholds}")

    # ── 1. Load & pivot long → wide
    df_long = pd.read_csv(CSV_PATH, low_memory=False)

    valid_subjects = df_long[
        (df_long["variable"] == "discharge_mrs") & df_long["Value"].notna()
    ]["subject_id"].unique()

    df_long_filtered = df_long[df_long["subject_id"].isin(valid_subjects)]
    df_wide = (
        df_long_filtered
        .pivot(index="subject_id", columns="variable", values="Value")
        .reset_index()
    )

    df_wide = df_wide[df_wide["stroke_type"] == "ischemic"]

    # ── 2. Target: 3-month mRS
    target = pd.to_numeric(df_wide["three_m_mrs"], errors="coerce")
    mask   = target.notna() & target.between(0, 6)
    df_wide = df_wide.loc[mask].copy()
    target  = target.loc[mask].astype(int).copy()

    # ── 3. Feature matrix
    drop_cols = [
        "three_m_mrs", "subject_id",
        "no_thrombolysis_reason", "dysphagia_screening_type", "stroke_type",
    ]
    X = df_wide.drop(columns=drop_cols, errors="ignore")
    X = X.dropna(axis=1, how="all")
    X = X.apply(pd.to_numeric, errors="coerce")

    # ── 4. Impute & Convert Units (mmol/L -> mg/dL)
    feature_medians = X.median(numeric_only=True)
    X = X.fillna(feature_medians)

    # Unit Conversion Logic based on raw data distribution
    if "glucose" in X.columns and X["glucose"].max() < 50:
        print(f"[trainer] Converting glucose from mmol/L to mg/dL (Max detected: {X['glucose'].max()})")
        X["glucose"] = X["glucose"] * 18.01

    if "cholesterol" in X.columns and X["cholesterol"].max() < 25:
        print(f"[trainer] Converting cholesterol from mmol/L to mg/dL (Max detected: {X['cholesterol'].max()})")
        X["cholesterol"] = X["cholesterol"] * 38.67

    print("--- RAW DATA STATS (Post-Conversion / Pre-Binning) ---")
    for col in THRESHOLD_KEY_TO_COLUMN.values():
        if col in X.columns:
            print(f"Column: {col} | Min: {X[col].min():.1f} | Max: {X[col].max():.1f} | Mean: {X[col].mean():.1f}")
    print("------------------------------------------------------")

    # ── 5. Dynamic binning
    for frontend_key, col_name in THRESHOLD_KEY_TO_COLUMN.items():
        if col_name not in X.columns:
            continue

        t = thresholds.get(frontend_key, {})
        data_min = X[col_name].min()
        data_max = X[col_name].max()

        low  = float(t.get("low",  X[col_name].quantile(0.33)))
        high = float(t.get("high", X[col_name].quantile(0.66)))

        # Fallback if thresholds don't make sense for the current data distribution
        if low >= high or high <= data_min or low >= data_max:
            print(f"[trainer] ALERT: User thresholds ({low}, {high}) outside range for {col_name}. Falling back to quantiles.")
            low  = float(X[col_name].quantile(0.33))
            high = float(X[col_name].quantile(0.66))

        bins   = [-np.inf, low, high, np.inf]
        labels = [0, 1, 2]

        X[col_name] = pd.cut(
            X[col_name],
            bins=bins,
            labels=labels,
            include_lowest=True,
        ).astype(float)

        n0 = (X[col_name] == 0).sum()
        n1 = (X[col_name] == 1).sum()
        n2 = (X[col_name] == 2).sum()
        print(f"[trainer] '{col_name}' bins (low={low}, high={high}) → 0:{n0}  1:{n1}  2:{n2}")

    # ── 6. Train
    model = XGBClassifier(
        objective="multi:softprob",
        num_class=7,
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        eval_metric="mlogloss"
    )
    model.fit(X, target)
    print(f"[trainer] Training complete — {len(X)} samples, {len(X.columns)} features")

    # ── 7. Save artefact
    output_path = os.path.join(BASE_DIR, "live_model.pkl")
    joblib.dump(
        {
            "model":    model,
            "features": X.columns.tolist(),
            "medians":  feature_medians.to_dict(),
        },
        output_path,
    )
    print(f"[trainer] Model saved → {output_path}")

    return output_path

