from typing import Annotated, Literal

from pydantic import BaseModel, Field

from config.most_used_platform import MostUsedPlatform


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
        MostUsedPlatform,
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
