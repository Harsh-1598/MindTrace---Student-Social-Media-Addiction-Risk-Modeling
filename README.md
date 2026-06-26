# MindTrace

MindTrace is a student social media addiction prediction project built around four layers:

- data + notebooks for analysis and training
- a serialized scikit-learn model
- a FastAPI inference backend
- a vanilla HTML/CSS/JavaScript frontend

The repo is now structured with clearer separation of concerns, especially on the API side:

- `config/` stores shared backend constants and typed option sets
- `schema/` stores request/response validators
- `model/` stores model loading and prediction logic
- `backend/` stores route handlers and API wiring

## Current Project Reality

This repository currently includes:

- a FastAPI backend in `backend/app.py`
- a prediction engine in `model/predict.py`
- request and response schemas in `schema/`
- shared platform config in `config/most_used_platform.py`
- a plain frontend in `frontend/`
- notebooks, figures, and reports for the ML workflow

This repository currently does **not** include:

- backend authentication
- a database for users or predictions
- a React/Vue frontend
- Flask or SQLite

If older notes mention those, that is old project lore, not current repo truth.

## Current File Structure

```text
MindTrace/
├── backend/
│   └── app.py
├── config/
│   └── most_used_platform.py
├── data/
│   └── Students Social Media Addiction.csv
├── figures/
│   ├── 01 Most Used Platform.png
│   ├── 02 Categorical Data Distribution.png
│   ├── 03 Age Distribution.png
│   ├── 04 Addicted Score Distribution.png
│   ├── 05 Numerical Data Distribution.png
│   ├── 06 Mental Health vs Addicted Score Scatter Plot.png
│   ├── 07 Average Daily Usage Hours vs Addicted Score Scatter Plot.png
│   ├── 08 Gender Data Distribution Plot.png
│   ├── 09 Relationship Status Plot.png
│   ├── 10 Heatmap.png
│   └── 11 Clustermap.png
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   └── app.js
│   ├── dashboard.html
│   ├── index.html
│   └── predictor.html
├── model/
│   ├── addiction_model.pkl
│   └── predict.py
├── notebooks/
│   ├── main.ipynb
│   └── main_pipeline.ipynb
├── reports/
│   ├── frontend_api_integration_report.md
│   ├── project_documentation_report.md
│   └── students_social_media_addiction_report.html
├── schema/
│   ├── prediction_response.py
│   └── user_input.py
├── src/
│   └── utils.py
├── README.md
└── requirements.txt
```

## What Each Main Folder Does

### `backend/`

Contains the API route layer.

Main responsibilities:

- create the FastAPI app
- enable CORS
- expose HTTP endpoints
- coordinate schema validation and prediction execution

Main file:

- `backend/app.py`

### `config/`

Contains backend configuration-style modules that should be reusable across layers.

Current file:

- `config/most_used_platform.py`

What it provides:

- the shared platform list
- the typed `MostUsedPlatform` alias
- a helper function used by the metadata route

### `schema/`

Contains Pydantic schemas.

Files:

- `schema/user_input.py`
- `schema/prediction_response.py`

What they do:

- validate incoming prediction input
- validate outgoing prediction response

### `model/`

Contains the actual model artifact and prediction-side logic.

Files:

- `model/addiction_model.pkl`
- `model/predict.py`

What `predict.py` does:

- load the model
- build a DataFrame with correct column order
- run prediction
- return a clean numeric raw score

### `frontend/`

Contains the full browser UI using plain web files.

Files:

- `frontend/index.html`
- `frontend/predictor.html`
- `frontend/dashboard.html`
- `frontend/css/styles.css`
- `frontend/js/api.js`
- `frontend/js/app.js`

### `src/`

Contains ML utility code used during pipeline/training work.

Main file:

- `src/utils.py`

Important class:

- `IQRClipper`

### `data/`

Contains the source dataset:

- `data/Students Social Media Addiction.csv`

### `notebooks/`

Contains Jupyter notebooks for analysis and training:

- `notebooks/main.ipynb`
- `notebooks/main_pipeline.ipynb`

### `figures/`

Contains exported visualizations from the analysis workflow.

### `reports/`

Contains written documentation and generated analysis reports.

## API Structure

The backend is now more intentionally layered:

