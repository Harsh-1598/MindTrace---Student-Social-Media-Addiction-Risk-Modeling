# MindTrace Frontend API Integration Report

## 1. What the frontend does now

The frontend has three main jobs:

1. show the UI pages
2. collect the user’s form input
3. talk to FastAPI and render the response

The frontend still uses plain:

- `HTML`
- `CSS`
- `JavaScript`

The UI/UX stayed the same, but the logic now matches the newer backend structure better.

Important backend-facing updates now reflected in the frontend:

- dynamic platform dropdown loading from `/metadata/platforms`
- validated prediction response coming from `/predict`
- richer prediction response shape with percentage, raw score, and model version

## 2. Frontend file structure

- `frontend/index.html`
- `frontend/predictor.html`
- `frontend/dashboard.html`
- `frontend/css/styles.css`
- `frontend/js/api.js`
- `frontend/js/app.js`

## 3. Separation of concerns in the frontend

The frontend JavaScript is intentionally split into two files.

### `frontend/js/api.js`

This file handles backend communication.

Responsibilities:

- backend base URL
- fetch wrapper
- JSON response reading
- API error formatting
- form-data-to-payload conversion
- prediction response parsing
- metadata fetch for platform options

### `frontend/js/app.js`

This file handles browser UI behavior.

Responsibilities:

- auth tab switching
- local session storage
- local prediction history storage
- page boot logic
- predictor form handling
- dropdown rendering
- dashboard rendering

Easy memory trick:

- `api.js` = API brain
- `app.js` = UI brain

## 4. HTML pages and their role

## `index.html`

This is the auth/entry page.

It contains:

- login form
- signup form
- API status banner

## `predictor.html`

This is the main prediction page.

It contains:

- student details form
- most-used-platform dropdown
- status banner
- result card
- accuracy notice

Important update:

- the platform dropdown still exists as a dropdown
- but now it can be populated from backend metadata

## `dashboard.html`

This is the lightweight analytics page.

It contains:

- predictions today card
- average risk card
- model status card

## 5. Full logic of `api.js`

This file is wrapped in:

```js
const MindTraceAPI = (() => { ... })();
```

That means it creates one reusable API object and avoids global mess.

## `API_BASE_URL`

Stores the backend base URL.

Current default:

```js
http://127.0.0.1:8000
```

Why it exists:

- all backend calls should use one shared base URL

## `createDefaultHeaders()`

Returns the default request headers.

Current use:

- JSON requests need `"Content-Type": "application/json"`

## `readJsonResponse(response)`

Checks whether the response is JSON before parsing it.

Why this matters:

- safer than blindly calling `response.json()`

## `formatValidationErrors(detailList)`

Converts FastAPI validation errors into readable text.

Example idea:

- FastAPI gives structured error objects
- frontend turns them into readable strings

Why this matters:

- cleaner user-facing errors
- easier debugging

## `getErrorMessage(payload, statusCode)`

Decides what message should be thrown when a request fails.

It checks:

1. validation errors
2. normal string detail
3. fallback generic message

## `requestJson(endpoint, options = {})`

Main shared fetch helper.

What it does:

1. sends the request
2. parses the JSON if present
3. throws a useful error if request failed
4. returns parsed response if request succeeded

Why this is important:

- prevents repeated fetch boilerplate
- keeps all API calls consistent

## `toNumber(value)`

Converts form string values to numbers.

Why it exists:

- browser form values arrive as strings
- backend numeric fields need actual numbers

## `buildPredictionPayload(formData)`

Builds the exact payload sent to `POST /predict`.

Important job:

- map frontend form names to backend field names

Example:

- frontend: `usageHours`
- backend: `Avg_Daily_Usage_Hours`

This is the frontend/backend translator function.

## `normalizePredictionScore(apiResponse)`

Reads the backend percentage from:

```json
{
  "The prediction is": 56.86
}
```

What it does:

1. reads `"The prediction is"`
2. converts it to a number
3. clamps it between `0` and `100`

Why this exists:

- frontend score display should always stay sane

## `buildRiskMessage(score)`

The backend returns:

- prediction percentage
- raw score
- model version

But it does **not** return:

- `Low Risk`
- `Moderate Risk`
- `High Risk`

So the frontend builds those labels itself.

Current logic:

- `70+` = `High Risk`
- `45+` = `Moderate Risk`
- otherwise = `Low Risk`

It also creates the summary text shown in the result card.

## `fetchHealth()`

Calls:

```txt
GET /health
```

Used in:

- auth page
- predictor page
- dashboard page

## `fetchPlatforms()`

Calls:

```txt
GET /metadata/platforms
```

Used in:

- predictor page

Why this matters:

- the platform dropdown can now follow backend-approved values
- backend becomes the source of truth

## `submitPrediction(formData)`

This is the main prediction API function.

It does:

1. build backend request payload
2. send `POST /predict`
3. read the validated backend response
4. normalize the returned percentage
5. build a UI-friendly risk label and summary
6. return a frontend-friendly result object

Returned object includes:

- `score`
- `label`
- `summary`
- `payloadSent`
- `rawResponse`

Important note:

- `rawResponse` now contains more than before:
  - `"The prediction is"`
  - `raw_prediction`
  - `model_version`

## 6. Full logic of `app.js`

This file is wrapped in an IIFE too.

That keeps the page logic self-contained and avoids leaking random variables globally.

