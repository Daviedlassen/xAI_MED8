import joblib
import pandas as pd
import numpy as np

# --- CONFIG ---
MODEL_PATH = r"C:\Users\Bruger\PycharmProjects\P8Project\backend\model\XGBoost_mRS_multiclass_20260417_154900.pkl"


def get_prediction(patient_dict):
    data = joblib.load(MODEL_PATH)
    model = data['model']
    features = data['features']

    # Define the bins exactly as they are in your training script
    custom_bins = {
        'glucose': [-np.inf, 130, 210, np.inf],
        'cholesterol': [-np.inf, 30, 170, np.inf],
        'dis_blood_pressure': [-np.inf, 100, 160, np.inf],
        'sys_blood_pressure': [-np.inf, 140, 220, np.inf],
    }

    # Prepare the input row
    row = {f: 0.0 for f in features}
    row.update(patient_dict)

    # Apply Binning
    for feat, bins in custom_bins.items():
        if feat in row:
            row[feat] = pd.cut([row[feat]], bins=sorted(bins), labels=False, include_lowest=True)[0]

    df = pd.DataFrame([row])[features]

    pred = model.predict(df)[0]
    probs = model.predict_proba(df)[0]

    return pred, probs[pred]


# --- TEST PRESETS ---
presets = [
    {"name": "Patient A (Severe)", "age": 72, "nihss_score": 14, "prestroke_mrs": 3, "sys_blood_pressure": 160,
     "dis_blood_pressure": 120, "glucose": 110, "cholesterol": 180},
    {"name": "Patient B (Mild)", "age": 55, "nihss_score": 2, "prestroke_mrs": 0, "sys_blood_pressure": 130,
     "dis_blood_pressure": 80, "glucose": 95, "cholesterol": 150}
]

for p in presets:
    name = p.pop("name")
    res, conf = get_prediction(p)
    print(f"Result for {name}: Predicted mRS {res} (Confidence: {conf:.2%})")