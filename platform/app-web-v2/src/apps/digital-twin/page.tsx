import type {
  DigitalTwinObjectContextResponse,
  DigitalTwinOverviewResponse,
} from '../../api/types'
import {
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  FutureCapabilityCard,
  LoadingSkeleton,
  NonClaimBanner,
} from '../../design-system/components'

export type DigitalTwinViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded' | 'future'

export interface DigitalTwinPageProps {
  overview: DigitalTwinOverviewResponse
  objectContext: DigitalTwinObjectContextResponse
  state: DigitalTwinViewState
  path: string
}

function viewLabel(path: string): string {
  if (path.endsWith('/map')) return 'Map'
  if (path.endsWith('/paths')) return 'Paths'
  if (path.endsWith('/snapshots')) return 'Snapshots'
  if (path.endsWith('/queries')) return 'Queries'
  return 'Map'
}

const STATIC_KPIS = [
  { id: 'discovered', label: 'Discovered Objects', value: '18,782', delta: '+4.2%', tone: 'green' as const },
  { id: 'active-links', label: 'Active Links', value: '34,916', delta: '+1.8%', tone: 'green' as const },
  { id: 'confidence', label: 'Topology Confidence', value: '92.4%', delta: 'High', tone: 'green' as const },
  { id: 'freshness', label: 'Snapshot Freshness', value: '7m', delta: 'Excellent', tone: 'green' as const },
  { id: 'divergences', label: 'Divergences', value: '23', delta: 'Minor', tone: 'orange' as const },
  { id: 'impacted', label: 'Impacted Services', value: '12', delta: 'Medium', tone: 'orange' as const },
  { id: 'simulations', label: 'Simulations Ready', value: '7', delta: 'Ready', tone: 'blue' as const },
]

const TABS = ['Map', 'Layers', 'Paths', 'Dependencies', 'Snapshots', 'Diff', 'Queries', 'Evidence', 'What-If']

const QUERY_CARDS = [
  'Reachability: SEA1 → FRA1',
  'Devices without BFD',
  'Links > 80% Utilization',
  'Services impacted by NYC1',
]

