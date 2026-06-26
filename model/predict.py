from pathlib import Path
import joblib
import pandas as pd
from sklearn import set_config

set_config(transform_output="pandas")

MODEL_PATH = Path(__file__).resolve().parent / "addiction_model.pkl"

with MODEL_PATH.open("rb") as f:
    model = joblib.load(f)

# Model Version -> generally handles by the MLflow
MODEL_VERSION = "1.0.0"


def _build_input_frame(student_info: dict | list[dict]) -> pd.DataFrame:
    if isinstance(student_info, dict):
        input_df = pd.DataFrame([student_info])
    else:
        input_df = pd.DataFrame(student_info)

    feature_names = getattr(model, "feature_names_in_", None)
    if feature_names is not None:
        input_df = input_df.reindex(columns=feature_names)

    return input_df


def predict_output(student_info: dict | list[dict]) -> float:
    input_df = _build_input_frame(student_info)
    prediction = model.predict(input_df)[0]

    if prediction is None:
        raise ValueError("Model returned None instead of a prediction value.")

    return float(prediction)
