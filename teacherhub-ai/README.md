# TeacherHub AI service

The ADK agent runs as a Node service. The Teacher Desk app calls it through its authenticated server function; the browser does not call this service directly.

## Local setup

1. Copy `.env.example` to `.env` and set `GOOGLE_GENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and a high-entropy `TEACHERHUB_AI_SERVICE_TOKEN`. `TEACHERHUB_BASE_URL` must point to the running TeacherHub app.
2. Set `TEACHERHUB_AI_SERVICE_URL` and the same `TEACHERHUB_AI_SERVICE_TOKEN` in the TeacherHub server environment. Do not set or copy a service-role key into this package.
3. Start the TeacherHub app and, in a second terminal, run `npm run serve` from this directory.

Only local HTTP URLs are accepted for development. Use HTTPS for non-local TeacherHub and AI service URLs.

The current ADK session store is in-memory and scoped by verified Supabase user ID. Conversations and pending confirmations are lost when the AI service process restarts; use one service instance until a persistent ADK session store is configured.
