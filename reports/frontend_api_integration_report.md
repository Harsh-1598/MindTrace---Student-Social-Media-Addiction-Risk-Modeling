# MindTrace Frontend API Integration Report

## 1. What this frontend is doing

This frontend has 3 jobs:

1. show the same UI pages nicely
2. collect user input
3. send the correct data to the FastAPI backend and show the result back on screen

The frontend was rebuilt from scratch in plain:

- `HTML`
- `CSS`
- `JavaScript`

The UI/UX was kept the same, so the pages still look and flow the same way.  
Only the logic underneath was rebuilt.

## 2. File structure used

- `frontend/index.html`
- `frontend/predictor.html`
- `frontend/dashboard.html`
- `frontend/css/styles.css`
- `frontend/js/api.js`
- `frontend/js/app.js`

## 3. Why the JavaScript is split into 2 files

The JS is split on purpose so things do not become one giant confusion sandwich.

### `frontend/js/api.js`

This file handles:

- backend URL
- API calls
- request error handling
- form data to backend payload conversion
- prediction response cleanup

So this file is the "talk to FastAPI" person.

### `frontend/js/app.js`

This file handles:

- login/signup tab switching
- local session storage
- dropdown and modal behavior
- predictor page behavior
- dashboard page behavior
- rendering results on screen

So this file is the "control the page" person.

Easy memory trick:

- `api.js` = talks to backend
- `app.js` = talks to the page

## 4. HTML pages and what each one does

### `index.html`

This is the entry page.

It has:

- login form
- signup form
- API connection status banner

Even though there is no real backend auth yet, this page still stores a basic user session in the browser so the app flow works properly.

### `predictor.html`

This is the main prediction page.

It has:

- student details form
- status banner
- result card
- accuracy notice card

This page sends form data to FastAPI using `POST /predict`.

### `dashboard.html`

This is the stats page.

It has 3 cards:

- predictions today
- average risk score
- model status

This page mixes:

- browser-stored prediction history
- backend health data from `GET /health`

## 5. Full logic of `api.js`

This file was written from scratch to keep backend-related logic in one place.

## `const MindTraceAPI = (() => { ... })();`

This is an IIFE.

That means the code runs immediately and returns one clean object containing only the functions we want to use.

Why this was used:

- avoids leaking random variables into global scope
- keeps API code grouped together
- gives a single shared object: `MindTraceAPI`

## `API_BASE_URL`

```js
const API_BASE_URL = window.MINDTRACE_API_BASE_URL || "http://127.0.0.1:8000";
```

This stores the backend URL.

Why this logic was used:

- it works locally by default
- if needed later, the URL can be changed from outside without editing every fetch call

Basically: one source of truth, less pain, more peace.

## `createDefaultHeaders()`

```js
const createDefaultHeaders = () => ({
  "Content-Type": "application/json",
});
```

This returns the default request headers for API calls.

Why this function exists:

- all requests sending JSON need this header
- it avoids repeating the same object again and again

Small function, but solid function. Tiny intern doing honest work.

## `readJsonResponse(response)`

This checks whether the response is actually JSON before trying to read it.

Why this matters:

- calling `response.json()` on non-JSON can break things
- this makes the API helper safer

If the response is JSON, it returns the parsed object.  
If not, it returns `null`.

## `formatValidationErrors(detailList)`

This turns FastAPI validation errors into readable text.

FastAPI often returns errors like:

```json
{
  "detail": [
    {
      "loc": ["body", "Age"],
      "msg": "Input should be less than 30"
    }
  ]
}
```

This function converts that into something easier like:

```txt
Age: Input should be less than 30
```

Why this was used:

- beginner-friendly error output
- easier debugging
- better user feedback

## `getErrorMessage(payload, statusCode)`

This decides what error message to show.

It checks:

1. if FastAPI sent validation errors
2. if FastAPI sent a normal text detail
3. otherwise it falls back to a generic status message

