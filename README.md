# AttendX Admin

React and Vite administration panel for AttendX attendance data.

## Setup

Use Node.js 20 or later, then run `npm install`. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend base URL. Start development with `npm run dev`.

## Scripts

- `npm run lint`
- `npm test`
- `npm run build`

## Deployment

Vercel serves the Vite build and uses the SPA rewrite and basic security headers in `vercel.json`. Set `VITE_API_BASE_URL` in the Vercel project environment variables.
