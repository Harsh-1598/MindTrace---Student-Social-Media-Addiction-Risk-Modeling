# MindTrace Project Documentation Report

## 1. Project Overview

MindTrace is a machine learning prediction project with a web interface.

The current repo has four main responsibility zones:

1. ML data/notebooks
2. model execution logic
3. FastAPI backend logic
4. frontend browser logic

The biggest recent change is the backend structure becoming more separated by concern.

Instead of stuffing everything into one file, the repo now spreads responsibility across:

- `config/`
- `schema/`
- `model/`
- `backend/`

Which is honestly a much healthier setup. Fewer mystery wires. Less accidental chaos.

## 2. Current High-Level Architecture

```text
Frontend (HTML/CSS/JS)
        |
        v
FastAPI route layer
        |
        v
Schema validation + shared config + model execution
        |
        v
Serialized scikit-learn model
```

## 3. Folder Responsibilities

### `backend/`

Purpose:

- HTTP routes
- API startup
- CORS
- endpoint orchestration

Main file:

- `backend/app.py`

### `config/`

Purpose:

- shared config-like values that multiple backend parts should reuse

Current file:

- `config/most_used_platform.py`

What it contains:

- `MOST_USED_PLATFORMS`
- `MostUsedPlatform`
- `get_most_used_platforms()`

This file is now actually used by the schema and the API, not just existing for emotional support.

### `schema/`

Purpose:

- request validation
- response validation

Files:

- `schema/user_input.py`
- `schema/prediction_response.py`

### `model/`

Purpose:

- load the trained model
- prepare input frames
- run inference

Files:

- `model/addiction_model.pkl`
- `model/predict.py`

### `frontend/`

Purpose:

- browser UI
- API requests
- result rendering
- local session/history handling

Main files:

- `frontend/index.html`
- `frontend/predictor.html`
- `frontend/dashboard.html`
- `frontend/css/styles.css`
- `frontend/js/api.js`
- `frontend/js/app.js`

### `src/`

Purpose:

- ML utility helpers used outside the main web-serving layer

Current main file:

- `src/utils.py`

### `data/`

Purpose:

- source dataset

### `notebooks/`

Purpose:

- experimentation
- EDA
- model building

### `figures/`

Purpose:

- exported analysis visuals

### `reports/`

Purpose:

- human-readable project documentation and generated reports

## 4. Backend Layer-by-Layer Structure

The current backend flow looks like this:

```text
backend/app.py
    |
    | uses
    +--> schema/user_input.py
    +--> schema/prediction_response.py
    +--> config/most_used_platform.py
    +--> model/predict.py
             |
             v
      model/addiction_model.pkl
```

## 5. Backend Files in Detail

## `config/most_used_platform.py`

This file now acts as the source of truth for valid platform names.

### `MOST_USED_PLATFORMS`

Stores the tuple of allowed platform strings.

Why this matters:

- one shared source of values
- less duplication
- frontend metadata route and request schema stay aligned

### `MostUsedPlatform`

This is a type alias built from the platform tuple using `Literal[...]`.

Why this matters:

- schema validation becomes tied to the same shared values
- no need to hardcode the list again inside `schema/user_input.py`

### `get_most_used_platforms()`

Returns the platforms as a normal list.

Why this exists:

- easy to send in API responses
- frontend can consume it directly for the dropdown

## `schema/user_input.py`

This file defines the prediction request body.

Main class:

- `Student_info`

What it validates:

- age
- gender
- academic level
- daily usage hours
- most used platform
- academic impact
- sleep hours
- mental health score
- relationship status
- conflicts over social media

Important update:

- `Most_Used_Platform` now uses `MostUsedPlatform` from `config/most_used_platform.py`

That means the separate platform file is now truly part of the FastAPI model contract.

## `schema/prediction_response.py`

This file defines the validated API response model for predictions.

Main class:

- `PredictionResponse`

Main helper:

- `build_prediction_response(...)`

### What `PredictionResponse` validates

- `"The prediction is"` must be between `0` and `100`
- `raw_prediction` must be between `2` and `9`
- `model_version` must follow semantic version format like `1.0.0`
- the percentage must correctly match the raw-score conversion formula

This is a strong improvement because the backend now validates output, not just input.

That is the API equivalent of checking your homework before submitting it instead of raw-dogging production.

## `model/predict.py`

This file owns prediction-side execution logic.

### `MODEL_PATH`

Points to:

- `model/addiction_model.pkl`

Now the path is built relative to the file location instead of using the older absolute-path approach.

Why this is better:

- more portable
- less machine-specific

### Model loading

```python
with MODEL_PATH.open("rb") as f:
    model = joblib.load(f)
```

Loads the trained model once when the module imports.

### `MODEL_VERSION`

Stores the current model version string.

Used by:

- `/health`
- `/predict`

### `_build_input_frame(student_info)`

Builds a pandas DataFrame from a `dict` or `list[dict]`.

Important behavior:

- if the model has `feature_names_in_`, the DataFrame is reindexed to match the trained feature order

Why this matters:

- avoids feature order mismatch problems
- keeps prediction inputs aligned with what the model expects