Why this logic was used:

- keeps error handling centralized
- makes the rest of the app code simpler

## `requestJson(endpoint, options = {})`

This is the main reusable fetch helper.

It does 4 things:

1. sends the request
2. reads the response
3. checks whether the request succeeded
4. throws a clean error if it failed

Why this was used:

- no repeating fetch boilerplate
- same error handling for all endpoints
- cleaner code in predictor and dashboard logic

This is one of the most important functions in the frontend.

## `toNumber(value)`

This converts input values into numbers.

Why it exists:

- form values come in as strings
- FastAPI expects real numbers for numeric fields

Without this, JavaScript would be sending `"19"` instead of `19`, and then life becomes annoying for no reason.

## `buildPredictionPayload(formData)`

This converts the form field names into the exact backend format.

Example:

- frontend field name: `usageHours`
- backend field name: `Avg_Daily_Usage_Hours`

Why this function is important:

- frontend HTML can use readable names
- backend still gets the exact schema it expects
- mapping logic stays in one place

This function is the translator between frontend-world and backend-world.

## `normalizePredictionScore(apiResponse)`

The current backend returns:

```json
{ "The prediction is": 63.7 }
```

This function reads that value and turns it into a safe frontend score.

It does 3 things:

1. reads `"The prediction is"`
2. converts it to a number
3. clamps it between `0` and `100`

Why this logic was used:

- protects the UI from weird values
- gives a clean score for display

## `buildRiskMessage(score)`

The backend only returns the raw prediction score.  
It does not return risk labels like:

- Low Risk
- Moderate Risk
- High Risk

So the frontend creates those labels itself.

Logic used:

- `70+` = `High Risk`
- `45+` = `Moderate Risk`
- below that = `Low Risk`

It also creates the summary text shown in the result card.

Why this logic was used:

- backend remains unchanged
- frontend still gives a polished UX
- easier for learners to see that "raw API data" and "UI-friendly messaging" can be separate things

## `fetchHealth()`

This calls:

```txt
GET /health
```

It is used in:

- login page status banner
- predictor page model/version hint
- dashboard model status card

Why this function exists:

- backend status is needed in multiple places
- reusing one function keeps code clean

## `submitPrediction(formData)`

This is the prediction API function.

It does:

1. builds the backend payload
2. sends `POST /predict`
3. reads the API response
4. normalizes the score
5. creates the label and summary
6. returns a frontend-friendly result object

This returned object looks like:

- `score`
- `label`
- `summary`
- `payloadSent`
- `rawResponse`

Why this was used:

- `app.js` gets one clean object to render
- all backend translation stays inside `api.js`

## 6. Full logic of `app.js`

This file controls everything users can see or do.

It is wrapped in:

```js
(() => {
  ...
})();
```

This is again an IIFE.

Why used here:

- keeps variables private
- avoids polluting the global scope
- makes the app logic self-contained

## `STORAGE_KEYS`

This object stores browser storage key names in one place.

It contains:

- `session`
- `predictionHistory`

Why this was used:

- avoids typo bugs
- easier to update later

Because yes, one typo in a storage key can waste 20 minutes and make you question your career.

## `cssStatusClasses`

This stores the status banner class names:

- `status-neutral`
- `status-success`
- `status-error`

Why this was used:

- easier class cleanup
- no repeating the same array manually everywhere

## DOM helper functions

### `getBodyPage()`

Reads:

```html
<body data-page="predictor">
```

or

```html
<body data-page="dashboard">
```

Why this matters:

- helps the JS know which page it is currently running on
- stops predictor logic from running on dashboard page and vice versa

### `query()` and `queryAll()`

These are shorthand helpers for:

- `querySelector`
- `querySelectorAll`

Why they exist:

- less repetitive code
- easier to read

## Storage helper functions

### `readJsonStorage(key, fallbackValue)`

Reads JSON from `localStorage`.

