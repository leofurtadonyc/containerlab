import { FutureCapabilityCard, MetricCard, NonClaimBanner } from '../../design-system/components'

export function TrafficIntelligencePage() {
  return (
    <section className="traffic-intelligence">
      <h1>Traffic Intelligence</h1>
      <NonClaimBanner copy="Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet." />

      <div className="traffic-intelligence-kpi-row">
        <MetricCard label="Total traffic" value="Not available" tone="future" helperText="Future capability placeholder." />
        <MetricCard label="Flow rate" value="Not available" tone="future" helperText="Future capability placeholder." />
        <MetricCard label="Top application" value="Not available" tone="future" helperText="Future capability placeholder." />
        <MetricCard label="Top talker" value="Not available" tone="future" helperText="Future capability placeholder." />
      </div>

      <div className="traffic-intelligence-grid">
        <FutureCapabilityCard
          title="Traffic map"
          reason="Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet."
          requiredBackend="traffic-map-api"
        />
        <FutureCapabilityCard
          title="Traffic over time"
          reason="Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet."
          requiredBackend="traffic-timeseries-api"
        />
        <FutureCapabilityCard
          title="Top applications"
          reason="Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet."
          requiredBackend="traffic-app-ranking-api"
        />
        <FutureCapabilityCard
          title="Anomalies"
          reason="Future capability: traffic intelligence backend support is not implemented. No flow telemetry or anomaly detection is available in this product yet."
          requiredBackend="traffic-anomaly-api"
        />
      </div>

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">Actions remain disabled until traffic intelligence backend support exists.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Create filter" disabled>
            Create filter
          </button>
          <button type="button" className="ds-control" aria-label="Export flows" disabled>
            Export flows
          </button>
          <button type="button" className="ds-control" aria-label="Open conversations" disabled>
            Open conversations
          </button>
        </div>
      </article>
    </section>
  )
}
