import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "../src/components/shell";
import { ErrorState, QueryStateDetailCard, QueryStateSummaryCard } from "../src/components/query-states";
import { ApiClientError } from "../src/api/client";
import {
  DsBackendEcho,
  DsButton,
  DsDisabledActionArea,
  DsEvidenceCaveat,
  DsEvidenceList,
  DsFormField,
  DsKeyValueGrid,
  DsNonClaimBanner,
  DsPage,
  DsSplitDetail,
  DsTabbedPage,
  DsTabs,
  DsTextInput,
} from "../src/design-system";

describe("Phase 2 design-system foundation", () => {
  it("renders token-backed layout primitives and tab semantics", () => {
    const html = renderToStaticMarkup(
      <DsPage>
        <DsTabbedPage>
          <DsTabs
            ariaLabel="Policy tabs"
            activeId="dossier"
            tabs={[
              { id: "dossier", label: "Dossier" },
              { id: "timeline", label: "Timeline" },
            ]}
            onSelect={() => undefined}
          />
        </DsTabbedPage>
        <DsSplitDetail>
          <article>left</article>
          <article>right</article>
        </DsSplitDetail>
      </DsPage>,
    );
    expect(html).toContain("class=\"ds-page\"");
    expect(html).toContain("class=\"ds-tabbed-page\"");
    expect(html).toContain("role=\"tablist\"");
    expect(html).toContain("aria-selected=\"true\"");
    expect(html).toContain("class=\"ds-split-detail\"");
  });

  it("renders action button variants with distinct semantics", () => {
    const html = renderToStaticMarkup(
      <div>
        <DsButton variant="navigation">Nav</DsButton>
        <DsButton variant="secondary">Secondary</DsButton>
        <DsButton variant="download">Download</DsButton>
        <DsButton variant="state-changing">Change</DsButton>
        <DsButton variant="destructive">Unsafe</DsButton>
      </div>,
    );
    expect(html).toContain("ds-button--navigation");
    expect(html).toContain("ds-button--secondary");
    expect(html).toContain("ds-button--download");
    expect(html).toContain("ds-button--state-changing");
    expect(html).toContain("ds-button--destructive");
  });

  it("renders data-display and form primitives for representative fixtures", () => {
    const html = renderToStaticMarkup(
      <div>
        <DsKeyValueGrid
          items={[
            { label: "Source", value: "backend" },
            { label: "Freshness", value: "current" },
          ]}
        />
        <DsEvidenceList items={["caveat one", "caveat two"]} />
        <DsFormField label="policy_id" htmlFor="policy_id" message="Required for workflow creation">
          <DsTextInput id="policy_id" name="policy_id" defaultValue="p:1" />
        </DsFormField>
        <DsDisabledActionArea>Action remains disabled until prerequisites are met.</DsDisabledActionArea>
      </div>,
    );
    expect(html).toContain("class=\"ds-kv-grid\"");
    expect(html).toContain("class=\"ds-list\"");
    expect(html).toContain("class=\"ds-form-field\"");
    expect(html).toContain("for=\"policy_id\"");
    expect(html).toContain("class=\"ds-disabled-action-area\"");
  });

  it("renders reusable bounded copy/caveat components", () => {
    const html = renderToStaticMarkup(
      <div>
        <DsNonClaimBanner title="Execution boundary">Not safe-to-execute proof.</DsNonClaimBanner>
        <DsEvidenceCaveat title="Evidence caveat">Partial evidence only.</DsEvidenceCaveat>
        <DsBackendEcho title="Backend echo">Read-side bounded context.</DsBackendEcho>
      </div>,
    );
    expect(html).toContain("ds-copy-banner--non-claim");
    expect(html).toContain("ds-copy-banner--caveat");
    expect(html).toContain("ds-copy-banner--backend-echo");
  });

  it("keeps shell skip-link/focus semantics and uses design-system buttons", () => {
    const html = renderToStaticMarkup(
      <AppShell
        title="Platform"
        navigationGroups={[
          {
            id: "evidence",
            label: "Evidence",
            items: [{ id: "overview", label: "Overview", description: "Read-side summary" }],
          },
        ]}
        activeItemId="overview"
        onSelect={() => undefined}
        currentGroupLabel="Evidence"
        currentPageLabel="Overview"
        currentPageDescription="Read-side status and pivots."
        environmentSummary="lab"
        routeContextCount={1}
        onCopyLink={vi.fn()}
        copyState="idle"
        onResetContext={vi.fn()}
      >
        <section>Body</section>
      </AppShell>,
    );
    expect(html).toContain("Skip to main content");
    expect(html).toContain("aria-current=\"page\"");
    expect(html).toContain("ds-button--navigation");
    expect(html).toContain("id=\"app-main\"");
  });

  it("keeps query-state components aligned with loading/error/empty style families", () => {
    const retry = vi.fn();
    const error = new ApiClientError("boom", 500);
    const html = renderToStaticMarkup(
      <div>
        <ErrorState error={error} onRetry={retry} />
        <QueryStateSummaryCard title="Data" stateLabel="Partial" detail="Sparse evidence returned." tone="warn" />
        <QueryStateDetailCard title="Timeline" stateLabel="Unavailable" detail="No snapshots found." tone="error" onRetry={retry} />
      </div>,
    );
    expect(html).toContain("Unable to load data");
    expect(html).toContain("data-query-kind=\"partial\"");
    expect(html).toContain("data-query-kind=\"error\"");
    expect(html).toContain("aria-live=\"assertive\"");
    expect(html).toContain("role=\"alert\"");
    expect(html).toContain("Retry");
  });
});