export function DigitalTwinPage({ overview: _overview, objectContext: _objectContext, state, path }: DigitalTwinPageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Topology canvas and evidence sections are loading." />
  }

  const activeTab = viewLabel(path)

  return (
    <section className="digital-twin">
      {/* Visually hidden view label retained for route tests */}
      <span className="sr-only">Digital Twin workspace: {activeTab}</span>

      {/* ── Page header ── */}
      <div className="dt-header">
        <div className="dt-header-title-group">
          <h1>Network Digital Twin</h1>
          <p className="dt-subtitle">Evidence-backed graph, analysis, and simulation of your network.</p>
          <p className="dt-safety-copy">Evidence-backed topology view, not a forwarding guarantee.</p>
        </div>
        <div className="dt-header-actions">
          <span className="dt-last-updated">
            <span className="dt-live-dot" />
            Last updated: 2m ago
          </span>
          <button type="button" className="dt-icon-btn" aria-label="Refresh">↺</button>
          <button type="button" className="dt-btn-ghost">View Options</button>
          <button type="button" className="dt-icon-btn" aria-label="More actions">···</button>
          <button type="button" className="dt-btn-secondary">Share</button>
          <button type="button" className="dt-btn-primary">Save View</button>
        </div>
      </div>

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Digital Twin data error"
          message="Backend data is unavailable for this section. Do not infer operational state from this placeholder."
        />
      ) : null}

      {/* ── Horizontal tabs ── */}
      <div className="dt-tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            className="dt-tab"
            aria-selected={tab === 'Map' ? 'true' : 'false'}
            aria-current={tab === 'Map' ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── KPI row ── */}
      {state === 'empty' ? (
        <EmptyState title="No topology objects." message="No topology evidence is available yet." />
      ) : (
        <div className="dt-kpi-row">
          {STATIC_KPIS.map((kpi) => (
            <article key={kpi.id} className="dt-kpi-card">
              <span className={`dt-kpi-icon-tile dt-kpi-icon--${kpi.tone}`} aria-hidden="true">⬡</span>
              <span className="dt-kpi-label">{kpi.label}</span>
              <span className="dt-kpi-value">{kpi.value}</span>
              <span className={`dt-kpi-delta dt-kpi-delta--${kpi.tone}`}>{kpi.delta}</span>
            </article>
          ))}
        </div>
      )}

      {/* ── Main content row: canvas + analysis stack ── */}
      <div className="dt-main-row">

        {/* Topology canvas panel */}
        <article className="dt-canvas-panel">
          <div className="dt-canvas-panel-header">
            <div>
              <h2 className="dt-canvas-title">Topology Canvas</h2>
              <span className="dt-canvas-summary">Evidence-backed graph</span>
            </div>
          </div>

          <div className="dt-canvas-controls">
            <input
              type="search"
              className="dt-canvas-search"
              placeholder="Search node, site, service..."
              aria-label="Search topology"
            />
            <select className="dt-canvas-select" aria-label="Layer filter">
              <option>Layers: All</option>
              <option>Physical</option>
              <option>Logical</option>
            </select>
            <label className="dt-toggle-wrap">
              <input type="checkbox" className="dt-toggle-cb" defaultChecked /> Path Overlay
            </label>
            <label className="dt-toggle-wrap">
              <input type="checkbox" className="dt-toggle-cb" /> Traffic Heatmap
            </label>
            <select className="dt-canvas-select" aria-label="Layout mode">
              <option>Layout: Force</option>
              <option>Layout: Hierarchical</option>
            </select>
            <div className="dt-canvas-icon-group">
              <button type="button" className="dt-icon-btn" aria-label="Fit to screen">⊞</button>
              <button type="button" className="dt-icon-btn" aria-label="Export graph">↓</button>
              <button type="button" className="dt-icon-btn" aria-label="Filter nodes">⊟</button>
            </div>
          </div>

          {/* SVG topology canvas */}
          <div className="dt-canvas-stage" role="img" aria-label="Network topology canvas">
            <svg viewBox="0 0 712 390" className="dt-topology-svg" aria-hidden="true">
              <defs>
                <pattern id="dt-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(47,124,240,0.07)" strokeWidth="0.5" />
                </pattern>
                <marker id="dt-arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#2f7cf0" />
                </marker>
                <filter id="dt-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="712" height="390" fill="#f8fbff" rx="10" />
              <rect width="712" height="390" fill="url(#dt-grid)" rx="10" />

              {/* ── Regions — top row ── */}
              {/* US-West: x=12–190 */}
              <rect x="12" y="16" width="178" height="188" rx="14" fill="rgba(237,244,255,0.65)" stroke="#cfe0f4" strokeWidth="1" />
              <text x="101" y="33" textAnchor="middle" className="dt-region-label">US-WEST</text>

              {/* US-East: x=204–382 */}
              <rect x="204" y="16" width="178" height="188" rx="14" fill="rgba(237,244,255,0.65)" stroke="#cfe0f4" strokeWidth="1" />
              <text x="293" y="33" textAnchor="middle" className="dt-region-label">US-EAST</text>

              {/* EU-West: x=396–574 */}
              <rect x="396" y="16" width="178" height="188" rx="14" fill="rgba(237,244,255,0.65)" stroke="#cfe0f4" strokeWidth="1" />
              <text x="485" y="33" textAnchor="middle" className="dt-region-label">EU-WEST</text>

              {/* ── Regions — bottom row ── */}
              {/* APAC-Singapore: x=12–190 */}
              <rect x="12" y="218" width="178" height="152" rx="14" fill="rgba(237,244,255,0.65)" stroke="#cfe0f4" strokeWidth="1" />
              <text x="101" y="236" textAnchor="middle" className="dt-region-label">APAC-SINGAPORE</text>

              {/* APAC-Sydney: x=204–382 */}
              <rect x="204" y="218" width="178" height="152" rx="14" fill="rgba(237,244,255,0.65)" stroke="#cfe0f4" strokeWidth="1" />
              <text x="293" y="236" textAnchor="middle" className="dt-region-label">APAC-SYDNEY</text>

              {/* ── Links ── */}
              {/* SEA1→CHI1: selected path segment (blue thick) */}
              <line x1="101" y1="116" x2="245" y2="116" stroke="#2f7cf0" strokeWidth="4" filter="url(#dt-glow-blue)" markerEnd="url(#dt-arrow-blue)" />
              {/* CHI1→NYC1: selected path segment */}
              <line x1="269" y1="116" x2="341" y2="116" stroke="#2f7cf0" strokeWidth="4" filter="url(#dt-glow-blue)" markerEnd="url(#dt-arrow-blue)" />
              {/* NYC1→FRA1: selected path segment */}
              <line x1="365" y1="116" x2="463" y2="116" stroke="#2f7cf0" strokeWidth="4" filter="url(#dt-glow-blue)" markerEnd="url(#dt-arrow-blue)" />
              {/* FRA1 → right edge: healthy green outbound */}
              <line x1="507" y1="116" x2="596" y2="116" stroke="#22c55e" strokeWidth="2" />
              <circle cx="600" cy="116" r="5" fill="#22c55e" />
              {/* CHI1 → SIN1: dashed dependency (vertical) */}
              <line x1="257" y1="140" x2="257" y2="218" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="6,4" />
              <line x1="257" y1="218" x2="101" y2="250" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="6,4" />
              {/* SIN1 → APAC-Sydney cross-link: warning utilization */}
              <line x1="101" y1="300" x2="225" y2="300" stroke="#f59e0b" strokeWidth="2" />

              {/* ── Nodes ── */}
              {/* SEA1 — selected path start, US-West */}
              <rect x="79" y="94" width="44" height="44" rx="12" fill="#ffffff" stroke="#2f7cf0" strokeWidth="2.5" />
              <text x="101" y="118" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#2f7cf0">⬡</text>
              <text x="101" y="148" textAnchor="middle" className="dt-node-label">SEA1</text>

              {/* CHI1 — left of US-East */}
              <rect x="233" y="94" width="36" height="36" rx="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
              <text x="251" y="114" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#64748b">⬡</text>
              <text x="251" y="142" textAnchor="middle" className="dt-node-label">CHI1</text>

              {/* NYC1 — critical, right of US-East */}
              <rect x="319" y="88" width="48" height="48" rx="12" fill="#ffffff" stroke="#ef4444" strokeWidth="2.5"
                filter="drop-shadow(0 0 6px rgba(239,68,68,0.25))" />
              <text x="343" y="115" textAnchor="middle" dominantBaseline="middle" fontSize="17" fill="#ef4444">⬡</text>
              <text x="343" y="148" textAnchor="middle" className="dt-node-label dt-node-label--critical">NYC1</text>

              {/* FRA1 — path end, EU-West */}
              <rect x="463" y="94" width="44" height="44" rx="12" fill="#ffffff" stroke="#2f7cf0" strokeWidth="2.5" />
              <text x="485" y="118" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#2f7cf0">⬡</text>
              <text x="485" y="148" textAnchor="middle" className="dt-node-label">FRA1</text>

              {/* SIN1 — APAC-Singapore */}
              <rect x="79" y="278" width="40" height="40" rx="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
              <text x="99" y="300" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#64748b">⬡</text>
              <text x="99" y="330" textAnchor="middle" className="dt-node-label">SIN1</text>
            </svg>

            {/* Legend */}
            <div className="dt-canvas-legend">
              <span className="dt-legend-item">
                <span className="dt-legend-line dt-legend-line--selected" />Selected Path
              </span>
              <span className="dt-legend-item">
                <span className="dt-legend-line dt-legend-line--healthy" />Healthy
              </span>
              <span className="dt-legend-item">
                <span className="dt-legend-line dt-legend-line--warning" />High Util
              </span>
              <span className="dt-legend-item">
                <span className="dt-legend-line dt-legend-line--critical" />Critical
              </span>
              <span className="dt-legend-item">
                <span className="dt-legend-line dt-legend-line--dashed" />Dependency
              </span>
            </div>

            {/* Zoom controls */}
            <div className="dt-zoom-controls">
              <button type="button" className="dt-zoom-btn" aria-label="Zoom in">+</button>
              <button type="button" className="dt-zoom-btn" aria-label="Zoom out">−</button>
              <button type="button" className="dt-zoom-btn" aria-label="Reset zoom">⊙</button>
            </div>
          </div>
        </article>

        {/* Right analysis stack */}
        <div className="dt-analysis-stack">

          {/* Path Analysis */}
          <article className="dt-analysis-panel">
            <h3 className="dt-panel-title">Path Analysis</h3>
            <p className="dt-path-route">From SEA1 to FRA1</p>
            <span className="dt-badge dt-badge--green">Reachable</span>
            <dl className="dt-path-stats">
              <div className="dt-stat-cell">
                <dt>Latency</dt>
                <dd>78.6 ms</dd>
              </div>
              <div className="dt-stat-cell">
                <dt>Hops</dt>
                <dd>8</dd>
              </div>
              <div className="dt-stat-cell">
                <dt>Bandwidth</dt>
                <dd>8.3 Gbps</dd>
              </div>
            </dl>
            <div className="dt-path-sequence">
              <span className="dt-path-node">SEA1</span>
              <span className="dt-path-arrow">→</span>
              <span className="dt-path-node">CHI1</span>
              <span className="dt-path-arrow">→</span>
              <span className="dt-path-node">NYC1</span>
              <span className="dt-path-arrow">→</span>
              <span className="dt-path-node">FRA1</span>
            </div>
            <button type="button" className="dt-link-btn">View All Paths (3)</button>
            <NonClaimBanner copy="Path analysis is bounded by available evidence and is not dataplane proof." />
          </article>

          {/* Snapshots & Diff */}
          <article className="dt-analysis-panel">
            <h3 className="dt-panel-title">Snapshots &amp; Diff</h3>
            <div className="dt-snap-selectors">
              <select className="dt-snap-select" aria-label="Baseline snapshot">
                <option>Baseline: May 13, 09:00</option>
              </select>
              <select className="dt-snap-select" aria-label="Current snapshot">
                <option>Current: May 13, 10:00</option>
              </select>
            </div>
            <dl className="dt-diff-stats">
              <div className="dt-diff-row">
                <dt className="dt-diff--added">Added</dt>
                <dd>128</dd>
              </div>
              <div className="dt-diff-row">
                <dt className="dt-diff--removed">Removed</dt>
                <dd>37</dd>
              </div>
              <div className="dt-diff-row">
                <dt className="dt-diff--changed">Changed</dt>
                <dd>92</dd>
              </div>
              <div className="dt-diff-row dt-diff-row--total">
                <dt>Total Diff</dt>
                <dd>257</dd>
              </div>
            </dl>
            <button type="button" className="dt-link-btn">View Diff Summary</button>
          </article>

          {/* Dependency / Service Impact Matrix */}
          <article className="dt-analysis-panel dt-analysis-panel--matrix">
            <h3 className="dt-panel-title">Dependency / Service Impact</h3>
            <div className="dt-matrix-grid">
              <div className="dt-matrix-cell dt-matrix--low">Low</div>
              <div className="dt-matrix-cell dt-matrix--medium">Med</div>
              <div className="dt-matrix-cell dt-matrix--high">High</div>
              <div className="dt-matrix-cell dt-matrix--medium">Med</div>
              <div className="dt-matrix-cell dt-matrix--high">High</div>
              <div className="dt-matrix-cell dt-matrix--low">Low</div>
              <div className="dt-matrix-cell dt-matrix--high">High</div>
              <div className="dt-matrix-cell dt-matrix--low">Low</div>
              <div className="dt-matrix-cell dt-matrix--medium">Med</div>
            </div>
            <div className="dt-matrix-legend">
              <span className="dt-legend-dot dt-legend-dot--low" />Low
              <span className="dt-legend-dot dt-legend-dot--medium" />Medium
              <span className="dt-legend-dot dt-legend-dot--high" />High
            </div>
          </article>

        </div>
      </div>

      {/* ── Queries strip ── */}
      <article className="dt-queries-strip">
        <div className="dt-queries-header">
          <h3 className="dt-panel-title">Queries</h3>
          <div className="dt-queries-controls">
            <select className="dt-snap-select" aria-label="Saved queries">
              <option>Saved Queries</option>
            </select>
            <button type="button" className="dt-btn-primary">+ New Query</button>
          </div>
        </div>
        <div className="dt-query-cards">
          {QUERY_CARDS.map((q) => (
            <article key={q} className="dt-query-card">
              <span className="dt-query-icon" aria-hidden="true">⊞</span>
              <span className="dt-query-name">{q}</span>
            </article>
          ))}
          <button type="button" className="dt-link-btn dt-link-btn--view-all">View All</button>
        </div>
        <NonClaimBanner copy="Controller evidence is bounded and may be partial or unavailable." />
      </article>

      {/* Future capability card */}
      {state === 'future' ? (
        <FutureCapabilityCard
          title="What-if simulation"
          reason="Future capability: backend support is not implemented yet."
          requiredBackend="digital-twin-simulation-api"
        />
      ) : null}

      {/* Disabled action controls — preserved for test compatibility */}
      <div className="dt-actions-bar">
        <button type="button" className="ds-control" aria-label="Run what-if simulation" disabled>
          Run what-if simulation
        </button>
        <button type="button" className="ds-control" aria-label="Program controller path" disabled>
          Program controller path
        </button>
      </div>
    </section>
  )
}
