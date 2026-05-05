# Frontend v2 Preview (`app-web-v2`)

This workspace is the side-by-side frontend v2 preview.

- Existing v1 UI remains at `platform/app-web`.
- This scaffold does not replace or modify v1.
- This preview implements Batch 1 app surfaces with mock `/api/v2` facade contracts.

## Current status

- Vite + React + TypeScript app with dark-mode design tokens.
- Batch 1 app surfaces implemented: Launchpad, Command Center, Network Digital Twin, Change Safety.
- Typed mock facade contracts and fixtures under `/api/v2` client layer.
- Runtime packaging available via Docker + nginx on port `8089`.

## Non-claims

- This workspace is not functionally complete beyond Batch 1 preview scope.
- This workspace does not provide production readiness.
- This workspace does not enable autonomous remediation or backend mutation.
- This workspace is not a cutover; v1 remains the rollback path.

## Commands

Local development:

```bash
npm install
npm run dev
```

Validation (task-required):

```bash
docker run --rm -v "$(pwd):/app" -w /app node:22-alpine sh -c "npm ci --no-fund --no-audit && npm test && npm run build"
```

Runtime preview image:

```bash
cd ../
docker build -t platform-app-web-v2:0.1.0 app-web-v2
```
