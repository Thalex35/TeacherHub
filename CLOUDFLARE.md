# Cloudflare Workers

The web application is built with the Cloudflare Vite plugin. `src/server.ts`
is the Worker entry point; the separate `teacherhub-ai` service remains a
Node.js service and is not included in this Worker.

## Build and preview

```sh
npm run cf-typegen
npm run build
npm run preview
```

For Cloudflare Git builds, set the install command to `npm ci`, the build
command to `npm run build`, and the deploy command to `npx wrangler deploy`.
Both npm and Bun lockfiles are tracked, so configure npm explicitly rather than
relying on automatic package-manager detection.

For local Worker development, provide the bindings in an ignored `.dev.vars`
file and run `npm run wrangler:dev`. Do not commit `.dev.vars` or production
credentials.

## Cloudflare configuration

Set these Worker secrets/bindings in the Cloudflare dashboard or Wrangler:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEACHERHUB_AI_SERVICE_URL`
- `TEACHERHUB_AI_SERVICE_TOKEN`

If the existing Lovable cron-auth helper is enabled later, configure
`LOVABLE_CRON_SECRET`; `LOVABLE_CRON_SECRET_PREVIOUS` is optional during secret
rotation.

The public browser bundle also needs `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` as build-time variables. These are public
Supabase configuration values; never place service-role or shared AI service
tokens in `VITE_*` variables.

The Worker calls the AI service over HTTPS. Configure its URL and matching
shared token on both server-side services. The token must not be sent to the
browser.
