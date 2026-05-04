# Frontend Phase 0 Design, Accessibility, and Runtime Checklist

This Phase 0 appendix captures design-system extraction notes, accessibility acceptance criteria, and packaged runtime checks for the frontend rewrite.

Status: **complete for Phase 0**. This checklist defines the design, accessibility, and packaged-runtime gates that later phases must satisfy. Implementation of new primitives, `aria-live` policy, flagged shell smoke checks, and cutover runtime validation remains assigned to Phase 2/Phase 3/cutover work, not Phase 0 inventory.

## Style Source Inventory

| File | Current role | Rewrite disposition |
| --- | --- | --- |
| `platform/app-web/src/styles.css` | Large legacy/global stylesheet with many route- and feature-specific classes. | Extract semantic class families before replacing. |
| `platform/app-web/src/styles/tokens.css` | Current CSS variables for background, text, accent, severity colors, radius, spacing, shadow. | Use as seed for design tokens. |
| `platform/app-web/src/styles/base.css` | Base/global rules. | Preserve reset, font, body, and focus behavior after audit. |
| `platform/app-web/src/styles/shell.css` | App shell layout, sidebar, topbar, nav, route context, command area. | Must be parity-inventoried before new shell cutover. |
| `platform/app-web/src/styles/workspace.css` | Workspace header, toolbar, segmented controls, cards, query/callout styling, global search. | Use as source for workspace primitives. |

## Current Token Families

| Token family | Current examples | Rewrite requirement |
| --- | --- | --- |
| Background | `--app-bg`, `--app-bg-elevated`, `--app-bg-panel`, `--app-bg-panel-strong`, `--app-bg-accent` | Preserve dark operator UI contrast and panel hierarchy. |
| Border | `--app-border`, `--app-border-strong` | Preserve panel/card/route-context separation. |
| Text | `--app-text`, `--app-text-muted`, `--app-text-soft` | Preserve readable primary/secondary/caveat hierarchy. |
| Accent | `--app-accent`, `--app-accent-strong` | Preserve nav/eyebrow/action emphasis. |
| Severity | `--app-success`, `--app-warning`, `--app-danger` | Do not use success color to imply safe-to-execute. |
| Shape/spacing | `--app-radius-*`, `--app-space-*`, `--app-shadow` | Normalize into design-system primitives. |

## Semantic Class Families to Preserve or Replace Deliberately

| Class family | Current meaning | Rewrite primitive candidate |
| --- | --- | --- |
| `.app-shell*` | Shell grid, sidebar, topbar, route context, command/search area. | `AppShell`, `PrimaryNavigation`, `RouteContextBar`. |
| `.app-nav-button*`, `.nav-item*` | Navigation item states and active route. | `NavButton` with `aria-current`. |
| `.workspace-*` | Workspace page/header/actions/toolbar/segmented controls. | `WorkspacePage`, `WorkspaceHeader`, `WorkspaceToolbar`, `Tabs`. |
| `.summary-card`, `.detail-card` | Card-level data display. | `Card`, `SummaryCard`, `DetailCard`. |
| `.query-message`, `.callout` | Empty/error/degraded/caveat display. | `QueryState`, `CaveatCallout`. |
| `.global-operator-search*` | Always-on search command surface. | `GlobalSearch`. |
| `.inline-action`, `.shell-action-button`, `.btn*` | Button/action variants. | `Button` variants with state-changing semantics. |
| feature-specific workspace classes | Domain-specific panels and product surfaces. | Migrate only after behavior inventory; avoid blind deletion. |

## Design-System Acceptance Criteria

The new design system can be used for feature migration only when:

- loading, refreshing, error, empty, sparse, unsupported, partial, and success states have reusable components;
- navigation actions and state-changing actions are visually distinct;
- download/report/export actions show their envelope/report family;
- safe-action and rollback controls visually show prerequisites and gate context;
- warning/caution colors do not imply backend approval or safe execution;
- object identity, evidence source, freshness, and caveats have reusable display components;
- responsive shell and global search remain usable on narrow screens.

## Accessibility Checklist

| Area | Required checks before cutover |
| --- | --- |
| Shell navigation | Keyboard reachable; active item exposed; `aria-current` or equivalent preserved. |
| Skip/main content | Preserve a skip path or direct main landmark navigation. |
| Global search | Input has label, loading/error/no-hit states are announced or visible, result buttons are keyboard reachable. |
| Route changes | New route context/breadcrumbs should not trap focus; active page title remains clear. |
| Buttons | Use real `<button>` for actions; avoid link-like buttons without accessible names. |
| State-changing actions | Disabled/loading/error state announced through visible text; no icon-only critical controls. |
| Forms | Labels associated with fields; validation errors visible; setup forms keyboard usable. |
| Tables/lists | Preserve row headers/labels where current tables carry object identity. |
| File import/replay | File input is labeled; parse errors visible; frozen/offline state explicit. |
| Downloads | Buttons identify artifact family and format. |
| Responsive shell | Sidebar/menu state keyboard operable; no inaccessible overlay trap. |

## Runtime Source Inventory

| File | Current role | Rewrite/cutover requirement |
| --- | --- | --- |
| `platform/app-web/package.json` | React/Vite/TypeScript/Vitest scripts. | Preserve `build`, `test`, and dev/preview behavior unless migration is documented. |
| `platform/app-web/Dockerfile` | Node 22 build stage, nginx runtime stage, `npm run build`, serves on 8088. | New app must build through same image path or have documented replacement. |
| `platform/app-web/nginx.conf` | Serves static files, proxies `/api/` to `app-api:8000`, SPA fallback to `/index.html`, 120s API timeouts. | Preserve same-origin `/api` production proxy and SPA fallback. |
| `platform/app-web/scripts/start-app-web.sh` | Validates html root/index and nginx config before start. | Preserve startup guardrails. |
| `platform/app-web/vite.config.ts` | Vite build/dev/test config and `/api` dev proxy. | Preserve API proxy/dev base-url behavior. |
| `platform/INSTALLATION-INSTRUCTIONS.md` | Primary validation path and host-tooling caveats. | Follow platform validation rule; do not default to host-side npm for final validation. |

## Packaged Runtime Checklist

Before cutover, verify:

- `npm run build` still runs inside the app-web Docker build stage;
- nginx serves built assets from `/usr/share/nginx/html`;
- `/api/` proxy continues to target `app-api:8000`;
- proxy timeouts remain sufficient for cold/large app-api reads;
- SPA fallback preserves deep links and route aliases;
- healthcheck on `http://127.0.0.1:8088/` still passes;
- `start-app-web.sh` validates the entrypoint file and nginx config;
- feature flag default is correct in packaged runtime;
- exported/downloaded files work through the nginx proxy;
- old `?view=` aliases work in packaged runtime.

## Validation Commands

Follow the platform validation rule from `platform/INSTALLATION-INSTRUCTIONS.md`; do not default to host-side `npm` for final frontend validation.

Primary cutover validation from `platform/`:

```bash
./scripts/build-images.sh
clab deploy -t topology.clab.yml -c
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

Optional focused frontend test flow when Vitest is needed on a Linux host with Docker but without aligned local Node tooling:

```bash
docker run --rm -v "$(pwd)/app-web:/app" -w /app node:22-alpine sh -c "npm ci --no-fund --no-audit && npm test"
```

## Phase 0 Closure

- Style source and semantic class families are inventoried above.
- Accessibility acceptance areas are defined above and remain Phase 2 design-system gates.
- Packaged runtime checks are defined above and remain cutover validation gates.
- Focused unit-level parity remains separate from packaged runtime validation.
