# Children Management desktop app

## Development

- Web app: `bun run dev`
- Electron with the Vite dev server: `bun run electron:dev`

## Windows installer

Run `bun run electron:build`. The web production build is bundled into Electron and the Windows NSIS installer is written to `release-electron/`.

The installed application serves the bundled web assets locally through a private Electron protocol. It does not require Node, Bun, or a development server after installation. Supabase remains the backend, using only the public `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values in the renderer.

## Releases and updates

Create a GitHub Release whose tag matches the semantic version, for example `v1.0.1`. Add the repository Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` first. The release workflow builds and uploads `Children-Management-Setup-1.0.1.exe`. Installed copies check the configured `Thalex35/Teacher-Desk` GitHub Releases feed after launch, ask before downloading, and offer a restart when the update is ready.

The stable application id is `com.thalex35.childrenmanagement`. Do not change it between releases. GitHub Actions uses its built-in `GITHUB_TOKEN`; no service-role or signing credentials are stored in the repository.

Windows code signing is not configured. Unsigned installers may show a SmartScreen warning until the publisher reputation is established. Code signing can be added later through GitHub Secrets without changing the application id.
