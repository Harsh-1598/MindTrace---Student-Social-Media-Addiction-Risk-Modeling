from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Annotated, Literal
import joblib
import pandas as pd
from sklearn import set_config

set_config(transform_output="pandas")

with open(
    r"C:\Users\kejri\OneDrive\Desktop\MLOps\Learning ML from Basics\Projects\MindTrace\models\addiction_model.pkl",
    "rb",
) as f:
    model = joblib.load(f)

app = FastAPI()

# Model Version -> generally handles by the MLflow
Model_Version = "1.0.0"


class Student_info(BaseModel):

    Age: Annotated[int, Field(..., gt=10, lt=30, description="Age of the student")]
    Gender: Annotated[
        Literal["Male", "Female"], Field(..., description="Gender of the student")
    ]
    Academic_Level: Annotated[
        Literal["Undergraduate", "Graduate", "High School"],
        Field(..., description="Academic level of the student"),
    ]
    Avg_Daily_Usage_Hours: Annotated[
        float, Field(..., gt=0, lt=10, description="Students daily mobile usage time")
    ]
    Most_Used_Platform: Annotated[
        Literal[
            "Instagram",
            "Twitter",
            "TikTok",
            "YouTube",
            "Facebook",
            "LinkedIn",
            "Snapchat",
            "LINE",
            "KakaoTalk",
            "VKontakte",
            "WhatsApp",
            "WeChat",
        ],
        Field(..., description="Platform student use"),
    ]
    Affects_Academic_Performance: Annotated[
        Literal["Yes", "No"], Field(..., description="Does Academics affected")
    ]
    Sleep_Hours_Per_Night: Annotated[
        float,
        Field(..., gt=3, lt=10, description="How many hours the student sleeps daily"),
    ]
    Mental_Health_Score: Annotated[
        float, Field(..., gt=4, lt=9, description="Mental health score of the student")
    ]
    Relationship_Status: Annotated[
        Literal["In Relationship", "Single", "Complicated"],
        Field(..., description="Relationship status of the student"),
    ]
    Conflicts_Over_Social_Media: Annotated[
        int, Field(..., gt=0, lt=5, description="Conflicts happen due to social media")
    ]


@app.get("/")
def hello():
    return {"message": "Students Social Media Addiction API"}


@app.get("/health")
def health_check():
    return {"status": "OK", "version": Model_Version, "model_loaded": model is not None}


@app.post("/predict")
def predict_addiction_score(data: Student_info):

    student_data = pd.DataFrame(
        [
            {
                "Age": data.Age,
                "Gender": data.Gender,
                "Academic_Level": data.Academic_Level,
                "Avg_Daily_Usage_Hours": data.Avg_Daily_Usage_Hours,
                "Most_Used_Platform": data.Most_Used_Platform,
                "Affects_Academic_Performance": data.Affects_Academic_Performance,
                "Sleep_Hours_Per_Night": data.Sleep_Hours_Per_Night,
                "Mental_Health_Score": data.Mental_Health_Score,
                "Relationship_Status": data.Relationship_Status,
                "Conflicts_Over_Social_Media": data.Conflicts_Over_Social_Media,
            }
        ]
    )

    print("Original:", type(student_data))
    print(student_data)

    # Access the fitted pipeline
    pipeline = model.regressor_

    x1 = pipeline.named_steps["Outliers Treatment"].transform(student_data)
    print("After Outliers Treatment:", type(x1))
    if hasattr(x1, "columns"):
        print(x1.columns)

    x2 = pipeline.named_steps["Feature Engineering"].transform(x1)
    print("After Feature Engineering:", type(x2))

    prediction = model.predict(student_data)[0]

    return JSONResponse(status_code=200, content={"The prediction is": prediction})