### `predict_output(student_info)`

Runs the model and returns a clean float prediction.

Important safety behavior:

- raises an error if the model returns `None`

This fixed an earlier crash path where `None` later broke percentage conversion.

## `backend/app.py`

This is the route layer.

### `app = FastAPI()`

Creates the API app.

### `CORSMiddleware`

Allows frontend browser requests to hit the API.

Current config is permissive for local development:

- `allow_origins=["*"]`

### `logger = logging.getLogger(__name__)`

Sets up logger usage for request success/failure logs.

### `GET /`

Simple hello route.

### `GET /health`

Returns:

- backend status
- model version
- whether model loaded successfully

### `GET /metadata/platforms`

Returns the platform list from `config/most_used_platform.py`.

Why this route exists:

- backend keeps the allowed values
- frontend dropdown can stay in sync
- platform config is exposed cleanly as metadata

### `POST /predict`

Main inference endpoint.

Current flow:

1. receive validated `Student_info`
2. convert the Pydantic model to a dict payload
3. run `predict_output(payload)`
4. build the validated response with `build_prediction_response(...)`
5. return the typed response model

Important improvement:

- this endpoint now returns a validated Pydantic response model instead of bypassing validation with raw `JSONResponse`

That means the response validator is actually used for real.

## 6. Current API Contract

## `GET /health`

Example:

```json
{
  "status": "OK",
  "version": "1.0.0",
  "model_loaded": true
}
```

## `GET /metadata/platforms`

Example:

```json
{
  "platforms": [
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
    "WeChat"
  ]
}
```

## `POST /predict`

Example request:

```json
{
  "Age": 19,
  "Gender": "Male",
  "Academic_Level": "Undergraduate",
  "Avg_Daily_Usage_Hours": 5.2,
  "Most_Used_Platform": "Instagram",
  "Affects_Academic_Performance": "Yes",
  "Sleep_Hours_Per_Night": 6.5,
  "Mental_Health_Score": 6.2,
  "Relationship_Status": "Single",
  "Conflicts_Over_Social_Media": 3
}
```

Example response:

```json
{
  "The prediction is": 56.86,
  "raw_prediction": 5.98,
  "model_version": "1.0.0"
}
```

## 7. Frontend Structure

The frontend still uses the same UI pages, but the logic is cleanly split into:

- `frontend/js/api.js`
- `frontend/js/app.js`

## `frontend/js/api.js`

Main responsibilities:

- backend URL storage
- generic JSON request helper
- request error formatting
- predictor payload construction
- score normalization
- health fetch
- platform metadata fetch
- frontend-side risk label/summary generation

Important exported functions:

- `buildPredictionPayload`
- `normalizePredictionScore`
- `buildRiskMessage`
- `fetchHealth`
- `fetchPlatforms`
- `submitPrediction`

## `frontend/js/app.js`

Main responsibilities:

- auth page behavior
- local session storage
- local prediction history storage
- shared protected layout behavior
- predictor page behavior
- dashboard rendering

Important update:

- predictor page now fetches platform options from `/metadata/platforms`
- if the endpoint fails, it keeps the fallback hardcoded options in the HTML

That means the dropdown remains a dropdown, but it is now also API-aware.

## 8. Frontend Runtime Flow

## Auth page

When `index.html` loads:

1. auth tab logic is attached
2. login/signup forms are attached
3. backend health is checked
4. status banner is updated

## Predictor page

When `predictor.html` loads:

1. session is checked
2. shared topbar logic is initialized
3. health hint is loaded
4. platform metadata is requested
5. dropdown is populated dynamically if data arrives
6. form submit handler is attached

When the form is submitted:

1. payload is built in `api.js`
2. request is sent to `/predict`
3. backend returns validated response
4. frontend reads `"The prediction is"`
5. frontend generates risk label + summary
6. result is rendered
7. prediction is stored in browser history

## Dashboard page

When `dashboard.html` loads:

1. session is checked
2. browser history is read
3. daily count is calculated
4. average score is calculated
5. health endpoint is called
6. model status card is updated

## 9. Requirements and Dependencies

The current `requirements.txt` reflects the actual runtime stack:

### ML/data stack

- `numpy`
- `pandas`
- `scikit-learn`
- `joblib`

### Backend stack

- `fastapi`
- `uvicorn[standard]`
- `pydantic`

### Notebook support

- `jupyter`

This is much more aligned with the current repo than the older Flask/Streamlit era.

## 10. Current Limitations

- auth is still frontend-only
- there is no persistent database
- dashboard history is browser-only
- frontend still creates the final risk label/summary itself from the returned percentage
- backend currently returns a generic `500` detail message on prediction failure

## 11. Practical Summary

The important current truths are:

- platform options are now centralized and reused properly
- input validation is separated into `schema/user_input.py`
- output validation is separated into `schema/prediction_response.py`
- model execution is separated into `model/predict.py`
- route wiring is handled in `backend/app.py`
- frontend API calls are separated from frontend UI behavior

So the repo is now much better organized around actual concerns instead of one-file chaos pretending to be a personality trait.
