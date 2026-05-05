import type { FacadeSectionStatus, IntentComplianceOverviewResponse } from '../../api/types'
import {
  DataTable,
  DegradedStateBanner,
  EmptyState,
  ErrorState,
  FutureCapabilityCard,
  LoadingSkeleton,
  MetricCard,
  NonClaimBanner,
} from '../../design-system/components'

export type IntentComplianceViewState = 'ready' | 'loading' | 'empty' | 'error' | 'degraded'

export interface IntentCompliancePageProps {
  data: IntentComplianceOverviewResponse
  state: IntentComplianceViewState
}

function toneFromStatus(status: FacadeSectionStatus): 'healthy' | 'warning' | 'critical' | 'pending' | 'readOnly' {
  if (status === 'partial') return 'warning'
  if (status === 'degraded' || status === 'error' || status === 'blocked') return 'critical'
  return 'readOnly'
}

export function IntentCompliancePage({ data, state }: IntentCompliancePageProps) {
  if (state === 'loading') {
    return <LoadingSkeleton title="Loading state example" message="Intent posture and compliance evidence are loading." />
  }

  const kpis = state === 'empty' ? [] : (data.kpis.data ?? [])
  const topDrifted = state === 'empty' ? [] : (data.top_drifted_intents.data ?? [])
  const validations = state === 'empty' ? [] : (data.policy_validations.data ?? [])
  const recommendations = state === 'empty' ? [] : (data.remediation_recommendations.data ?? [])

  return (
    <section className="intent-compliance">
      <h1>Intent &amp; Compliance</h1>
      <NonClaimBanner copy="Compliance reflects available platform evidence, not certification or multi-vendor parity." />
      <NonClaimBanner copy="Remediation is disabled unless a bounded backend workflow explicitly supports it." />

      {state === 'degraded' ? (
        <DegradedStateBanner message="Partial evidence only. Some sources are missing, stale, or unavailable." />
      ) : null}
      {state === 'error' ? (
        <ErrorState
          title="Intent & Compliance data error"
          message="Backend data is unavailable for this section. Do not infer policy posture from this placeholder."
        />
      ) : null}

      {kpis.length === 0 ? (
        <EmptyState title="No policy/intent evidence." message="Intent and compliance data is unavailable." />
      ) : (
        <div className="intent-compliance-kpi-row">
          {kpis.map((kpi) => (
            <MetricCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              tone={toneFromStatus(kpi.status)}
              helperText={kpi.status}
            />
          ))}
        </div>
      )}

      <div className="intent-compliance-grid">
        <article className="ds-card">
          <h3>Intent vs observed state</h3>
          <DataTable
            caption="Intent versus observed posture"
            columns={['In sync', 'Drifted', 'Unknown']}
            rows={[
              [
                String(data.intent_vs_observed.data?.in_sync ?? 'n/a'),
                String(data.intent_vs_observed.data?.drifted ?? 'n/a'),
                String(data.intent_vs_observed.data?.unknown ?? 'n/a'),
              ],
            ]}
          />
        </article>

        <article className="ds-card">
          <h3>Top drifted intents</h3>
          <DataTable
            caption="Top drifted intents"
            columns={['Intent', 'Drift level', 'Evidence']}
            rows={topDrifted.map((intent) => [intent.intent, intent.drift_level, intent.evidence])}
          />
        </article>
      </div>

      <article className="ds-card">
        <h3>Recent policy validations</h3>
        <DataTable
          caption="Recent policy validations"
          columns={['Policy', 'Status', 'Last checked']}
          rows={validations.map((validation) => [validation.policy, validation.status, validation.last_checked])}
        />
      </article>

      <article className="ds-card">
        <h3>Remediation recommendations</h3>
        {recommendations.length > 0 ? (
          recommendations.map((item) => (
            <FutureCapabilityCard
              key={item.id}
              title={item.label}
              reason={item.reason}
              requiredBackend="intent-remediation-workflow-api"
            />
          ))
        ) : (
          <EmptyState title="No remediation recommendations available." message="Remediation recommendations are unavailable." />
        )}
      </article>

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">State-changing remediation and enforcement controls remain disabled.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Auto-remediate" disabled>
            Auto-remediate
          </button>
          <button type="button" className="ds-control" aria-label="Enforce intent" disabled>
            Enforce intent
          </button>
        </div>
      </article>
    </section>
  )
}
