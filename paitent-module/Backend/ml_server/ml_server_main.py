"""
============================================================
  ML Prediction Server — FastAPI
  Diseases: Sleep Apnea | Heart | Hypertension
  
  CHALANE KA TARIKA:
  1. pip install -r requirements.txt
  2. uvicorn main:app --host 0.0.0.0 --port 8000 --reload
============================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
import joblib
import os

# ── App init ─────────────────────────────────────────────
app = FastAPI(title="Health Prediction API", version="1.0.0")

# CORS — React Native se calls allow karne ke liye
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model folder path ─────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# ── Label maps ────────────────────────────────────────────
SEVERITY_LABELS = {0: "Normal", 1: "Mild", 2: "Moderate", 3: "Severe"}

# ── Encoding maps ─────────────────────────────────────────
HR_PATTERN_MAP = {"steady": 0, "fluctuating": 1, "spike": 2}
ACCEL_TYPE_MAP = {"still": 0, "restless": 1, "jerk": 2}
GENDER_MAP     = {"male": 0, "female": 1, "Male": 0, "Female": 1}
CONDITION_MAP  = {"Bradycardia": 0, "Normal": 1, "Tachycardia": 2}

# ══════════════════════════════════════════════════════════
# MODELS LOAD — Server start hone par ek baar
# ══════════════════════════════════════════════════════════
print("⏳ Models load ho rahe hain...")

try:
    MODELS = {
        "sleep_xgb"     : joblib.load(f"{MODEL_DIR}/sleep_apnea_xgb.pkl"),
        "sleep_rf"      : joblib.load(f"{MODEL_DIR}/sleep_apnea_rf.pkl"),
        "sleep_features": joblib.load(f"{MODEL_DIR}/sleep_apnea_features.pkl"),
        "heart_xgb"     : joblib.load(f"{MODEL_DIR}/heart_xgb.pkl"),
        "heart_rf"      : joblib.load(f"{MODEL_DIR}/heart_rf.pkl"),
        "heart_features": joblib.load(f"{MODEL_DIR}/heart_features.pkl"),
        "hyper_xgb"     : joblib.load(f"{MODEL_DIR}/hypertension_xgb.pkl"),
        "hyper_rf"      : joblib.load(f"{MODEL_DIR}/hypertension_rf.pkl"),
        "hyper_features": joblib.load(f"{MODEL_DIR}/hypertension_features.pkl"),
    }
    print("✅ Saare models load ho gaye!")
except Exception as e:
    print(f"❌ Model load error: {e}")
    MODELS = {}


# ══════════════════════════════════════════════════════════
# REQUEST SCHEMAS (Pydantic)
# ══════════════════════════════════════════════════════════

class SleepApneaRequest(BaseModel):
    # Watch se aane wale raw fields
    Age: float
    Gender: str                    # "Male" / "Female"
    Sleep_Hours: float
    SpO2: float                    # SpO2 (%)
    HR: float                      # HR (bpm)
    Accel: float                   # Accel (g)
    # Derived fields — app/backend pe calculate honge
    SpO2_Baseline: float
    SpO2_Drop: float
    HR_Variability: float
    HR_Pattern: str                # "steady"/"fluctuating"/"spike"
    Accel_Type: str                # "still"/"restless"/"jerk"
    SpO2_Score: int
    HR_Score: int
    Accel_Score: int
    Age_Gender_Score: int
    Risk_Multiplier: float
    Physio_Score: float
    Event_Score: float
    Events_L1: int
    Events_L2: int
    Total_Events: int
    AHI_Score: float
    AHI_Threshold: float
    model: Optional[str] = "rf"    # "rf" ya "xgb"


class HeartRequest(BaseModel):
    Age: float
    Gender: str
    HR: float
    SpO2: float
    Body_Temp: float
    Systolic_BP: float
    Diastolic_BP: float
    Blood_Sugar: float
    Respiratory_Rate: float
    Pulse_Pressure: float          # Systolic - Diastolic
    MAP: float                     # Diastolic + (PP/3)
    Max_HR: float                  # 220 - Age
    HRR: float                     # Max_HR - HR
    Shock_Index: float             # HR / Systolic_BP
    RPP: float                     # HR * Systolic_BP
    SpO2_Deficit: float            # 100 - SpO2
    Condition: str                 # "Normal"/"Tachycardia"/"Bradycardia"
    Risk_Score: float
    model: Optional[str] = "rf"


class HypertensionRequest(BaseModel):
    Age: float
    Gender: str
    Height_cm: float
    Weight_kg: float
    BMI: float
    Resting_HR: float
    Steps_Day1: float
    Steps_Day2: float
    Steps_Day3: float
    Steps_Day4: float
    Steps_Day5: float
    Steps_Day6: float
    Steps_Day7: float
    Steps_7day_avg: float
    Steps_Score: float
    Systolic_BP: float
    Diastolic_BP: float
    Pulse_Pressure: float
    MAP: float
    HRR_Proxy: float
    Hypertension_Risk_Score: float
    model: Optional[str] = "rf"


# ══════════════════════════════════════════════════════════
# HELPER — Prediction result banana
# ══════════════════════════════════════════════════════════

def make_prediction(model, X):
    pred_label  = int(model.predict(X)[0])
    pred_proba  = model.predict_proba(X)[0]
    confidence  = round(float(pred_proba[pred_label]) * 100, 2)
    all_probs   = {
        SEVERITY_LABELS[i]: round(float(p) * 100, 2)
        for i, p in enumerate(pred_proba)
    }
    return pred_label, confidence, all_probs


# ══════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"status": "✅ ML Server running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {
        "status"      : "ok",
        "models_loaded": len(MODELS) > 0,
        "model_count"  : len(MODELS)
    }


# ── 1. Sleep Apnea ────────────────────────────────────────
@app.post("/predict/sleep-apnea")
def predict_sleep_apnea(req: SleepApneaRequest):
    if not MODELS:
        raise HTTPException(500, "Models load nahi hue")

    # Encode categoricals
    gender      = GENDER_MAP.get(req.Gender, 0)
    hr_pattern  = HR_PATTERN_MAP.get(req.HR_Pattern, 0)
    accel_type  = ACCEL_TYPE_MAP.get(req.Accel_Type, 0)

    # Feature order — training ke saath exact same
    features = MODELS["sleep_features"]
    raw_values = {
        "Age"                  : req.Age,
        "Gender"               : gender,
        "Sleep_Hours"          : req.Sleep_Hours,
        "SpO2 (%)"             : req.SpO2,
        "HR (bpm)"             : req.HR,
        "Accel (g)"            : req.Accel,
        "SpO2_Baseline (%)"    : req.SpO2_Baseline,
        "SpO2_Drop (%)"        : req.SpO2_Drop,
        "HR_Variability (bpm)" : req.HR_Variability,
        "HR_Pattern"           : hr_pattern,
        "Accel_Type"           : accel_type,
        "SpO2_Score (0-2)"     : req.SpO2_Score,
        "HR_Score (0-2)"       : req.HR_Score,
        "Accel_Score (0-2)"    : req.Accel_Score,
        "Age/Gender_Score"     : req.Age_Gender_Score,
        "Risk_Multiplier"      : req.Risk_Multiplier,
        "Physio_Score"         : req.Physio_Score,
        "Event_Score (F1)"     : req.Event_Score,
        "Events_L1"            : req.Events_L1,
        "Events_L2"            : req.Events_L2,
        "Total_Events"         : req.Total_Events,
        "AHI_Score"            : req.AHI_Score,
        "AHI_Threshold"        : req.AHI_Threshold,
    }

    X     = np.array([[raw_values[f] for f in features]])
    model = MODELS["sleep_xgb"] if req.model == "xgb" else MODELS["sleep_rf"]

    label, confidence, all_probs = make_prediction(model, X)

    return {
        "disease"           : "Sleep Apnea",
        "severity_label"    : label,
        "severity"          : SEVERITY_LABELS[label],
        "confidence_percent": confidence,
        "probabilities"     : all_probs,
        "model_used"        : req.model.upper()
    }


# ── 2. Heart ──────────────────────────────────────────────
@app.post("/predict/heart")
def predict_heart(req: HeartRequest):
    if not MODELS:
        raise HTTPException(500, "Models load nahi hue")

    gender    = GENDER_MAP.get(req.Gender, 0)
    condition = CONDITION_MAP.get(req.Condition, 1)

    features = MODELS["heart_features"]
    raw_values = {
        "Age"                  : req.Age,
        "Gender"               : gender,
        "HR (bpm)"             : req.HR,
        "SpO2 (%)"             : req.SpO2,
        "Body_Temp (°C)"       : req.Body_Temp,
        "Systolic_BP (mmHg)"   : req.Systolic_BP,
        "Diastolic_BP (mmHg)"  : req.Diastolic_BP,
        "Blood_Sugar (mg/dL)"  : req.Blood_Sugar,
        "Respiratory_Rate"     : req.Respiratory_Rate,
        "Pulse_Pressure"       : req.Pulse_Pressure,
        "MAP (mmHg)"           : req.MAP,
        "Max_HR"               : req.Max_HR,
        "HRR"                  : req.HRR,
        "Shock_Index"          : req.Shock_Index,
        "RPP"                  : req.RPP,
        "SpO2_Deficit"         : req.SpO2_Deficit,
        "Condition"            : condition,
        "Risk_Score"           : req.Risk_Score,
    }

    X     = np.array([[raw_values[f] for f in features]])
    model = MODELS["heart_xgb"] if req.model == "xgb" else MODELS["heart_rf"]

    label, confidence, all_probs = make_prediction(model, X)

    return {
        "disease"           : "Heart",
        "severity_label"    : label,
        "severity"          : SEVERITY_LABELS[label],
        "confidence_percent": confidence,
        "probabilities"     : all_probs,
        "model_used"        : req.model.upper()
    }


# ── 3. Hypertension ───────────────────────────────────────
@app.post("/predict/hypertension")
def predict_hypertension(req: HypertensionRequest):
    if not MODELS:
        raise HTTPException(500, "Models load nahi hue")

    gender = GENDER_MAP.get(req.Gender, 0)

    features = MODELS["hyper_features"]
    raw_values = {
        "Age"                    : req.Age,
        "Gender"                 : gender,
        "Height_cm"              : req.Height_cm,
        "Weight_kg"              : req.Weight_kg,
        "BMI"                    : req.BMI,
        "Resting_HR_bpm"         : req.Resting_HR,
        "Steps_Day1"             : req.Steps_Day1,
        "Steps_Day2"             : req.Steps_Day2,
        "Steps_Day3"             : req.Steps_Day3,
        "Steps_Day4"             : req.Steps_Day4,
        "Steps_Day5"             : req.Steps_Day5,
        "Steps_Day6"             : req.Steps_Day6,
        "Steps_Day7"             : req.Steps_Day7,
        "Steps_7day_avg"         : req.Steps_7day_avg,
        "Steps_Score"            : req.Steps_Score,
        "Systolic_BP_mmHg"       : req.Systolic_BP,
        "Diastolic_BP_mmHg"      : req.Diastolic_BP,
        "Pulse_Pressure_mmHg"    : req.Pulse_Pressure,
        "Mean_Arterial_Pressure" : req.MAP,
        "HRR_Proxy"              : req.HRR_Proxy,
        "Hypertension_Risk_Score": req.Hypertension_Risk_Score,
    }

    X     = np.array([[raw_values[f] for f in features]])
    model = MODELS["hyper_xgb"] if req.model == "xgb" else MODELS["hyper_rf"]

    label, confidence, all_probs = make_prediction(model, X)

    return {
        "disease"           : "Hypertension",
        "severity_label"    : label,
        "severity"          : SEVERITY_LABELS[label],
        "confidence_percent": confidence,
        "probabilities"     : all_probs,
        "model_used"        : req.model.upper()
    }


# ── 4. All 3 at once ──────────────────────────────────────
@app.post("/predict/all")
def predict_all(
    sleep_req: SleepApneaRequest,
    heart_req: HeartRequest,
    hyper_req: HypertensionRequest
):
    """Teeno ek saath predict karo — ek hi call mein"""
    return {
        "sleep_apnea" : predict_sleep_apnea(sleep_req),
        "heart"       : predict_heart(heart_req),
        "hypertension": predict_hypertension(hyper_req),
    }