If parsing fails, it returns a safe fallback value instead.

Why this matters:

- protects the app from broken or manually edited storage data

### `writeJsonStorage(key, value)`

Stores JavaScript data into `localStorage` as JSON.

Used for:

- session data
- prediction history

### `getSession()`, `saveSession()`, `clearSession()`

These manage the current user session in browser storage.

Why this was used:

- there is no backend auth system yet
- but the app still needs login-like flow

So this is lightweight frontend session handling.

### `getPredictionHistory()`, `savePredictionHistory()`, `addPredictionToHistory()`

These manage past predictions in browser storage.

Why this was used:

- dashboard needs data
- backend does not store prediction history yet

`addPredictionToHistory()` also limits history size to 25 items so local storage does not grow forever like an unmonitored snack stash.

## Small UI helper functions

### `redirectTo(path)`

Moves the user to another page.

Used after:

- login
- signup
- logout

### `setText(element, value)`

Safely updates text content if the element exists.

Why used:

- prevents repeated null checks everywhere

### `setStatusBanner(element, message, tone)`

Updates a banner’s text and its state color.

Possible tones:

- `neutral`
- `success`
- `error`

Why used:

- the same pattern is needed on multiple pages
- keeps status messages consistent

### `setButtonState(button, options)`

Changes a button’s:

- label
- disabled state

Used on the predictor submit button while API request is running.

Why used:

- prevents repeated clicks
- shows the user that something is happening

### `getDisplayNameFromEmail(email)`

If user logs in with:

```txt
researcher@example.com
```

this creates:

```txt
researcher
```

as the display name.

Why used:

- gives a friendly profile name without needing backend auth

### `isSameCalendarDay(dateA, dateB)`

Checks whether two dates are on the same day.

Used by the dashboard for "Predictions Today".

## Navigation and profile helpers

### `setActiveNavLink(pageName)`

Highlights the current page in the navigation bar.

### `updateProfileNameSlots(name)`

Updates all `#profile-name` elements with the current user name.

Why this matters:

- same top bar is reused across pages

## Auth page functions

### `initializeAuthTabs()`

Handles switching between:

- login form
- signup form

It toggles the `active` class on:

- tab buttons
- forms

Why used:

- keeps the auth UI interactive without reloading the page

### `initializeAuthForms()`

Adds submit behavior for login and signup.

#### Login flow

1. stop normal form reload
2. read email
3. create display name from email
4. save session to local storage
5. go to `predictor.html`

#### Signup flow

1. stop normal form reload
2. read name and email
3. save session
4. go to `predictor.html`

Why this was used:

- the app feels complete
- still works even without backend auth APIs

### `initializeAuthApiStatus()`

Checks whether FastAPI is running using `fetchHealth()`.

If successful:

- shows connected status

If failed:

- shows backend offline message

Why this is useful:

- user gets backend info immediately
- avoids confusion before trying the predictor

## Shared protected layout function

### `initializeProtectedLayout()`

This runs on pages with `data-page`.

It does a lot of shared app work:

1. checks if a user session exists
2. redirects to `index.html` if not logged in
3. updates profile name
4. highlights active nav link
5. opens/closes profile dropdown
6. opens accuracy notice modal
7. handles logout

Why this was used:

- predictor and dashboard share the same header behavior
- putting it in one function avoids duplicate code

This function is basically the "common app shell manager".

## Predictor page functions

### `renderPredictionResult(predictionResult, healthInfo)`

This updates:

- score orb
- risk label
- risk summary
- prediction source text
- model version text

Why used:

- keeps DOM rendering separate from request logic
- easier to read and maintain

### `initializePredictorHealthHint()`

This runs when predictor page loads.

It checks backend health and updates:

- source label
- model version label

If backend is reachable, the page shows it is ready.  
If not, it shows FastAPI is offline.

Why used:

- gives immediate context before form submission