```text
backend/app.py
    |
    | uses
    v
schema/user_input.py
schema/prediction_response.py
config/most_used_platform.py
model/predict.py
    |
    v
model/addiction_model.pkl
```

### Why this structure matters

- `backend/` focuses on routes
- `schema/` focuses on validation
- `config/` focuses on reusable shared values
- `model/` focuses on model execution

That keeps the logic less tangled and much easier to extend.

## Current API Endpoints

### `GET /`

Basic hello route.

Example response:

```json
{
  "message": "Students Social Media Addiction API"
}
```

### `GET /health`

Used by the frontend to confirm the backend is reachable and the model is loaded.

Example response:

```json
{
  "status": "OK",
  "version": "1.0.0",
  "model_loaded": true
}
```

### `GET /metadata/platforms`

Returns the allowed values for the platform dropdown.

Example response:

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

Why this route exists:

- the backend stays the source of truth
- the frontend dropdown can stay dynamic
- the schema and frontend stay in sync more easily

### `POST /predict`

Used by the predictor page.

Expected request body:

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

Current validated response shape:

```json
{
  "The prediction is": 56.86,
  "raw_prediction": 5.98,
  "model_version": "1.0.0"
}
```

### What the response fields mean

- `"The prediction is"` = prediction percentage returned to the frontend
- `"raw_prediction"` = raw model score before percentage conversion
- `"model_version"` = semantic version string for the loaded model

## Response Validation

`schema/prediction_response.py` now validates the prediction response before it leaves the API.

It checks:

- prediction percentage must be finite and between `0` and `100`
- raw prediction must be finite and between `2` and `9`
- model version must look like semantic versioning such as `1.0.0`
- prediction percentage must align with the raw score conversion formula

That means the backend now validates not just input, but output too.

Nice. Very adult behavior from the API.

## Frontend Structure

The frontend is intentionally split into two JavaScript files:

### `frontend/js/api.js`

Handles:

- API base URL
- fetch wrappers
- response parsing
- validation error formatting
- payload building for `/predict`
- health fetch
- platform metadata fetch
- frontend-side risk message generation

### `frontend/js/app.js`

Handles:

- auth tab switching
- local session storage
- prediction history storage
- topbar/dropdown/modal interactions
- predictor form submission
- dynamic platform dropdown rendering
- dashboard rendering

## Current Frontend Runtime Flow

### `index.html`

- loads auth UI
- checks `GET /health`
- stores local session data after login/signup

### `predictor.html`

- loads health info
- loads platform options from `GET /metadata/platforms`
- falls back to hardcoded HTML options if needed
- sends form data to `POST /predict`
- renders the returned score and frontend-generated risk label

### `dashboard.html`

- reads local prediction history
- calculates prediction summary values
- calls `GET /health` to show backend/model status

## How To Run The Project

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the FastAPI backend

```bash
uvicorn backend.app:app --reload
```

API default URL:

```text
http://127.0.0.1:8000
```

### 3. Open the frontend

Open:

```text
frontend/index.html
```

You can open it directly in the browser or serve the `frontend/` folder with a lightweight static server.

## Requirements

Current dependency groups in `requirements.txt`:

- core ML/data stack
- FastAPI backend stack
- optional notebook tooling

The file now reflects the current repo shape instead of older Flask/Streamlit assumptions.

## Documentation Map

If you want the docs by topic:

- read [README.md](./README.md) for repo overview and setup
- read [reports/project_documentation_report.md](./reports/project_documentation_report.md) for whole-project architecture
- read [reports/frontend_api_integration_report.md](./reports/frontend_api_integration_report.md) for frontend logic and JS flow
- open [reports/students_social_media_addiction_report.html](./reports/students_social_media_addiction_report.html) for the dataset profiling report

## Known Limitations

- auth is frontend-only
- dashboard history lives only in browser `localStorage`
- no database exists for users or predictions
- frontend still derives the user-facing risk label from the percentage
- backend currently raises a generic `500` detail for failed prediction attempts

## Good Next Improvements

- add persistent storage if prediction history should survive browsers/devices
- add proper auth if needed
- add structured API error codes
- document notebook-to-model retraining steps more formally
- add deployment instructions for frontend + FastAPI hosting