## `STORAGE_KEYS`

Stores local storage key names in one place:

- `session`
- `predictionHistory`

Why this is useful:

- fewer typo bugs

## `cssStatusClasses`

Stores the banner-state classes:

- `status-neutral`
- `status-success`
- `status-error`

## DOM helpers

### `getBodyPage()`

Reads the current page from `body[data-page]`.

Why this matters:

- predictor logic should only run on predictor page
- dashboard logic should only run on dashboard page

### `query()` and `queryAll()`

Small wrappers for:

- `querySelector`
- `querySelectorAll`

Why they exist:

- shorter code
- cleaner reading

## Storage helpers

### `readJsonStorage(key, fallbackValue)`

Reads JSON from `localStorage`.

If parsing fails, it returns the fallback value.

### `writeJsonStorage(key, value)`

Writes JSON into `localStorage`.

### `getSession()`, `saveSession()`, `clearSession()`

Manage local auth/session data.

Important reminder:

- this is frontend-only session handling
- not production auth

### `getPredictionHistory()`, `savePredictionHistory()`, `addPredictionToHistory()`

Manage local prediction history.

Why this exists:

- dashboard needs something to show
- backend does not store prediction history in a database

## UI helpers

### `redirectTo(path)`

Changes the current page.

### `setText(element, value)`

Safely updates element text if the element exists.

### `setStatusBanner(element, message, tone)`

Updates the banner text and visual state.

### `setButtonState(button, options)`

Changes button label and disabled state.

Used while prediction requests are running.

### `getDisplayNameFromEmail(email)`

Creates a simple display name from email.

Example:

- `researcher@example.com` -> `researcher`

### `isSameCalendarDay(dateA, dateB)`

Used by dashboard logic to count today’s predictions.

### `setActiveNavLink(pageName)`

Marks the current page active in navigation.

### `updateProfileNameSlots(name)`

Updates topbar user-name slots on protected pages.

## Auth page logic

### `initializeAuthTabs()`

Handles switching between login and signup tabs/forms.

### `initializeAuthForms()`

Handles form submission for:

- login
- signup

What it does:

- prevent normal reload
- store local session
- redirect to predictor page

### `initializeAuthApiStatus()`

Calls `fetchHealth()` and updates the entry-page status banner.

## Shared protected-page logic

### `initializeProtectedLayout()`

Runs on pages with `data-page`.

What it does:

1. checks if a user session exists
2. redirects to auth page if not
3. updates topbar profile name
4. highlights active nav item
5. handles dropdown opening/closing
6. handles modal opening
7. handles logout

This is basically the shared app-shell controller.

## Predictor page logic

### `renderPredictionResult(predictionResult, healthInfo)`

Updates:

- score orb
- risk label
- risk summary
- prediction source
- model version display

Important detail:

- `model version` comes from `/health`
- score comes from `/predict`

### `renderPlatformOptions(platforms)`

This is one of the key new functions.

What it does:

1. finds the platform dropdown
2. clears old options
3. inserts the placeholder option
4. inserts the backend-provided platform options
5. restores the selected value if still valid

Why this function matters:

- keeps the dropdown UI
- makes the dropdown backend-driven
- avoids hardcoding the logic only in HTML

Basically the dropdown got promoted from static intern to dynamic employee.

### `initializePredictorHealthHint()`

Checks `/health` and updates:

- prediction source hint
- model version hint

### `initializePredictorPage()`

Main predictor-page controller.

What it does:

1. confirm page is predictor page
2. collect page elements
3. preload health info
4. fetch platforms from `/metadata/platforms`
5. use backend options if available
6. keep HTML fallback options if metadata fetch fails
7. handle prediction form submit

### Predictor submit flow

When user clicks `Predict Risk`:

1. default form reload is prevented
2. form data is collected
3. submit button becomes disabled
4. neutral status message is shown
5. `MindTraceAPI.submitPrediction(formData)` is called
6. validated backend response comes back
7. frontend extracts percentage
8. frontend builds label + summary
9. result is rendered
10. prediction is saved locally
11. success or error banner is shown
12. button returns to normal

## Dashboard logic

### `renderDashboardHistory()`

Reads browser-saved history and calculates:

- predictions today
- average score

### `renderDashboardHealth()`

Calls `/health` and updates model status card.

### `initializeDashboardPage()`

Runs the dashboard page setup:

- render local stats
- render backend health

## App startup

### `initializeApp()`

This is the app entry function.

It runs:

1. auth tab setup
2. auth form setup
3. auth API status setup
4. protected layout setup
5. predictor page setup
6. dashboard page setup

That is the frontend startup chain.

## 7. Frontend and backend concern split

The current split is now cleaner across the full stack:

### Frontend

- `api.js` handles transport + backend communication
- `app.js` handles UI + page state

### Backend

- `config/` handles shared options
- `schema/` handles validation
- `model/` handles prediction execution
- `backend/` handles routing

That is a much better learning architecture because each file has a more obvious job.

## 8. Final practical summary

The important current frontend truths are:

- the platform field is still a dropdown
- the dropdown can now be filled from backend metadata
- the frontend still keeps safe HTML fallback options
- the frontend still derives the risk label from the returned percentage
- the frontend now works with a richer validated backend response

So the UI still behaves like before, but the logic underneath is now more structured, more reusable, and less likely to randomly combust at 2 a.m.
