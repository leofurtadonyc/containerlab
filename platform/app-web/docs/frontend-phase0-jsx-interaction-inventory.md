# Frontend Phase 0 JSX Interaction Inventory

Generated from `platform/app-web/src/**/*.tsx` using the TypeScript JSX AST. This closes the Phase 0 requirement for a complete button/link/control inventory before shell or feature replacement.

## Summary

- JSX control elements indexed: 800
- `<a>`: 2
- `<button>`: 502
- `<form>`: 5
- `<input>`: 47
- `<option>`: 197
- `<select>`: 46
- `<textarea>`: 1

## Interaction Index

| Source | Element | Handler / change hook | Disabled gate | Accessibility attrs | Effect classification | Label/text preview |
| --- | --- | --- | --- | --- | --- | --- |
| `app-web/src/components/change-intelligence-overview-link.tsx:27` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/components/change-intelligence-product-surface-links.tsx:16` | `<button>` type="button" | onClick={() => navigateToEvidenceView("devices")} | none | none | button/action | none |
| `app-web/src/components/change-intelligence-product-surface-links.tsx:19` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/components/change-intelligence-product-surface-links.tsx:22` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/components/change-safety-case-actions.tsx:40` | `<button>` type="button" | onClick={() => void run("json")} | {busy !== null} | aria-busy={busy === "json"} | download/report/export action | none |
| `app-web/src/components/change-safety-case-actions.tsx:49` | `<button>` type="button" | onClick={() => void run("markdown")} | {busy !== null} | aria-busy={busy === "markdown"} | download/report/export action | none |
| `app-web/src/components/evidence-export-actions.tsx:83` | `<button>` type="button" | onClick={() => void run("json")} | {busy !== null} | aria-busy={busy === "json"} | download/report/export action | none |
| `app-web/src/components/evidence-export-actions.tsx:92` | `<button>` type="button" | onClick={() => void run("markdown")} | {busy !== null} | aria-busy={busy === "markdown"} | download/report/export action | none |
| `app-web/src/components/history-evidence-drilldown.tsx:42` | `<button>` type="button" | onClick={() => { if (t.view === "readiness") { if (t.readinessParams?.blocker) { navigateToReadinessContext({ blocker: t.readinessParams.blocker }); } else if (t.readinessParams?.prerequisite) { navigateReadinessDrilldown({ prerequisite: t.readinessParams.prerequisite }); } else { navigateToReadinessContext({}); } return; } navigateToEvidenceView(t.view); }} | none | none | button/action | none |
| `app-web/src/components/history-policy-evidence-timeline-drilldown.tsx:35` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(row.policyId)} | none | none | button/action | none |
| `app-web/src/components/history-policy-evidence-timeline-drilldown.tsx:43` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(row.policyId, dossierEntryHint)} | none | none | button/action | none |
| `app-web/src/components/impact-report-actions.tsx:40` | `<button>` type="button" | onClick={() => void run("json")} | {busy !== null} | aria-busy={busy === "json"} | download/report/export action | none |
| `app-web/src/components/impact-report-actions.tsx:49` | `<button>` type="button" | onClick={() => void run("markdown")} | {busy !== null} | aria-busy={busy === "markdown"} | download/report/export action | none |
| `app-web/src/components/query-states.tsx:37` | `<button>` type="button" | onClick={onRetry} | none | none | button/action | none |
| `app-web/src/components/query-states.tsx:83` | `<button>` type="button" | onClick={onRetry} | none | none | button/action | none |
| `app-web/src/components/query-states.tsx:107` | `<button>` type="button" | onClick={onRetry} | none | none | button/action | none |
| `app-web/src/components/read-side-query-panel.tsx:180` | `<input>` type="text" | onChange={(e) => setLimitInput(e.target.value)} | none | none | form/input change | none |
| `app-web/src/components/read-side-query-panel.tsx:193` | `<input>` type="text" | onChange={(e) => setHistoryRecentInput(e.target.value)} | none | none | form/input change | none |
| `app-web/src/components/read-side-query-panel.tsx:205` | `<input>` type="text" | onChange={(e) => setSyncRunsInput(e.target.value)} | none | none | form/input change | none |
| `app-web/src/components/read-side-query-panel.tsx:219` | `<input>` type="text" | onChange={(e) => setReadinessInput(e.target.value)} | none | none | form/input change | none |
| `app-web/src/components/read-side-query-panel.tsx:230` | `<button>` type="button" | onClick={onApply} | none | none | button/action | none |
| `app-web/src/components/read-side-query-panel.tsx:233` | `<button>` type="button" | onClick={onClear} | none | none | button/action | none |
| `app-web/src/components/shell.tsx:56` | `<a>` | none | none | none | link/navigation | none |
| `app-web/src/components/shell.tsx:82` | `<button>` type="button" | onClick={() => onSelect(item.id)} | none | aria-current={isActive ? "page" : undefined} | route/navigation action | none |
| `app-web/src/components/shell.tsx:103` | `<button>` type="button" | onClick={() => setNavOpen((open) => !open)} | none | aria-expanded={navOpen}; aria-controls="primary-navigation" | route/navigation action | none |
| `app-web/src/components/shell.tsx:127` | `<button>` type="button" | onClick={() => void onCopyLink()} | none | none | route/navigation action | none |
| `app-web/src/components/shell.tsx:130` | `<button>` type="button" | onClick={onResetContext} | {routeContextCount === 0} | none | route/navigation action | none |
| `app-web/src/features/audit/view.tsx:377` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/audit/view.tsx:617` | `<input>` | onChange={(event) => setSearchValue(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/audit/view.tsx:625` | `<select>` | onChange={(event) => setResultFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/audit/view.tsx:629` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:630` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:631` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:632` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:633` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:638` | `<select>` | onChange={(event) => setScopeFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/audit/view.tsx:642` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:643` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:644` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:645` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:646` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:651` | `<select>` | onChange={(event) => setEvidenceFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/audit/view.tsx:655` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:656` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:657` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:658` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:659` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:660` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:661` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:662` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:663` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:668` | `<select>` | onChange={(event) => setRecencyFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/audit/view.tsx:672` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:673` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:674` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:675` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:680` | `<select>` | onChange={(event) => setSortOrder(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/audit/view.tsx:681` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:682` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:683` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:684` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:685` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/audit/view.tsx:724` | `<button>` type="button" | onClick={() => setSelectedEventId(item.event_id)} | none | none | button/action | none |
| `app-web/src/features/capabilities/view.tsx:370` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/capabilities/view.tsx:391` | `<button>` type="button" | onClick={() => navigateToReadinessContext({})} | none | none | button/action | none |
| `app-web/src/features/capabilities/view.tsx:502` | `<input>` | onChange={(event) => setSearchValue(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:510` | `<select>` | onChange={(event) => setVendorFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:511` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:512` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:513` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:518` | `<select>` | onChange={(event) => setSupportFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:522` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:523` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:524` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:525` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:526` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:527` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:532` | `<select>` | onChange={(event) => setDomainFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:536` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:537` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:538` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:539` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:540` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:541` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:542` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:547` | `<select>` | onChange={(event) => setImplementationFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:551` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:552` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:553` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:554` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:555` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:560` | `<select>` | onChange={(event) => setDeliveryTierFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:564` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:565` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:566` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:567` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:568` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:573` | `<select>` | onChange={(event) => setEvidenceBasisFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:577` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:578` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:579` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:580` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:581` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:582` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:587` | `<select>` | onChange={(event) => setVendorPostureFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:591` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:592` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:593` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:594` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:599` | `<select>` | onChange={(event) => setWorkflowReadinessFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:603` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:604` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:605` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:606` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:607` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:608` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:613` | `<select>` | onChange={(event) => setWorkflowReadinessScopeFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/capabilities/view.tsx:617` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:618` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:619` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:620` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:621` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:622` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/capabilities/view.tsx:994` | `<button>` type="button" | onClick={() => setSelectedCapabilityKey(capabilityKey)} | none | none | button/action | none |
| `app-web/src/features/capabilities/view.tsx:1188` | `<button>` type="button" | onClick={() => navigateToReadinessContext({ capabilityFeature: selectedCapability.feature, }) } | none | none | button/action | none |
| `app-web/src/features/capabilities/view.tsx:1216` | `<button>` type="button" | onClick={() => navigateToReadinessContext({ blocker: blockerName, capabilityFeature: selectedCapability.feature, }) } | none | none | button/action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:63` | `<button>` type="button" | onClick={() => void onReload()} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:205` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:212` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncLim })} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:219` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspaceFromCase(data, syncLim)} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:306` | `<button>` type="button" | onClick={() => navigateToImpactReportForPolicy(pid)} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:309` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(pid, undefined, "candidates")} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:323` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: sid })} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:326` | `<button>` type="button" | onClick={() => navigateToServiceDossier({ serviceId: sid })} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:329` | `<button>` type="button" | onClick={() => navigateToImpactReportForService(sid)} | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:340` | `<button>` type="button" | onClick={() => navigateToImpactReportForMaintenance( subj.object_kind === "node" ? { nodeId: subj.object_id, previewContext: ctx } : { linkId: subj.object_id, previewContext: ctx }, ) } | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:353` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject(subj.object_id, subj.object_kind, { previewContext: ctx, }) } | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:364` | `<button>` type="button" | onClick={() => navigateToMaintenancePreviewForTopologyObject(subj.object_id, subj.object_kind, { previewContext: ctx }) } | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/change-safety-case-product.tsx:373` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(subj.object_id, subj.object_kind, { previewContext: ctx, syncRunsLimit: syncLim, }) } | none | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/view.tsx:117` | `<input>` | onChange={(e) => setServiceId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/change-safety-case/view.tsx:125` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForService(serviceId.trim())} | {!serviceId.trim()} | none | download/report/export action | none |
| `app-web/src/features/change-safety-case/view.tsx:136` | `<input>` | onChange={(e) => setPolicyId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/change-safety-case/view.tsx:144` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForPolicy(policyId.trim())} | {!policyId.trim()} | none | download/report/export action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:54` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:57` | `<button>` type="button" | onClick={() => navigateOverviewLayoutMode("cockpit")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:60` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:92` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRunsLimit, { invFrom: "delta-digest" })} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:99` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:106` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncRunsLimit, { invFrom: "delta-digest" })} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:113` | `<button>` type="button" | onClick={() => navigateToEvidenceView("devices")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:116` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:119` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:122` | `<button>` type="button" | onClick={() => navigateToEvidenceView("workflows")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:125` | `<button>` type="button" | onClick={() => navigateToEvidenceView("audit")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:130` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(examplePolicyId, "delta_digest_workspace")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:137` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(examplePolicyId, undefined, "candidates")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/delta-digest-product.tsx:147` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(exampleNodeId, "node", "delta_digest_workspace")} | none | none | button/action | none |
| `app-web/src/features/delta-digest/view.tsx:54` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/devices/view.tsx:312` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/devices/view.tsx:760` | `<input>` | onChange={(event) => setSearchValue(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/devices/view.tsx:768` | `<select>` | onChange={(event) => setCollectorFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/devices/view.tsx:772` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:773` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:774` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:775` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:776` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:781` | `<select>` | onChange={(event) => setCapabilityFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/devices/view.tsx:785` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:786` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:787` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:788` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:789` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:790` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/devices/view.tsx:832` | `<button>` type="button" | onClick={() => setSelectedDeviceId(device.device_id)} | none | none | button/action | none |
| `app-web/src/features/evidence-consistency/view.tsx:95` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/evidence-consistency/view.tsx:134` | `<button>` type="button" | onClick={() => void query.reload()} | none | none | button/action | none |
| `app-web/src/features/evidence-consistency/view.tsx:137` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/evidence-consistency/view.tsx:140` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/evidence-consistency/view.tsx:238` | `<button>` type="button" | onClick={() => navigateEvidenceConsistencyPivotFromHint(h, syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:120` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:127` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit })} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:177` | `<button>` type="button" | onClick={() => navigateToEvidenceView("service-explorer")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:180` | `<button>` type="button" | onClick={() => navigateToEvidenceView("service-dossier")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:183` | `<button>` type="button" | onClick={() => navigateToEvidenceView("service-impact-workspace")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:190` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspace()} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:197` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceSetup()} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:204` | `<button>` type="button" | onClick={() => navigateToEvidenceView("maintenance-preview")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:210` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit })} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:272` | `<button>` type="button" | onClick={() => navigateToEvidenceView("devices")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:278` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:284` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:290` | `<button>` type="button" | onClick={() => navigateToEvidenceView("capabilities")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:296` | `<button>` type="button" | onClick={() => navigateToEvidenceView("platform-health")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/domain-sections.tsx:302` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/surface-entry.tsx:19` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncRuns })} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/view.tsx:119` | `<button>` type="button" | onClick={() => handlePivotNavigation(pivot, syncRunsLimit)} | none | none | button/action | {`${pivot.route_family} — ${pivot.rationale}`} |
| `app-web/src/features/evidence-quality-workspace/view.tsx:195` | `<button>` type="button" | onClick={() => void query.reload()} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/view.tsx:338` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/view.tsx:393` | `<button>` type="button" | onClick={() => void query.reload()} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/view.tsx:396` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncRunsLimit, { invFrom: "evidence-quality-workspace" }) } | none | none | button/action | "operator_briefing_workspace_v1 — same sync window; inv_from shell hint only" |
| `app-web/src/features/evidence-quality-workspace/view.tsx:406` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/evidence-quality-workspace/view.tsx:416` | `<input>` type="number" | onChange={(e) => applySyncLimit(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:207` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(syncRuns)} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:216` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "evidence-replay" })} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:225` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(policyPivot.policyId, "evidence_replay_viewer")} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:234` | `<button>` type="button" | onClick={() => navigateToTopologyDossier( topologyPivot.objectId, topologyPivot.kind, "evidence_replay_viewer", ) } | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:248` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:290` | `<button>` type="button" | onClick={tryParseJsonFence} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:302` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(20)} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:305` | `<button>` type="button" | onClick={() => navigateToInvestigationView(20, { invFrom: "evidence-replay" })} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:312` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:350` | `<input>` type="file" | onChange={onFile} | none | aria-label="Choose export file" | form/input change | "Choose export file" |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:360` | `<textarea>` | onChange={(e) => setDraftText(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:369` | `<button>` type="button" | onClick={loadFromDraft} | none | none | button/action | none |
| `app-web/src/features/evidence-replay/evidence-replay-product.tsx:373` | `<button>` type="button" | onClick={clearLoaded} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:136` | `<input>` type="search" | onChange={(e) => { setInputValue(e.target.value); setOpen(true); }}; onFocus={() => setOpen(true)}; onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); } }} | none | aria-expanded={showPanel}; aria-controls="global-operator-search-results" | form/input change | none |
| `app-web/src/features/global-search/global-operator-search.tsx:198` | `<button>` type="button" | onClick={() => onSelectHit(hit.pivot, data.q)} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:213` | `<button>` type="button" | onClick={() => { const p = hit.pivot; const scoped = p.policy_id ? { policyId: p.policy_id } : p.topology_object && p.topology_object_kind ? { topologyObject: { id: p.topology_object, kind: p.topology_object_kind, }, } : undefined; navigateToOperatorBriefingFromGlobalSearch(data.q, scoped); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:236` | `<button>` type="button" | onClick={() => { navigateToMaintenancePreviewForTopologyObject( hit.pivot.topology_object!, hit.pivot.topology_object_kind!, { previewContext: "topology_drilldown", echoSearchQuery: data.q, }, ); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:255` | `<button>` type="button" | onClick={() => { navigateToMaintenanceEvidenceWorkspaceForTopologyObject( hit.pivot.topology_object!, hit.pivot.topology_object_kind!, { previewContext: "topology_drilldown", echoSearchQuery: data.q, }, ); clearSearchUi(); }} | none | none | button/action | "maintenance_evidence_workspace_v1 — composed read GET; not impact_report_v1, change_safety_case download, or evidence_export_v1" |
| `app-web/src/features/global-search/global-operator-search.tsx:275` | `<button>` type="button" | onClick={() => { const lim = readSyncRunsLimitFromSearch( window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, ); navigateToMaintenanceWindowWorkspaceForTopologyObject( hit.pivot.topology_object!, hit.pivot.topology_object_kind!, { previewContext: "topology_drilldown", syncRunsLimit: lim, echoSearchQuery: data.q, }, ); clearSearchUi(); }} | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup; starts with this topology hit only" |
| `app-web/src/features/global-search/global-operator-search.tsx:300` | `<button>` type="button" | onClick={() => { navigateToDeltaDigestFromGlobalSearch(data.q); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:312` | `<button>` type="button" | onClick={() => { navigateToInvestigationFromOperatorSearchHit(hit, data.q); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:324` | `<button>` type="button" | onClick={() => { navigateToReadinessFromOperatorCapabilityHit(hit.primary_id, data.q); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:336` | `<button>` type="button" | onClick={() => { navigateToPolicyExplainabilityWorkspace( hit.pivot.policy_id!, data.q, "candidates", ); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:352` | `<button>` type="button" | onClick={() => { navigateToPathExplorer(hit.pivot.policy_id!); clearSearchUi(); }} | none | none | button/action | "path_explorer_v1 — composed path workspace; same policy anchor as explainability" |
| `app-web/src/features/global-search/global-operator-search.tsx:365` | `<button>` type="button" | onClick={() => { navigateToServiceImpactWorkspace(`policy:${hit.pivot.policy_id!}`, { echoSearchQuery: data.q, }); clearSearchUi(); }} | none | none | button/action | "service_impact_workspace_v1 — composed service-impact workspace; policy:… anchor matches Service Explorer" |
| `app-web/src/features/global-search/global-operator-search.tsx:380` | `<button>` type="button" | onClick={() => { navigateToServiceExplorerForPolicy(hit.pivot.policy_id!, { echoSearchQuery: data.q, }); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:394` | `<button>` type="button" | onClick={() => { navigateToServiceDossierForPolicy(hit.pivot.policy_id!, { echoSearchQuery: data.q, }); clearSearchUi(); }} | none | none | button/action | "service_dossier_v1 — composed workspace for policy:…; not a search hit inside the dossier JSON" |
| `app-web/src/features/global-search/global-operator-search.tsx:409` | `<button>` type="button" | onClick={() => { navigateToImpactReportForPolicy(hit.pivot.policy_id!, { echoSearchQuery: data.q, }); clearSearchUi(); }} | none | none | button/action | "Opens policy-shaped impact_report_v1 — same inventory anchor as dossier, not a search hit inside the report body." |
| `app-web/src/features/global-search/global-operator-search.tsx:424` | `<button>` type="button" | onClick={() => { navigateToChangeSafetyCaseForPolicy(hit.pivot.policy_id!, { echoSearchQuery: data.q, }); clearSearchUi(); }} | none | none | button/action | "change_safety_case_v1 — pre-change evidence posture; same policy anchor as Service Explorer, not a search hit inside the case JSON." |
| `app-web/src/features/global-search/global-operator-search.tsx:439` | `<button>` type="button" | onClick={() => { navigateToStabilityWorkspace({ syncRunsLimit: 20, serviceId: `policy:${hit.pivot.policy_id!}`, echoSearchQuery: data.q, }); clearSearchUi(); }} | none | none | button/action | "Same policy-shaped service_id anchor as Service dossier (policy:…); not a search hit inside stability JSON." |
| `app-web/src/features/global-search/global-operator-search.tsx:456` | `<button>` type="button" | onClick={() => { const id = hit.pivot.topology_object!; const kind = hit.pivot.topology_object_kind!; if (kind === "node") { navigateToImpactReportForMaintenance({ nodeId: id, previewContext: "topology_drilldown", echoSearchQuery: data.q, }); } else { navigateToImpactReportForMaintenance({ linkId: id, previewContext: "topology_drilldown", echoSearchQuery: data.q, }); } clearSearchUi(); }} | none | none | button/action | "Opens maintenance-shaped impact_report_v1 for this topology object — navigation only, not graph proof." |
| `app-web/src/features/global-search/global-operator-search.tsx:483` | `<button>` type="button" | onClick={() => { const id = hit.pivot.topology_object!; const kind = hit.pivot.topology_object_kind!; if (kind === "node") { navigateToChangeSafetyCaseForMaintenance({ nodeId: id, previewContext: "topology_drilldown", echoSearchQuery: data.q, }); } else { navigateToChangeSafetyCaseForMaintenance({ linkId: id, previewContext: "topology_drilldown", echoSearchQuery: data.q, }); } clearSearchUi(); }} | none | none | button/action | "Opens topology-shaped change_safety_case_v1 — navigation only, not graph proof." |
| `app-web/src/features/global-search/global-operator-search.tsx:519` | `<button>` type="button" | onClick={() => { navigateToDeltaDigestFromGlobalSearch(data.q); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:529` | `<button>` type="button" | onClick={() => { const lim = readSyncRunsLimitFromSearch( window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, ); navigateToEvidenceQualityWorkspace({ syncRunsLimit: lim, echoSearchQuery: data.q }); clearSearchUi(); }} | none | none | button/action | "evidence_quality_workspace_v1 — cross-domain read-path limits; echoes global_search_q; not search hit inside workspace JSON" |
| `app-web/src/features/global-search/global-operator-search.tsx:544` | `<button>` type="button" | onClick={() => { navigateToOperatorBriefingFromGlobalSearch(data.q); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:554` | `<button>` type="button" | onClick={() => { navigateToSituationRoomFromGlobalSearch(data.q); clearSearchUi(); }} | none | none | button/action | none |
| `app-web/src/features/global-search/global-operator-search.tsx:564` | `<button>` type="button" | onClick={() => { navigateToEvidenceReplayFromGlobalSearch(data.q); clearSearchUi(); }} | none | none | button/action | "Import a previously downloaded evidence_export_v1 JSON — not live inventory matches." |
| `app-web/src/features/global-search/global-operator-search.tsx:575` | `<button>` type="button" | onClick={() => { navigateToImpactReportHub(data.q); clearSearchUi(); }} | none | none | button/action | "Impact Report setup — choose service, policy, or maintenance anchor; not a report generated from the query text." |
| `app-web/src/features/global-search/global-operator-search.tsx:586` | `<button>` type="button" | onClick={() => { navigateToChangeSafetyCaseHub(data.q); clearSearchUi(); }} | none | none | button/action | "Change Safety Case setup — choose service or policy anchor; not a case generated from the query text alone." |
| `app-web/src/features/impact-report/impact-report-product.tsx:28` | `<button>` type="button" | onClick={() => void onReload()} | none | none | download/report/export action | none |
| `app-web/src/features/impact-report/view.tsx:115` | `<input>` | onChange={(e) => setServiceId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/impact-report/view.tsx:123` | `<button>` type="button" | onClick={() => navigateToImpactReportForService(serviceId.trim())} | {!serviceId.trim()} | none | download/report/export action | none |
| `app-web/src/features/impact-report/view.tsx:134` | `<input>` | onChange={(e) => setPolicyId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/impact-report/view.tsx:142` | `<button>` type="button" | onClick={() => navigateToImpactReportForPolicy(policyId.trim())} | {!policyId.trim()} | none | download/report/export action | none |
| `app-web/src/features/investigation/investigation-nav-context-banner.tsx:54` | `<button>` type="button" | onClick={() => navigateToEvidenceView(invFrom)} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-next-inspection.tsx:27` | `<button>` type="button" | onClick={() => navigateForInvestigationContextDomain(s.context_domain)} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-surface-entry.tsx:24` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom })} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:40` | `<button>` type="button" | onClick={() => navigateToEvidenceView(domain)} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:51` | `<button>` type="button" | onClick={() => navigateToEvidenceView(viewIdForChangeIntelligenceHistoryDomain(domain))} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:62` | `<button>` type="button" | onClick={() => navigateToEvidenceView("readiness")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:98` | `<button>` type="button" | onClick={() => { const sync = readSyncRunsLimitFromSearch( window.location.search, DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, ); const ctx = parseInvestigationNavContext(window.location.search); const gsq = new URLSearchParams(window.location.search).get(GLOBAL_SEARCH_QUERY_PARAM); const topoKind = ctx.topologyObjectKind === "node" \|\| ctx.topologyObjectKind === "link" ? ctx.topologyObjectKind : undefined; navigateToOperatorBriefingView(sync, { invFrom: "investigation", policyId: ctx.policyId ?? undefined, topologyObject: ctx.topologyObjectId && topoKind ? { id: ctx.topologyObjectId, kind: topoKind } : undefined, echoSearchQuery: gsq ?? undefined, }); }} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:125` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:132` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit })} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:143` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:146` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:407` | `<button>` type="button" | onClick={() => navigateToEvidenceView("devices")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:410` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:413` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:416` | `<button>` type="button" | onClick={() => navigateToEvidenceView("capabilities")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:419` | `<button>` type="button" | onClick={() => navigateToEvidenceView("readiness")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:422` | `<button>` type="button" | onClick={() => navigateToEvidenceView("workflows")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:425` | `<button>` type="button" | onClick={() => navigateToEvidenceView("audit")} | none | none | button/action | none |
| `app-web/src/features/investigation/investigation-workspace-product.tsx:428` | `<button>` type="button" | onClick={() => navigateToEvidenceView("platform-health")} | none | none | button/action | none |
| `app-web/src/features/investigation/view.tsx:59` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:40` | `<button>` type="button" | onClick={() => navigateToImpactReportForMaintenance( subj.object_kind === "node" ? { nodeId: subj.object_id, previewContext: ctx } : { linkId: subj.object_id, previewContext: ctx }, ) } | none | none | button/action | "impact_report_v1 — separate GET family; not evidence_export_v1" |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:54` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForMaintenance( subj.object_kind === "node" ? { nodeId: subj.object_id, previewContext: ctx } : { linkId: subj.object_id, previewContext: ctx }, ) } | none | none | button/action | "change_safety_case_v1 — not approval or dry-run" |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:68` | `<button>` type="button" | onClick={() => navigateToMaintenancePreview( subj.object_kind === "node" ? { nodeId: subj.object_id, previewContext: ctx } : { linkId: subj.object_id, previewContext: ctx }, ) } | none | none | button/action | "Narrow maintenance_preview_v1 surface (same subject)" |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:82` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(data.object_id, data.object_kind, "maintenance_evidence_workspace") } | none | none | button/action | "Topology object dossier workspace (separate composed GET)" |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:92` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(subj.object_id, subj.object_kind, { previewContext: ctx, syncRunsLimit: syncLim, }) } | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup; starts with this subject only" |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:105` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit: syncLim, topologyObject: { id: subj.object_id, kind: subj.object_kind }, }) } | none | none | button/action | "Stability workspace — same topology subject; not maintenance evidence JSON assembly" |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:118` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncLim })} | none | none | button/action | "evidence_quality_workspace_v1 — cross-domain read-path limits; not this maintenance assembly" |
| `app-web/src/features/maintenance-evidence-workspace/maintenance-evidence-workspace-product.tsx:126` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:72` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspace()} | none | none | button/action | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:116` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspace()} | none | none | button/action | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:145` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspace()} | none | none | button/action | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:191` | `<input>` type="radio" | onChange={() => setMode("node")} | none | none | form/input change | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:200` | `<input>` type="radio" | onChange={() => setMode("link")} | none | none | form/input change | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:215` | `<input>` type="text" | onChange={(e) => setObjectId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:228` | `<select>` | onChange={(e) => setPreviewContext(e.target.value as MaintenancePreviewContext)} | none | none | form/input change | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:235` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/maintenance-evidence-workspace/view.tsx:241` | `<button>` type="button" | onClick={apply} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:43` | `<button>` type="button" | onClick={() => navigateToImpactReportForMaintenance( subj.object_kind === "node" ? { nodeId: subj.object_id, previewContext: data.preview_context } : { linkId: subj.object_id, previewContext: data.preview_context }, ) } | none | none | button/action | "Open impact_report_v1 workspace for this subject (not evidence export)" |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:57` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForMaintenance( subj.object_kind === "node" ? { nodeId: subj.object_id, previewContext: data.preview_context } : { linkId: subj.object_id, previewContext: data.preview_context }, ) } | none | none | button/action | "change_safety_case_v1 — pre-change posture; not blast-radius or approval" |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:71` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspace( subj.object_kind === "node" ? { nodeId: subj.object_id, previewContext: data.preview_context } : { linkId: subj.object_id, previewContext: data.preview_context }, ) } | none | none | button/action | "maintenance_evidence_workspace_v1 — composed read assembly; not evidence_export_v1" |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:85` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(subj.object_id, subj.object_kind, { previewContext: data.preview_context, syncRunsLimit: syncLim, }) } | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup; starts with this subject only" |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:98` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit: syncLim, topologyObject: { id: subj.object_id, kind: subj.object_kind }, }) } | none | none | button/action | "Stability workspace — same topology subject anchor; not maintenance_evidence_workspace_v1" |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:111` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncLim })} | none | none | button/action | "evidence_quality_workspace_v1 — read-path limits; not maintenance preview assembly" |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:119` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:191` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(subj.object_id, subj.object_kind, "maintenance_preview") } | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:248` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(row.policy_id)} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:301` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: row.service_id })} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:308` | `<button>` type="button" | onClick={() => navigateToServiceDossier({ serviceId: row.service_id })} | none | none | button/action | "service_dossier_v1 — composed assembly for this service_id" |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:333` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(p.policy_id)} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/maintenance-preview-product.tsx:356` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncLim, { invFrom: "maintenance-preview", topologyObject: { id: subj.object_id, kind: subj.object_kind }, }) } | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/view.tsx:72` | `<button>` type="button" | onClick={() => navigateToMaintenancePreview()} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/view.tsx:116` | `<button>` type="button" | onClick={() => navigateToMaintenancePreview()} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/view.tsx:144` | `<button>` type="button" | onClick={() => navigateToMaintenancePreview()} | none | none | button/action | none |
| `app-web/src/features/maintenance-preview/view.tsx:189` | `<input>` type="radio" | onChange={() => setMode("node")} | none | none | form/input change | none |
| `app-web/src/features/maintenance-preview/view.tsx:198` | `<input>` type="radio" | onChange={() => setMode("link")} | none | none | form/input change | none |
| `app-web/src/features/maintenance-preview/view.tsx:213` | `<input>` type="text" | onChange={(e) => setObjectId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/maintenance-preview/view.tsx:226` | `<select>` | onChange={(e) => setPreviewContext(e.target.value as MaintenancePreviewContext)} | none | none | form/input change | none |
| `app-web/src/features/maintenance-preview/view.tsx:233` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/maintenance-preview/view.tsx:239` | `<button>` type="button" | onClick={apply} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:64` | `<button>` type="button" | onClick={onChangeSubjects} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:67` | `<button>` type="button" | onClick={onReload} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:129` | `<button>` type="button" | onClick={() => navigateToMaintenancePreviewForTopologyObject(row.object_id, row.object_kind, { previewContext: data.preview_context, }) } | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:140` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject(row.object_id, row.object_kind, { previewContext: data.preview_context, }) } | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:208` | `<button>` type="button" | onClick={() => navigateToServiceImpactWorkspace(row.service_id)} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:215` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: row.service_id })} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:270` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicy(row.policy_id)} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:306` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit: syncLim, topologyObject: null, serviceId: null })} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:316` | `<button>` type="button" | onClick={() => { const p = parseSubjectLabel(data.selected_subjects[0]); if (p) { navigateToStabilityWorkspace({ syncRunsLimit: syncLim, topologyObject: { id: p.objectId, kind: p.objectKind }, serviceId: null, }); } }} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:363` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/maintenance-window-workspace-product.tsx:366` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncLim })} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:73` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceSetup()} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:117` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceSetup()} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:146` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceSetup()} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:225` | `<input>` type="radio" | onChange={() => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, mode: "node" } : r))) } | none | none | form/input change | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:236` | `<input>` type="radio" | onChange={() => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, mode: "link" } : r))) } | none | none | form/input change | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:248` | `<input>` type="text" | onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, objectId: e.target.value } : r))) } | none | none | form/input change | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:257` | `<button>` type="button" | onClick={() => removeRow(row.id)} | none | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:263` | `<button>` type="button" | onClick={addRow} | {rows.length >= MAINTENANCE_WINDOW_WORKSPACE_MAX_SUBJECTS} | none | button/action | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:271` | `<select>` | onChange={(e) => setPreviewContext(e.target.value as MaintenancePreviewContext)} | none | none | form/input change | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:278` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:288` | `<input>` type="number" | onChange={(e) => setSyncRunsLimit(Number.parseInt(e.target.value, 10) \|\| 20)} | none | none | form/input change | none |
| `app-web/src/features/maintenance-window-workspace/view.tsx:298` | `<button>` type="button" | onClick={apply} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:66` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:69` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:148` | `<button>` type="button" | onClick={() => navigateToEvidenceView("delta-digest")} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:155` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:162` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit })} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:169` | `<button>` type="button" | onClick={() => topo?.object_identity ? navigateToStabilityWorkspace({ syncRunsLimit: syncRunsLimit, topologyObject: { id: topo.object_identity.object_id, kind: topo.object_identity.object_kind, }, }) : navigateToStabilityWorkspace({ syncRunsLimit: syncRunsLimit }) } | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:186` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRunsLimit, { invFrom: "operator-briefing" })} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:193` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:201` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(pol.policy_record.policy_id, "operator_briefing_workspace")} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:210` | `<button>` type="button" | onClick={() => navigateToTopologyDossier( topo.object_identity.object_id, topo.object_identity.object_kind, "operator_briefing_workspace", ) } | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:225` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject( topo.object_identity.object_id, topo.object_identity.object_kind, { previewContext: "topology_drilldown" }, ) } | none | none | button/action | "maintenance_evidence_workspace_v1 live GET — not bundled in briefing_export_bundle_v1" |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:241` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject( topo.object_identity.object_id, topo.object_identity.object_kind, { previewContext: "topology_drilldown", syncRunsLimit: syncRunsLimit }, ) } | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup; starts with briefing topology subject only" |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:256` | `<button>` type="button" | onClick={() => navigateToEvidenceView("devices")} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:259` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:262` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/operator-briefing-product.tsx:302` | `<button>` type="button" | onClick={() => navigateToEvidenceView("evidence-replay")} | none | none | button/action | none |
| `app-web/src/features/operator-briefing/view.tsx:59` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/overview/degraded-policies-attention.tsx:88` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(row.policy_id, "overview_noc_cockpit")} | none | none | button/action | none |
| `app-web/src/features/overview/degraded-policies-attention.tsx:97` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(row.policy_id)} | none | none | button/action | none |
| `app-web/src/features/overview/degraded-policies-attention.tsx:106` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(row.policy_id)} | none | none | button/action | "service_dossier_v1 — same policy: anchor as Service Explorer" |
| `app-web/src/features/overview/delta-digest-overview-entry.tsx:43` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/overview/delta-digest-overview-entry.tsx:68` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/overview/evidence-consistency-overview-entry.tsx:47` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/overview/evidence-consistency-overview-entry.tsx:83` | `<button>` type="button" | onClick={() => navigateEvidenceConsistencyPivotFromHint(h, syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/overview/evidence-consistency-overview-entry.tsx:97` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/overview/evidence-consistency-overview-entry.tsx:104` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/overview/evidence-quality-overview-entry.tsx:36` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/overview/evidence-quality-overview-entry.tsx:69` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit })} | none | none | button/action | none |
| `app-web/src/features/overview/evidence-replay-overview-entry.tsx:25` | `<button>` type="button" | onClick={() => navigateToEvidenceView("evidence-replay")} | none | none | button/action | none |
| `app-web/src/features/overview/investigation-entry.tsx:25` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRunsLimit, { invFrom: "overview" })} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:90` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({})} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:94` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(strongPolicyId)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:105` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(strongPolicyId)} | none | none | button/action | "service_dossier_v1 — composed workspace; same policy: anchor as Service Explorer" |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:115` | `<button>` type="button" | onClick={() => navigateToServiceImpactWorkspace(`policy:${strongPolicyId}`)} | none | none | button/action | "service_impact_workspace_v1 — composed Explorer + optional failure-impact; same policy: anchor as Service lens" |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:135` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(strongPolicyId)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:146` | `<button>` type="button" | onClick={() => navigateToPathExplorer(strongPolicyId)} | none | none | button/action | "path_explorer_v1 — composed path workspace; same policy anchor as explainability" |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:168` | `<button>` type="button" | onClick={() => navigateToMaintenancePreviewForTopologyObject(topRisk.object_id, topRisk.object_kind, { previewContext: "planning_window", }) } | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:179` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject(topRisk.object_id, topRisk.object_kind, { previewContext: "planning_window", }) } | none | none | button/action | "maintenance_evidence_workspace_v1 — not evidence_export_v1" |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:191` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(topRisk.object_id, topRisk.object_kind, { previewContext: "planning_window", syncRunsLimit: syncRuns, }) } | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup; starts with top risk subject only" |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:207` | `<button>` type="button" | onClick={() => navigateToMaintenancePreviewForTopologyObject(firstNodeId, "node", { previewContext: "explicit_subject", }) } | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:218` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject(firstNodeId, "node", { previewContext: "explicit_subject", }) } | none | none | button/action | "maintenance_evidence_workspace_v1 — not evidence_export_v1" |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:230` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(firstNodeId, "node", { previewContext: "explicit_subject", syncRunsLimit: syncRuns, }) } | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup; starts with first node only" |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:258` | `<button>` type="button" | onClick={() => navigateToImpactReportForPolicy(strongPolicyId)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:267` | `<button>` type="button" | onClick={() => openImpactReportForTopRisk(topRisk)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:285` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForPolicy(strongPolicyId)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:294` | `<button>` type="button" | onClick={() => openChangeSafetyCaseForTopRisk(topRisk)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-operator-launch-grid.tsx:312` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncRuns })} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:50` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncRuns })} | none | none | button/action | "evidence_quality_workspace_v1 — cross-domain read paths; not consistency or stability workspaces" |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:72` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncRuns })} | none | none | button/action | "evidence_quality_workspace_v1 — cross-domain read paths; not consistency or stability workspaces" |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:89` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(topRisk.object_id, topRisk.object_kind, "overview_risk") } | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:98` | `<button>` type="button" | onClick={() => navigateToMaintenancePreviewForTopologyObject(topRisk.object_id, topRisk.object_kind, { previewContext: "planning_window", }) } | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:109` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject(topRisk.object_id, topRisk.object_kind, { previewContext: "planning_window", }) } | none | none | button/action | "maintenance_evidence_workspace_v1 — composed GET; not evidence_export_v1 or approval" |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:121` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(topRisk.object_id, topRisk.object_kind, { previewContext: "planning_window", syncRunsLimit: syncRuns, }) } | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup; starts with top risk subject only" |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:134` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "overview", topologyObject: { id: topRisk.object_id, kind: topRisk.object_kind }, riskSummaryEntry: true, }) } | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:147` | `<button>` type="button" | onClick={() => topRisk.object_kind === "node" ? navigateToImpactReportForMaintenance({ nodeId: topRisk.object_id, previewContext: "planning_window", }) : navigateToImpactReportForMaintenance({ linkId: topRisk.object_id, previewContext: "planning_window", }) } | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:164` | `<button>` type="button" | onClick={() => topRisk.object_kind === "node" ? navigateToChangeSafetyCaseForMaintenance({ nodeId: topRisk.object_id, previewContext: "planning_window", }) : navigateToChangeSafetyCaseForMaintenance({ linkId: topRisk.object_id, previewContext: "planning_window", }) } | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:192` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(topDegraded.policy_id, "overview_noc_cockpit")} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:199` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(topDegraded.policy_id)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:206` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(topDegraded.policy_id)} | none | none | button/action | "service_dossier_v1 composed workspace — same policy: anchor" |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:214` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(topDegraded.policy_id)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:221` | `<button>` type="button" | onClick={() => navigateToPathExplorer(topDegraded.policy_id)} | none | none | button/action | "path_explorer_v1 composed workspace — same policy_id anchor as explainability; navigation only" |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:229` | `<button>` type="button" | onClick={() => navigateToServiceImpactWorkspace(`policy:${topDegraded.policy_id}`)} | none | none | button/action | "service_impact_workspace_v1 — same policy: anchor as Service Explorer; composed read-only GET" |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:237` | `<button>` type="button" | onClick={() => navigateToImpactReportForPolicy(topDegraded.policy_id)} | none | none | button/action | none |
| `app-web/src/features/overview/noc-cockpit-strategic-pivots.tsx:244` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForPolicy(topDegraded.policy_id)} | none | none | button/action | none |
| `app-web/src/features/overview/operator-briefing-entry.tsx:40` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(bounded \|\| DEFAULT_OPERATOR_BRIEFING_SYNC_RUNS_LIMIT, { invFrom: "overview", clearPinnedScope: true, }) } | none | none | button/action | none |
| `app-web/src/features/overview/operator-workspace-entry.tsx:38` | `<a>` | none | none | none | link/navigation | none |
| `app-web/src/features/overview/operator-workspace-entry.tsx:41` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/overview/operator-workspace-entry.tsx:55` | `<button>` type="button" | onClick={() => navigateToTopologyObject(firstNodeId, "node")} | none | none | button/action | none |
| `app-web/src/features/overview/operator-workspace-entry.tsx:77` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(firstPolicyId)} | none | none | button/action | none |
| `app-web/src/features/overview/operator-workspace-entry.tsx:84` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(firstPolicyId)} | none | none | button/action | none |
| `app-web/src/features/overview/operator-workspace-entry.tsx:91` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(firstPolicyId, "overview_operator_workspace") } | none | none | button/action | none |
| `app-web/src/features/overview/operator-workspace-entry.tsx:100` | `<button>` type="button" | onClick={() => navigateToPathExplorer(firstPolicyId)} | none | none | button/action | "path_explorer_v1 — composed path workspace; same policy anchor as Policies panels" |
| `app-web/src/features/overview/operator-workspace-entry.tsx:108` | `<button>` type="button" | onClick={() => navigateToServiceImpactWorkspace(`policy:${firstPolicyId}`)} | none | none | button/action | "service_impact_workspace_v1 — composed service-impact; policy: anchor matches Service Explorer" |
| `app-web/src/features/overview/recent-change.tsx:113` | `<button>` type="button" | onClick={() => navigateToEvidenceView(slice.domain)} | none | none | button/action | none |
| `app-web/src/features/overview/recent-change.tsx:123` | `<button>` type="button" | onClick={() => { const d = slice.domain; if (isChangeIntelligenceHistorySurfaceDomain(d)) { navigateToEvidenceView(viewIdForChangeIntelligenceHistoryDomain(d)); } }} | none | none | button/action | none |
| `app-web/src/features/overview/situation-room-entry.tsx:26` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(syncRunsLimit)} | none | none | button/action | none |
| `app-web/src/features/overview/stability-overview-entry.tsx:36` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/overview/stability-overview-entry.tsx:70` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit })} | none | none | button/action | none |
| `app-web/src/features/overview/view.tsx:498` | `<button>` type="button" | onClick={() => navigateOverviewLayoutMode("standard")} | none | none | button/action | none |
| `app-web/src/features/overview/view.tsx:505` | `<button>` type="button" | onClick={() => navigateOverviewLayoutMode("cockpit")} | none | none | button/action | none |
| `app-web/src/features/overview/view.tsx:513` | `<button>` type="button" | onClick={() => void reloadAllSlices()} | none | none | button/action | none |
| `app-web/src/features/overview/view.tsx:530` | `<button>` type="button" | onClick={() => void reloadAllSlices()} | none | none | button/action | none |
| `app-web/src/features/overview/view.tsx:773` | `<button>` type="button" | onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("degraded")} | none | none | button/action | none |
| `app-web/src/features/overview/view.tsx:783` | `<button>` type="button" | onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("all")} | none | none | button/action | none |
| `app-web/src/features/overview/view.tsx:1386` | `<button>` type="button" | onClick={() => navigateOverviewLayoutMode("standard")} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:216` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyPathAnalysis(data.policy_id)} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:219` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(data.policy_id, undefined, "candidates")} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:226` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(data.policy_id, "path_explorer")} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:233` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(data.policy_id)} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:240` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:247` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:254` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT })} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:261` | `<button>` type="button" | onClick={() => navigateToInvestigationView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, { invFrom: "path-explorer", policyId: data.policy_id, }) } | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:273` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, { invFrom: "path-explorer" })} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:280` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/path-explorer/path-explorer-product.tsx:287` | `<button>` type="button" | onClick={onReload} | none | none | button/action | none |
| `app-web/src/features/path-explorer/view.tsx:79` | `<form>` | onSubmit={(e) => { e.preventDefault(); onApplyPolicyId(draft); }} | none | none | form submit | none |
| `app-web/src/features/path-explorer/view.tsx:87` | `<input>` | onChange={(e) => setDraft(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/path-explorer/view.tsx:95` | `<button>` type="submit" | none | none | none | semantic/control element | none |
| `app-web/src/features/platform-health/view.tsx:292` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/platform-health/view.tsx:419` | `<button>` type="button" | onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("degraded")} | none | none | button/action | none |
| `app-web/src/features/platform-health/view.tsx:430` | `<button>` type="button" | onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("all")} | none | none | button/action | none |
| `app-web/src/features/platform-health/view.tsx:749` | `<button>` type="button" | onClick={loadControllerEvidence} | {controllerEvidenceLoading} | none | button/action | none |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:124` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncRuns, { policyId: pr.policy_id, invFrom: "policies", }) } | none | none | button/action | none |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:136` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(pr.policy_id)} | none | none | button/action | "service_explorer_v1 grouping for this policy_id (same inventory slice as Policies)" |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:144` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(pr.policy_id)} | none | none | button/action | "service_dossier_v1 composed workspace for policy:… (same anchor as Explorer)" |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:152` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(pr.policy_id, undefined, "candidates")} | none | none | button/action | "Path-story explainability workspace (policy_explainability_workspace_v1); hints are not dataplane proof" |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:160` | `<button>` type="button" | onClick={() => navigateToPathExplorer(pr.policy_id)} | none | none | button/action | "path_explorer_v1 — composed workspace; not a substitute for this dossier JSON" |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:227` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyPathAnalysis(policyId)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:244` | `<button>` type="button" | onClick={() => navigateToTopologyObject(row.topology_object_id, row.topology_object_kind)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:289` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(policyId)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:325` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(policyId)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:339` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "policies", }) } | none | none | button/action | none |
| `app-web/src/features/policies/policy-dossier-workspace.tsx:353` | `<button>` type="button" | onClick={() => navigateToEvidenceView("situation-room")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-evidence-delta-panel.tsx:228` | `<button>` type="button" | onClick={() => navigateToInvestigationView(readSyncRunsLimitFromSearch(window.location.search), { invFrom: "policies", }) } | none | none | button/action | none |
| `app-web/src/features/policies/policy-evidence-delta-panel.tsx:240` | `<button>` type="button" | onClick={() => scrollToPolicyEvidenceTimelineCard()} | none | none | button/action | none |
| `app-web/src/features/policies/policy-evidence-delta-panel.tsx:244` | `<button>` type="button" | onClick={() => scrollToPolicyPathAnalysisCard()} | none | none | button/action | none |
| `app-web/src/features/policies/policy-evidence-delta-panel.tsx:248` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(policyId, "evidence_delta_panel")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-evidence-timeline-panel.tsx:161` | `<button>` type="button" | onClick={() => navigateToInvestigationView(readSyncRunsLimitFromSearch(window.location.search), { invFrom: "policies", }) } | none | none | button/action | none |
| `app-web/src/features/policies/policy-evidence-timeline-panel.tsx:173` | `<button>` type="button" | onClick={() => scrollToPolicyPathAnalysisCard()} | none | none | button/action | none |
| `app-web/src/features/policies/policy-evidence-timeline-panel.tsx:177` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(policyId, "evidence_timeline_panel")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:184` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncRuns, { policyId: pr.policy_id, invFrom: "policies", }) } | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:196` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(pr.policy_id)} | none | none | button/action | {data.navigation_targets.service_explorer_shell_params.service_id} |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:204` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(pr.policy_id)} | none | none | button/action | "service_dossier_v1 — composed service workspace; not a substitute for this explainability panel" |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:212` | `<button>` type="button" | onClick={() => navigateToPathExplorer(pr.policy_id)} | none | none | button/action | "path_explorer_v1 — composed path-analysis + explainability workspace; same policy anchor, distinct shell view" |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:220` | `<button>` type="button" | onClick={() => navigateToImpactReportForPolicy(pr.policy_id)} | none | none | button/action | "impact_report_v1 — not evidence export or validation sign-off" |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:228` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForPolicy(pr.policy_id)} | none | none | button/action | "change_safety_case_v1 — pre-change evidence posture; not validation or approval" |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:237` | `<button>` type="button" | onClick={() => { const h = data.navigation_targets.topology_object_hints[0]; navigateToMaintenancePreviewForTopologyObject(h.topology_object_id, h.topology_object_kind, { previewContext: "change_adjacent", }); }} | none | none | button/action | "Read-only maintenance planning assembly from first topology hint (not approval or safe-to-change)" |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:252` | `<button>` type="button" | onClick={() => { const h = data.navigation_targets.topology_object_hints[0]; navigateToMaintenanceWindowWorkspaceForTopologyObject(h.topology_object_id, h.topology_object_kind, { previewContext: "change_adjacent", syncRunsLimit: syncRuns, }); }} | none | none | button/action | "maintenance_window_workspace_v1 from first topology hint only — not automatic multi-subject discovery" |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:346` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyPathAnalysis(policyId)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:420` | `<button>` type="button" | onClick={() => navigateToTopologyObject(row.topology_object_id, row.topology_object_kind)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:442` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "policy_explainability", policyId: pr.policy_id, }) } | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:457` | `<button>` type="button" | onClick={() => navigateToEvidenceView("situation-room")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:462` | `<button>` type="button" | onClick={openDeltaDigest} | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:468` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:503` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(policyId)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-explainability-workspace.tsx:539` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(policyId)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-path-analysis-panel.tsx:85` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(policyId, "path_analysis_panel")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-path-analysis-panel.tsx:92` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(policyId, undefined, "candidates")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-path-analysis-panel.tsx:99` | `<button>` type="button" | onClick={() => navigateToPathExplorer(policyId)} | none | none | button/action | none |
| `app-web/src/features/policies/policy-topology-impact-panel.tsx:74` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(policyId, "topology_impact_panel")} | none | none | button/action | none |
| `app-web/src/features/policies/policy-topology-impact-panel.tsx:112` | `<button>` type="button" | onClick={() => navigateToTopologyObject(row.topology_object_id, row.topology_object_kind) } | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:940` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2061` | `<input>` | onChange={(event) => setSearchValue(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2069` | `<select>` | onChange={(event) => setHealthFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2073` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2074` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2075` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2076` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2077` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2082` | `<select>` | onChange={(event) => setSupportFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2086` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2087` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2088` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2089` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2090` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2091` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2096` | `<select>` | onChange={(event) => setObservedFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2100` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2101` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2102` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2103` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2104` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2109` | `<select>` | onChange={(event) => setTypeFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2110` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2111` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2112` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2113` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2118` | `<select>` | onChange={(event) => setSourceRoleFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2122` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2123` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2124` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2125` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2130` | `<select>` | onChange={(event) => setCandidatePathFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2134` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2135` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2136` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2141` | `<select>` | onChange={(event) => { const v = event.target.value as typeof degradedV1PostureFilter; setDegradedV1PostureFilter(v); if (typeof window === "undefined") { return; } const sp = new URLSearchParams(window.location.search); applyDegradedPolicyV1PostureToSearchParams(sp, v); replaceUrlSearchParams(sp); }} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2154` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2155` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2156` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2157` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2162` | `<select>` | onChange={(event) => setSortBy(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/policies/view.tsx:2163` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2164` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2165` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2166` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2167` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2168` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2169` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2170` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/policies/view.tsx:2196` | `<button>` type="button" | onClick={() => setWorkspaceMode("standard")} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2203` | `<button>` type="button" | onClick={() => setWorkspaceMode("dossier")} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2210` | `<button>` type="button" | onClick={() => setWorkspaceMode("explainability")} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2283` | `<button>` type="button" | onClick={() => setSelectedPolicyId(policy.policy_id)} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2330` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(policy.policy_id, "policy_table")} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2337` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(policy.policy_id)} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2344` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(policy.policy_id)} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2351` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(policy.policy_id)} | none | none | button/action | "service_dossier_v1 — composed workspace for policy:…; not a substitute for full Explorer or policy dossier panels" |
| `app-web/src/features/policies/view.tsx:2377` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(selectedPolicy.policy_id, "policy_detail")} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2384` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(selectedPolicy.policy_id)} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2391` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(selectedPolicy.policy_id)} | none | none | button/action | none |
| `app-web/src/features/policies/view.tsx:2398` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(selectedPolicy.policy_id)} | none | none | button/action | "service_dossier_v1 composed assembly for this policy: service_id" |
| `app-web/src/features/preview-workspace/view.tsx:57` | `<input>` type="text" | onChange={(e) => setPolicyId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/preview-workspace/view.tsx:68` | `<select>` | onChange={(e) => setProposedIntent(e.target.value as "declared" \| "unknown")} | none | none | form/input change | none |
| `app-web/src/features/preview-workspace/view.tsx:73` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/preview-workspace/view.tsx:74` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/preview-workspace/view.tsx:79` | `<button>` type="button" | onClick={onSubmit} | {busy} | none | state-changing or workflow control | none |
| `app-web/src/features/readiness/view.tsx:130` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/readiness/view.tsx:455` | `<button>` type="button" | onClick={() => navigateReadinessDrilldown({ blocker: b.blocker })} | none | none | button/action | none |
| `app-web/src/features/readiness/view.tsx:504` | `<button>` type="button" | onClick={() => navigateReadinessDrilldown({ prerequisite: value })} | none | none | button/action | none |
| `app-web/src/features/readiness/view.tsx:555` | `<button>` type="button" | onClick={() => navigateReadinessDrilldown({ prerequisite: p.prerequisite })} | none | none | button/action | none |
| `app-web/src/features/readiness/view.tsx:611` | `<button>` type="button" | onClick={() => navigateReadinessDrilldown({ blocker: b.blocker })} | none | none | button/action | none |
| `app-web/src/features/rollback-workspace/view.tsx:123` | `<input>` | onChange={(e) => setPolicyId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/rollback-workspace/view.tsx:133` | `<input>` | onChange={(e) => setParentActionId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/rollback-workspace/view.tsx:143` | `<button>` type="button" | onClick={onCreatePostChangeValidation} | {busy} | none | state-changing or workflow control | none |
| `app-web/src/features/rollback-workspace/view.tsx:149` | `<input>` | onChange={(e) => setPostValidationId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/rollback-workspace/view.tsx:161` | `<button>` type="button" | onClick={onCreateRollback} | {busy} | none | state-changing or workflow control | none |
| `app-web/src/features/rollback-workspace/view.tsx:164` | `<button>` type="button" | onClick={onApproveExecute} | {busy \|\| !detailJson} | none | state-changing or workflow control | none |
| `app-web/src/features/safe-action-workspace/view.tsx:177` | `<button>` type="button" | onClick={onCreateWorkflow} | {busy} | none | state-changing or workflow control | none |
| `app-web/src/features/safe-action-workspace/view.tsx:183` | `<input>` | onChange={(e) => setWorkflowId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/safe-action-workspace/view.tsx:198` | `<input>` | onChange={(e) => setPolicyId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/safe-action-workspace/view.tsx:208` | `<select>` | onChange={(e) => setProposedIntent(e.target.value as "declared" \| "unknown")} | none | none | form/input change | none |
| `app-web/src/features/safe-action-workspace/view.tsx:213` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/safe-action-workspace/view.tsx:214` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/safe-action-workspace/view.tsx:219` | `<button>` type="button" | onClick={onCreatePreviewValidation} | {busy} | none | state-changing or workflow control | none |
| `app-web/src/features/safe-action-workspace/view.tsx:225` | `<input>` | onChange={(e) => setPreviewId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/safe-action-workspace/view.tsx:229` | `<input>` | onChange={(e) => setValidationId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/safe-action-workspace/view.tsx:240` | `<button>` type="button" | onClick={onCreateAction} | {busy} | none | state-changing or workflow control | none |
| `app-web/src/features/safe-action-workspace/view.tsx:243` | `<button>` type="button" | onClick={onApproveExecute} | {busy \|\| !detailJson} | none | state-changing or workflow control | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:76` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: d.service_id })} | none | none | button/action | "Same inventory slice as this dossier — list/index lens" |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:84` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:162` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncLim, { invFrom: "service-dossier", policyId: defaultPid \|\| undefined, }) } | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:174` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:177` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncLim, { invFrom: "service-dossier", ...(defaultPid ? { policyId: defaultPid } : { clearPinnedScope: true }), }) } | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:189` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:192` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:199` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit: syncLim, serviceId: d.service_id }) } | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:208` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncLim })} | none | none | button/action | "evidence_quality_workspace_v1 — read-path limits across domains; not service dossier JSON" |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:217` | `<button>` type="button" | onClick={() => { const mp = data.maintenance_preview; if (!mp) { return; } navigateToMaintenanceWindowWorkspaceForTopologyObject(mp.subject.object_id, mp.subject.object_kind, { previewContext: "explicit_subject", syncRunsLimit: syncLim, }); }} | none | none | button/action | "maintenance_window_workspace_v1 — seeded from embedded maintenance preview subject" |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:235` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(firstTopoNode, "node", { previewContext: "explicit_subject", syncRunsLimit: syncLim, }) } | none | none | button/action | "Uses first topology_links node only — bounded carry-over" |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:249` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:252` | `<button>` type="button" | onClick={() => navigateToImpactReportForService(d.service_id)} | none | none | button/action | "impact_report_v1 — communication packaging; not the same JSON as this dossier" |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:309` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(m.policy_id, "service_dossier")} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:318` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(m.policy_id, undefined, "candidates")} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:359` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(link.node_id, "node", "service_dossier")} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:383` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(expl.policy_id, undefined, "candidates")} | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:409` | `<button>` type="button" | onClick={() => navigateToMaintenancePreview({ nodeId: data.maintenance_preview_subject_node_id ?? firstTopoNode ?? undefined, previewContext: "explicit_subject", }) } | none | none | button/action | none |
| `app-web/src/features/service-dossier/service-dossier-product.tsx:434` | `<button>` type="button" | onClick={() => navigateToImpactReportForService(d.service_id)} | none | none | button/action | none |
| `app-web/src/features/service-dossier/view.tsx:40` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({})} | none | none | button/action | none |
| `app-web/src/features/service-dossier/view.tsx:63` | `<button>` type="button" | onClick={() => navigateToServiceDossier({ serviceId: null })} | none | none | button/action | none |
| `app-web/src/features/service-dossier/view.tsx:67` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId })} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-evidence-delta-panel.tsx:195` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(p.policy_id)} | none | none | button/action | "Open Policies with policy evidence delta focus" |
| `app-web/src/features/service-explorer/service-evidence-timeline-panel.tsx:123` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(entry.policy_id!)} | none | none | button/action | "Open Policies with policy evidence timeline focus — full policy-only depth" |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:70` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:73` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:124` | `<button>` type="button" | onClick={() => navigateToInvestigationView(readSyncRunsLimitFromSearch(window.location.search), { invFrom: "service-explorer", }) } | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:135` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:142` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, { invFrom: "service-explorer" }) } | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:151` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT)} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:199` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: row.service_id })} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:215` | `<button>` type="button" | onClick={() => navigateToServiceDossier({ serviceId: row.service_id })} | none | none | button/action | "service_dossier_v1 composed workspace for this service_id" |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:253` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: null })} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:256` | `<button>` type="button" | onClick={() => navigateToServiceDossier({ serviceId: data.service_id })} | none | none | button/action | "service_dossier_v1 — composed workspace (explainability + optional maintenance); not a replacement for this Explorer detail" |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:264` | `<button>` type="button" | onClick={() => navigateToServiceImpactWorkspace(data.service_id)} | none | none | button/action | "service_impact_workspace_v1 — composed Explorer + optional failure-impact; distinct from this detail GET" |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:272` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:310` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncLim, { invFrom: "service-explorer", policyId: firstPolicy, }) } | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:322` | `<button>` type="button" | onClick={() => navigateToSituationRoomView(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:325` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncLim, { invFrom: "service-explorer", ...(firstPolicy ? { policyId: firstPolicy } : { clearPinnedScope: true }), }) } | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:337` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:340` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:347` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncLim })} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:354` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:357` | `<button>` type="button" | onClick={() => navigateToImpactReportForService(data.service_id)} | none | none | button/action | "impact_report_v1 — communication packaging; not evidence export or briefing bundle" |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:365` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForService(data.service_id)} | none | none | button/action | "change_safety_case_v1 — pre-change evidence posture and gaps; not approval or safe-to-change" |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:417` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(m.policy_id, "service_explorer")} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:426` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(m.policy_id, undefined, "candidates")} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:450` | `<button>` type="button" | onClick={() => navigateToMaintenancePreview({ nodeId: data.topology_links[0].node_id, previewContext: "change_adjacent", }) } | none | none | button/action | "Uses the first matched node in this table (read-only planning assembly; not approval)" |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:488` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(link.node_id, "node", "service_explorer")} | none | none | button/action | none |
| `app-web/src/features/service-explorer/service-explorer-product.tsx:497` | `<button>` type="button" | onClick={() => navigateToPolicyExplainabilityWorkspace(link.policy_id, undefined, "candidates") } | none | none | button/action | none |
| `app-web/src/features/service-explorer/view.tsx:56` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: null })} | none | none | button/action | none |
| `app-web/src/features/service-explorer/view.tsx:99` | `<input>` type="number" | onChange={(e) => { const v = e.target.value; if (v === "") { navigateToServiceExplorer({ serviceId: null, limit: null }); return; } const n = Number.parseInt(v, 10); if (!Number.isNaN(n)) { navigateToServiceExplorer({ serviceId: null, limit: n }); } }} | none | none | form/input change | none |
| `app-web/src/features/service-explorer/view.tsx:119` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: null, limit: null })} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:277` | `<button>` type="button" | onClick={() => navigateToServiceExplorer({ serviceId: data.service_id })} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:280` | `<button>` type="button" | onClick={() => navigateToServiceDossier({ serviceId: data.service_id })} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:283` | `<button>` type="button" | onClick={() => navigateToImpactReportForService(data.service_id)} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:291` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject(firstNode, "node", { previewContext: "topology_drilldown", }) } | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:304` | `<button>` type="button" | onClick={() => navigateToMaintenancePreview({ nodeId: firstNode, previewContext: "topology_drilldown", }) } | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:318` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(firstNode, "node", { previewContext: "topology_drilldown", syncRunsLimit: syncLim, }) } | none | none | button/action | "Uses first Explorer topology node only — not full member discovery" |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:333` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(firstPolicy, "service_impact_workspace")} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:342` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForPolicy(firstPolicy)} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:350` | `<button>` type="button" | onClick={() => navigateToChangeSafetyCaseForService(data.service_id)} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:357` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncLim, { invFrom: "service-impact-workspace", policyId: firstPolicy, }) } | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:369` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(DEFAULT_INVESTIGATION_SYNC_RUNS_LIMIT, { invFrom: "service-impact-workspace" })} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:376` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:379` | `<button>` type="button" | onClick={() => navigateToDeltaDigestView(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:382` | `<button>` type="button" | onClick={() => navigateToEvidenceConsistencyWorkspace(syncLim)} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:385` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncLim })} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/service-impact-workspace-product.tsx:392` | `<button>` type="button" | onClick={onReload} | none | none | button/action | none |
| `app-web/src/features/service-impact-workspace/view.tsx:80` | `<form>` | onSubmit={(e) => { e.preventDefault(); onApplyServiceId(draft); }} | none | none | form submit | none |
| `app-web/src/features/service-impact-workspace/view.tsx:88` | `<input>` | onChange={(e) => setDraft(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/service-impact-workspace/view.tsx:96` | `<button>` type="submit" | none | none | none | semantic/control element | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:49` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncRunsLimit, { invFrom: "situation-room" })} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:57` | `<button>` type="button" | onClick={() => void onReload()} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:60` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:111` | `<button>` type="button" | onClick={() => navigateToEvidenceView("devices")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:122` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:132` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:163` | `<button>` type="button" | onClick={() => navigateToEvidenceView("platform-health")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:218` | `<button>` type="button" | onClick={() => navigateToEvidenceView("workflows")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:229` | `<button>` type="button" | onClick={() => navigateToEvidenceView("audit")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:239` | `<button>` type="button" | onClick={() => navigateToEvidenceView("readiness")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:281` | `<button>` type="button" | onClick={() => navigateToEvidenceView("capabilities")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:309` | `<button>` type="button" | onClick={() => navigateToEvidenceView(p.product_view)} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:389` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRunsLimit, { invFrom: "situation-room" })} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:392` | `<button>` type="button" | onClick={() => navigateToEvidenceView("devices")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:395` | `<button>` type="button" | onClick={() => navigateToEvidenceView("topology")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:398` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:401` | `<button>` type="button" | onClick={() => navigateToEvidenceView("capabilities")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:404` | `<button>` type="button" | onClick={() => navigateToEvidenceView("readiness")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:407` | `<button>` type="button" | onClick={() => navigateToEvidenceView("workflows")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:410` | `<button>` type="button" | onClick={() => navigateToEvidenceView("audit")} | none | none | button/action | none |
| `app-web/src/features/situation-room/situation-room-product.tsx:413` | `<button>` type="button" | onClick={() => navigateToEvidenceView("platform-health")} | none | none | button/action | none |
| `app-web/src/features/situation-room/view.tsx:60` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/stability-workspace/view.tsx:130` | `<button>` type="button" | onClick={() => navigateToEvidenceView("overview")} | none | none | button/action | none |
| `app-web/src/features/stability-workspace/view.tsx:165` | `<button>` type="button" | onClick={() => void summaryQuery.reload()} | none | none | button/action | none |
| `app-web/src/features/stability-workspace/view.tsx:168` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit })} | none | none | button/action | "evidence_quality_workspace_v1 — read-path limits and collection assurance; not stability churn analysis" |
| `app-web/src/features/stability-workspace/view.tsx:261` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(topologyAnchor.objectId, topologyAnchor.kind, { previewContext: "planning_window", syncRunsLimit: syncRunsLimit, }) } | none | none | button/action | none |
| `app-web/src/features/stability-workspace/view.tsx:335` | `<form>` | onSubmit={(e) => { e.preventDefault(); onApplySyncLimit(syncDraft); }} | none | none | form submit | none |
| `app-web/src/features/stability-workspace/view.tsx:344` | `<input>` type="number" | onChange={(e) => setSyncDraft(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/stability-workspace/view.tsx:352` | `<button>` type="submit" | none | none | none | semantic/control element | none |
| `app-web/src/features/stability-workspace/view.tsx:356` | `<form>` | onSubmit={(e) => { e.preventDefault(); onApplyTopology(topId, topKind); }} | none | none | form submit | none |
| `app-web/src/features/stability-workspace/view.tsx:365` | `<input>` | onChange={(e) => setTopId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/stability-workspace/view.tsx:369` | `<select>` | onChange={(e) => setTopKind(e.target.value as "node" \| "link")} | none | none | form/input change | none |
| `app-web/src/features/stability-workspace/view.tsx:370` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/stability-workspace/view.tsx:371` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/stability-workspace/view.tsx:374` | `<button>` type="submit" | none | none | none | semantic/control element | none |
| `app-web/src/features/stability-workspace/view.tsx:377` | `<button>` type="button" | onClick={() => onApplyTopology("", "node")} | none | none | button/action | none |
| `app-web/src/features/stability-workspace/view.tsx:381` | `<form>` | onSubmit={(e) => { e.preventDefault(); onApplyServiceId(svcDraft); }} | none | none | form submit | none |
| `app-web/src/features/stability-workspace/view.tsx:390` | `<input>` | onChange={(e) => setSvcDraft(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/stability-workspace/view.tsx:397` | `<button>` type="submit" | none | none | none | semantic/control element | none |
| `app-web/src/features/stability-workspace/view.tsx:400` | `<button>` type="button" | onClick={() => onApplyServiceId("")} | none | none | button/action | none |
| `app-web/src/features/topology/topology-failure-impact-panel.tsx:197` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(objectId, objectKind, "failure_impact")} | none | none | button/action | none |
| `app-web/src/features/topology/topology-failure-impact-panel.tsx:204` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject(objectId, objectKind, { previewContext: "topology_drilldown", syncRunsLimit: syncRuns, }) } | none | none | button/action | none |
| `app-web/src/features/topology/topology-failure-impact-panel.tsx:216` | `<button>` type="button" | onClick={() => navigateToEvidenceView("policies")} | none | none | button/action | none |
| `app-web/src/features/topology/topology-failure-impact-panel.tsx:220` | `<button>` type="button" | onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("degraded")} | none | none | button/action | none |
| `app-web/src/features/topology/topology-failure-impact-panel.tsx:228` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "topology", topologyObject: { id: objectId, kind: objectKind }, failureImpactEntry: true, }) } | none | none | button/action | none |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:119` | `<button>` type="button" | onClick={() => navigateToOperatorBriefingView(syncRuns, { topologyObject: { id: data.object_identity.object_id, kind: data.object_identity.object_kind, }, invFrom: "topology", }) } | none | none | button/action | none |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:134` | `<button>` type="button" | onClick={() => navigateToMaintenanceEvidenceWorkspaceForTopologyObject( data.object_identity.object_id, data.object_identity.object_kind, { previewContext: "topology_drilldown" }, ) } | none | none | button/action | "Composed maintenance evidence workspace (preview + dossier/timeline/delta + change safety case)" |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:148` | `<button>` type="button" | onClick={() => navigateToMaintenancePreviewForTopologyObject( data.object_identity.object_id, data.object_identity.object_kind, { previewContext: "topology_drilldown" }, ) } | none | none | button/action | "Read-only maintenance planning assembly (not approval or safe-to-change)" |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:162` | `<button>` type="button" | onClick={() => navigateToMaintenanceWindowWorkspaceForTopologyObject( data.object_identity.object_id, data.object_identity.object_kind, { previewContext: "topology_drilldown", syncRunsLimit: syncRuns }, ) } | none | none | button/action | "maintenance_window_workspace_v1 — multi-subject rollup shell; starts with this subject only" |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:176` | `<button>` type="button" | onClick={() => navigateToStabilityWorkspace({ syncRunsLimit: syncRuns, topologyObject: { id: data.object_identity.object_id, kind: data.object_identity.object_kind, }, }) } | none | none | button/action | "operational_stability_summary_v1 lane — same topology anchor as dossier; not evidence consistency" |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:192` | `<button>` type="button" | onClick={() => navigateToEvidenceQualityWorkspace({ syncRunsLimit: syncRuns })} | none | none | button/action | "evidence_quality_workspace_v1 — cross-domain read-path limits; not dossier JSON assembly" |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:338` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicy(item.policy_id)} | none | none | button/action | none |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:373` | `<button>` type="button" | onClick={() => navigateToPoliciesWithDegradedPolicyV1Posture("degraded")} | none | none | button/action | none |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:385` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "topology", topologyObject: { id: objectId, kind: objectKind }, failureImpactEntry: true, }) } | none | none | button/action | none |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:401` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: "topology", topologyObject: { id: objectId, kind: objectKind }, riskSummaryEntry: true, }) } | none | none | button/action | none |
| `app-web/src/features/topology/topology-object-dossier-workspace.tsx:417` | `<button>` type="button" | onClick={() => { navigateToEvidenceView("situation-room"); }} | none | none | button/action | none |
| `app-web/src/features/topology/topology-object-evidence-delta-panel.tsx:221` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceDeltaFocus(p.policy_id)} | none | none | button/action | "Open Policies with policy evidence delta focus" |
| `app-web/src/features/topology/topology-object-evidence-timeline-panel.tsx:136` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyEvidenceTimelineFocus(entry.policy_id!)} | none | none | button/action | "Open Policies with policy evidence timeline focus — full policy-only depth" |
| `app-web/src/features/topology/topology-related-policies-panel.tsx:176` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicy(item.policy_id)} | none | none | button/action | none |
| `app-web/src/features/topology/topology-related-policies-panel.tsx:183` | `<button>` type="button" | onClick={() => navigateToPoliciesPolicyPathAnalysis(item.policy_id)} | none | none | button/action | none |
| `app-web/src/features/topology/topology-related-policies-panel.tsx:190` | `<button>` type="button" | onClick={() => navigateToPolicyDossierWorkspace(item.policy_id, "topology_related_policies_panel") } | none | none | button/action | none |
| `app-web/src/features/topology/topology-related-policies-panel.tsx:199` | `<button>` type="button" | onClick={() => navigateToServiceExplorerForPolicy(item.policy_id)} | none | none | button/action | none |
| `app-web/src/features/topology/topology-related-policies-panel.tsx:206` | `<button>` type="button" | onClick={() => navigateToServiceDossierForPolicy(item.policy_id)} | none | none | button/action | "service_dossier_v1 for policy:… — same service_id anchor as Service Explorer" |
| `app-web/src/features/topology/topology-risk-attention-panel.tsx:145` | `<button>` type="button" | onClick={() => { if (drillToObject) { drillToObject(row.object_id, row.object_kind); } else { navigateToTopologyObject(row.object_id, row.object_kind); } }} | none | none | button/action | none |
| `app-web/src/features/topology/topology-risk-attention-panel.tsx:165` | `<button>` type="button" | onClick={() => navigateToTopologyDossier( row.object_id, row.object_kind, variant === "overview" ? "overview_risk" : "risk_summary", ) } | none | none | button/action | none |
| `app-web/src/features/topology/topology-risk-attention-panel.tsx:184` | `<button>` type="button" | onClick={() => navigateToInvestigationView(syncRuns, { invFrom: invFromForInvestigation, topologyObject: { id: row.object_id, kind: row.object_kind }, riskSummaryEntry: true, }) } | none | none | button/action | none |
| `app-web/src/features/topology/view.tsx:739` | `<button>` type="button" | onClick={loadControllerEvidence} | {controllerEvidenceLoading} | none | button/action | none |
| `app-web/src/features/topology/view.tsx:835` | `<button>` type="button" | onClick={loadTopologyTruth} | {truthLoading} | none | button/action | none |
| `app-web/src/features/topology/view.tsx:1789` | `<button>` type="button" | onClick={() => setWorkspaceMode("standard")} | none | none | button/action | none |
| `app-web/src/features/topology/view.tsx:1796` | `<button>` type="button" | onClick={() => setWorkspaceMode("dossier")} | none | none | button/action | none |
| `app-web/src/features/topology/view.tsx:1813` | `<input>` | onChange={(event) => setNodeSearchValue(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:1821` | `<select>` | onChange={(event) => setNodeStateFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:1825` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1826` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1827` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1828` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1829` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1834` | `<select>` | onChange={(event) => setNodeRoleFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:1838` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1840` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1848` | `<select>` | onChange={(event) => setNodeSortBy(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:1849` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1850` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1851` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:1895` | `<button>` type="button" | onClick={() => setSelectedNodeId(node.node_id)} | none | none | button/action | none |
| `app-web/src/features/topology/view.tsx:1916` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(node.node_id, "node", "topology_table")} | none | none | button/action | none |
| `app-web/src/features/topology/view.tsx:2007` | `<input>` | onChange={(event) => setLinkSearchValue(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:2015` | `<select>` | onChange={(event) => setLinkStateFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:2019` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2020` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2021` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2022` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2023` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2028` | `<select>` | onChange={(event) => setLinkKnowledgeFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:2032` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2034` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2042` | `<select>` | onChange={(event) => setLinkEvidenceFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:2046` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2047` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2048` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2049` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2054` | `<select>` | onChange={(event) => setLinkSortBy(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/topology/view.tsx:2055` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2056` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2057` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/topology/view.tsx:2102` | `<button>` type="button" | onClick={() => setSelectedLinkId(link.link_id)} | none | none | button/action | none |
| `app-web/src/features/topology/view.tsx:2134` | `<button>` type="button" | onClick={() => navigateToTopologyDossier(link.link_id, "link", "topology_table")} | none | none | button/action | none |
| `app-web/src/features/validation-workspace/view.tsx:57` | `<input>` type="text" | onChange={(e) => setPolicyId(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/validation-workspace/view.tsx:68` | `<select>` | onChange={(e) => setContext(e.target.value as "pre_change" \| "post_change")} | none | none | form/input change | none |
| `app-web/src/features/validation-workspace/view.tsx:73` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/validation-workspace/view.tsx:74` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/validation-workspace/view.tsx:79` | `<button>` type="button" | onClick={onSubmit} | {busy} | none | state-changing or workflow control | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:123` | `<button>` type="button" | onClick={() => { const sp = mergeViewIntoSearch(window.location.search, "workflows"); replaceUrlSearchParams(sp); }} | none | none | state-changing or workflow control | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:149` | `<input>` | onChange={(e) => setCreateType(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:157` | `<input>` | onChange={(e) => setCreateTitle(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:165` | `<input>` | onChange={(e) => setCreateDescription(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:173` | `<select>` | onChange={(e) => setCreateStatus(e.target.value as WorkflowLifecycleStatus)} | none | none | form/input change | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:178` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:186` | `<button>` type="button" | onClick={() => void onCreate()} | {createBusy} | none | state-changing or workflow control | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:218` | `<button>` type="button" | onClick={() => onSelectRow(w.workflow_id)} | none | none | state-changing or workflow control | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:227` | `<button>` type="button" | onClick={() => onSelectRow(w.workflow_id)} | none | none | state-changing or workflow control | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:236` | `<button>` type="button" | onClick={() => onSelectRow(w.workflow_id)} | none | none | state-changing or workflow control | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:263` | `<button>` type="button" | onClick={onClearSelection} | none | none | state-changing or workflow control | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:295` | `<select>` | onChange={(e) => setTransitionNext(e.target.value as WorkflowLifecycleStatus)} | none | none | form/input change | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:300` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:308` | `<input>` | onChange={(e) => setTransitionReason(e.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflow-lifecycle/view.tsx:316` | `<button>` type="button" | onClick={() => void onTransition()} | {transitionBusy} | none | state-changing or workflow control | none |
| `app-web/src/features/workflows/view.tsx:417` | `<button>` type="button" | onClick={() => void reload()} | none | none | button/action | none |
| `app-web/src/features/workflows/view.tsx:655` | `<input>` | onChange={(event) => setSearchValue(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflows/view.tsx:663` | `<select>` | onChange={(event) => setStatusFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflows/view.tsx:667` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:668` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:669` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:670` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:671` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:676` | `<select>` | onChange={(event) => setScopeFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflows/view.tsx:680` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:681` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:682` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:683` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:684` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:689` | `<select>` | onChange={(event) => setArtifactFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflows/view.tsx:693` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:694` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:695` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:696` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:701` | `<select>` | onChange={(event) => setEvidenceFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflows/view.tsx:705` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:706` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:707` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:708` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:709` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:710` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:711` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:712` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:717` | `<select>` | onChange={(event) => setRecencyFilter(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflows/view.tsx:721` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:722` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:723` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:724` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:725` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:726` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:731` | `<select>` | onChange={(event) => setSortOrder(event.target.value)} | none | none | form/input change | none |
| `app-web/src/features/workflows/view.tsx:732` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:733` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:734` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:735` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:736` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:737` | `<option>` | none | none | none | semantic/control element | none |
| `app-web/src/features/workflows/view.tsx:777` | `<button>` type="button" | onClick={() => setSelectedWorkflowId(item.workflow_id)} | none | none | button/action | none |

## Rewrite Requirement

- Every state-changing or workflow-control row must remain either explicitly ported or intentionally hidden before feature migration.
- Every route/navigation action must be covered by route parity or new-route compatibility tests.
- Every download/report/export action must preserve its endpoint family and artifact identity.
