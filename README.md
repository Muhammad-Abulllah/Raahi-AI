# Raahi

Raahi is a React + Vite AI tourism guide for Pakistan. The Gemini API key is used only by the Express server, so it is safe to deploy publicly when the key is stored as a server environment variable.

## Run in browser
App URL : https://raahi-ai-dkoatkiunq-uc.a.run.app/
## Run Locally

Prerequisite: Node.js

1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`.
3. Start the API server:
   `npm run server`
4. In another terminal, start the Vite app:
   `npm run dev`

## Production

Build the frontend and run the Express server:

```bash
npm run build
npm start
```

The browser calls `/api/chat`; Gemini runs only on the server, so `GEMINI_API_KEY` stays in your hosting provider's environment variables.

## Deployment Suggestions

- Render Web Service: easiest full-stack Node deploy. Build command: `npm install && npm run build`. Start command: `npm start`. Add `GEMINI_API_KEY` in Environment.
- Railway: simple Node deployment with private environment variables and GitHub auto-deploy.
- Fly.io: good if you want more control over regions and scaling.
- Google Cloud Run: strong production option, especially because Gemini is a Google service. Store the key in Secret Manager or Cloud Run environment variables.

Avoid static-only hosting like GitHub Pages, Netlify static, or Vercel static export unless you also add a serverless API route. A pure static frontend cannot keep an API key secret.