### `initializePredictorPage()`

This is the main predictor page controller.

It does:

1. check that the current page is really the predictor page
2. get form and button elements
3. preload backend health info
4. listen for form submit
5. send form data to the API
6. render result
7. store prediction in browser history
8. update banner state

### Predictor submit flow in simple steps

When user clicks `Predict Risk`:

1. form submission is stopped from reloading the page
2. form data is read
3. button becomes disabled
4. neutral status message is shown
5. `MindTraceAPI.submitPrediction(formData)` is called
6. result is shown on screen
7. result is saved to local history
8. success or error banner is shown
9. button returns to normal

That is the full predictor life cycle.

No black magic. Just organized button drama.

## Dashboard functions

### `renderDashboardHistory()`

This reads saved prediction history from local storage.

Then it calculates:

- how many predictions were made today
- average score across saved predictions

It updates:

- `#predictions-today-value`
- `#predictions-today-copy`
- `#average-risk-value`
- `#average-risk-copy`

Why used:

- dashboard becomes useful even without backend database storage

### `renderDashboardHealth()`

This calls `MindTraceAPI.fetchHealth()`.

Then it updates:

- model status card title
- model status explanation text

If backend is offline:

- dashboard shows offline state clearly

Why used:

- dashboard should reflect real backend availability

### `initializeDashboardPage()`

This checks that the current page is `dashboard`.

Then it runs:

- `renderDashboardHistory()`
- `renderDashboardHealth()`

Simple and clean. No extra circus.

## App startup

### `initializeApp()`

This is the main entry function.

It runs:

1. auth tabs setup
2. auth forms setup
3. auth API status setup
4. protected layout setup
5. predictor page setup
6. dashboard page setup

Why this function exists:

- one clean place to start the whole frontend
- easier to understand startup order

At the end of the file:

```js
initializeApp();
```

That kicks the entire frontend on.

## 7. Why the frontend field values were kept strict

The predictor form uses ranges like:

- age `11` to `29`
- usage hours `0.1` to `9.9`
- sleep hours `3.1` to `9.9`
- mental health `4.1` to `8.9`
- conflicts `1` to `4`

Why this was done:

- these match the current FastAPI validation rules better
- reduces `422` validation errors

So the frontend is trying to stop bad inputs before the backend has to yell at them.

Very considerate behavior. Gold star.

## 8. Why `Country` is shown but not sent to the backend

The UI already had a `Country` field and you wanted the same page structure and UX.

So the field was kept in the form.

But the current backend prediction schema does not use it.

So the frontend:

- keeps the field visible
- does not send it in the API payload
- only stores it in local history for dashboard-side context if needed later

Why this was the right choice:

- preserves the UI
- respects the existing backend
- keeps the integration honest

## 9. Full frontend flow from start to finish

### Login page flow

1. page loads
2. auth tab logic is activated
3. API status banner checks backend
4. user logs in or signs up
5. session is saved in local storage
6. user goes to predictor page

### Predictor page flow

1. page checks if session exists
2. topbar logic is activated
3. backend health hint is shown
4. user fills form
5. form is converted into backend payload
6. payload is sent to FastAPI
7. raw prediction score is returned
8. frontend converts score into risk label + summary
9. result is shown
10. prediction is saved to local history

### Dashboard flow

1. page checks if session exists
2. local prediction history is loaded
3. today count is calculated
4. average score is calculated
5. backend health is checked
6. model status card is updated

## 10. Final takeaway

This frontend was rebuilt from scratch with a very intentional split:

- `api.js` handles backend communication
- `app.js` handles page behavior

That split makes the project easier to learn because you can study one concern at a time.

If you want to understand it in the most brain-friendly order, go like this:

1. read `predictor.html`
2. read `api.js`
3. read `initializePredictorPage()` inside `app.js`
4. then read the storage and dashboard functions

That path is the least likely to make your brain open 47 tabs and crash.
