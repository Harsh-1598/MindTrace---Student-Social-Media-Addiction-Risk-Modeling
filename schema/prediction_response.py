import re
from math import isfinite
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

SEMVER_PATTERN = re.compile(r"^\d+\.\d+\.\d+$")
RAW_SCORE_MIN = 2.0
RAW_SCORE_MAX = 9.0
PERCENTAGE_MIN = 0.0
PERCENTAGE_MAX = 100.0


class PredictionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    prediction_percentage: Annotated[
        float,
        Field(
            ...,
            alias="The prediction is",
            ge=PERCENTAGE_MIN,
            le=PERCENTAGE_MAX,
            description="Prediction percentage returned to the frontend.",
        ),
    ]
    raw_prediction: Annotated[
        float,
        Field(
            ...,
            ge=RAW_SCORE_MIN,
            le=RAW_SCORE_MAX,
            description="Raw model output before percentage conversion.",
        ),
    ]
    model_version: Annotated[
        str,
        Field(
            ...,
            min_length=5,
            description="Semantic model version string such as 1.0.0.",
        ),
    ]

    @field_validator("prediction_percentage", "raw_prediction", mode="before")
    @classmethod
    def validate_numeric_values(cls, value: float) -> float:
        numeric_value = float(value)
        if not isfinite(numeric_value):
            raise ValueError("Prediction values must be finite numbers.")
        return numeric_value

    @field_validator("model_version")
    @classmethod
    def validate_model_version(cls, value: str) -> str:
        if not SEMVER_PATTERN.fullmatch(value):
            raise ValueError(
                "model_version must follow semantic version format like 1.0.0."
            )
        return value

    @model_validator(mode="after")
    def validate_score_alignment(self) -> "PredictionResponse":
        expected_percentage = round(
            ((self.raw_prediction - RAW_SCORE_MIN) / (RAW_SCORE_MAX - RAW_SCORE_MIN))
            * 100,
            2,
        )

        if abs(self.prediction_percentage - expected_percentage) > 0.05:
            raise ValueError(
                "Prediction percentage does not align with the raw score conversion formula."
            )

        return self


def build_prediction_response(
    *, raw_prediction: float, model_version: str
) -> PredictionResponse:
    prediction_percentage = round(
        ((raw_prediction - RAW_SCORE_MIN) / (RAW_SCORE_MAX - RAW_SCORE_MIN)) * 100,
        2,
    )

    return PredictionResponse(
        **{
            "The prediction is": prediction_percentage,
            "raw_prediction": round(raw_prediction, 4),
            "model_version": model_version,
        }
    )
