from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config.most_used_platform import get_most_used_platforms
from model.predict import MODEL_VERSION, model, predict_output
from schema.prediction_response import PredictionResponse, build_prediction_response
from schema.user_input import Student_info
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Later restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)


# Human readable
@app.get("/")
def hello():
    return {"message": "Students Social Media Addiction API"}


# Machine readable
@app.get("/health")
def health_check():
    return {"status": "OK", "version": MODEL_VERSION, "model_loaded": model is not None}


@app.get("/metadata/platforms")
def get_platform_options():
    return {"platforms": get_most_used_platforms()}


@app.post("/predict", response_model=PredictionResponse)
def predict_addiction_score(data: Student_info):

    logger.info("Prediction request received.")

    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()

    try:
        prediction = predict_output(payload)

        logger.info(f"Prediction successful. Raw prediction: {prediction:.4f}")

        return build_prediction_response(
            raw_prediction=prediction,
            model_version=MODEL_VERSION,
        )

    except Exception as e:
        logger.exception("Prediction failed.")

        raise HTTPException(status_code=500, detail="Internal Server Error") from e
