# SAFEHELM — Complete Live Demo

## Structure
- `frontend/` — responsive command-center dashboard
- `backend/` — Express API, live simulator, risk engine and ESP32 telemetry endpoint

## Run locally
Requirements: Node.js 18+

```bash
cd backend
npm install
npm start
```

Open:
`http://localhost:5000`

The dashboard automatically polls the backend every second.

## Live demo
Click **SIMULATE HAZARD**. For about 15 seconds the engine produces:
- high temperature
- gas anomaly
- impact signature
- elevated vital signal

The AI risk engine converts these signals into a threat score, changes the helmet state, creates active alerts and records an incident.

## ESP32-ready API
Send real readings to:

`POST /api/telemetry`

Example JSON:
```json
{
  "deviceId":"SAFEHELM-ESP32-01",
  "temperature":34.2,
  "gas":21,
  "motion":1.01,
  "heart":79,
  "gps":"17.45,78.38"
}
```

The backend returns the calculated risk.

## Deployment
For Render/Railway/other Node hosts:
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Then set the frontend API URL by opening the browser console and running:
`localStorage.setItem("safehelm_api","https://YOUR-BACKEND-URL")`
and reload.

For GitHub Pages frontend-only deployment, the UI also has a fallback simulation, but the full alert/incident API requires the backend URL.
