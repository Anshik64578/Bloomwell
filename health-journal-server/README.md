# Health Journal Server

REST API for the Intelligent Health Journal. A wellness tracking tool, not a medical diagnosis system.

## Setup
```bash
npm install
cp .env.example .env    # then set JWT_SECRET and MONGO_URI
npm run dev
```

## Endpoints
| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | /api/health | no | Health check |
| POST | /api/auth/signup | no | `{name, email, password}` |
| POST | /api/auth/login | no | `{email, password}` returns `{token, user}` |
| GET | /api/auth/me | yes | Current user |
| POST | /api/entries | yes | Create an entry (one per day) |
| GET | /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD | yes | List entries |
| GET | /api/entries/:id | yes | One entry |
| PUT | /api/entries/:id | yes | Partial update |
| DELETE | /api/entries/:id | yes | Delete |

Send the token as `Authorization: Bearer <token>`.

## Example entry
```json
{
  "date": "2026-09-30",
  "mood": 4,
  "symptoms": [{ "name": "headache", "severity": 2 }],
  "sleepHours": 7.5,
  "waterGlasses": 6,
  "exercise": { "type": "walking", "minutes": 30 },
  "notes": "Felt good after the walk."
}
```
