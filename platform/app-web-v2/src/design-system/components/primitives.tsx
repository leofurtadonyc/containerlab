import type { PropsWithChildren, ReactNode } from 'react'

export type StatusTone = 'healthy' | 'warning' | 'critical' | 'unknown' | 'pending' | 'future' | 'readOnly'
export type Density = 'compact' | 'comfortable'

export interface NavItem {
  id: string
  label: string
  disabled?: boolean
}

export function AppShell({
  apps,
  activeAppId,
  topBar,
  sidebar,
  tabs,
  verticalMenu,
  contextDrawer,
  children,
}: PropsWithChildren<{
  apps: NavItem[]
  activeAppId: string
  topBar: ReactNode
  sidebar: ReactNode
  tabs?: ReactNode
  verticalMenu?: ReactNode
  contextDrawer?: ReactNode
}>) {
  return (
    <div className="ds-app-shell theme-v2-dark" data-active-app={activeAppId}>
      <header role="banner">{topBar}</header>
      <aside aria-label="Apps" className="ds-app-sidebar-host">
        {sidebar}
      </aside>
      <section className="ds-app-main">
        {tabs}
        <div className="ds-workspace">
          {verticalMenu}
          <main role="main" className="ds-content">
            {children}
          </main>
          <aside aria-label="Context" className="ds-drawer-host">
            {contextDrawer}
          </aside>
        </div>
      </section>
      <span className="sr-only">Apps registered: {apps.length}</span>
    </div>
  )
}

export function TopBar({
  environment,
  fabric,
  commandSlot,
}: {
  environment: string
  fabric: string
  commandSlot?: ReactNode
}) {
  return (
    <div className="ds-top-bar">
      <span className="ds-brand">Network Change Safety and Transport Assurance Platform</span>
      <div className="ds-top-controls">
        <button type="button" className="ds-control" aria-label="Environment selector" disabled>
          Env: {environment}
        </button>
        <button type="button" className="ds-control" aria-label="Fabric selector" disabled>
          Fabric: {fabric}
        </button>
        {commandSlot}
        <button type="button" className="ds-control" aria-label="Notifications" disabled>
          Notifications
        </button>
      </div>
    </div>
  )
}

export function AppSidebar({ items, activeId }: { items: NavItem[]; activeId: string }) {
  return (
    <nav className="ds-app-sidebar" aria-label="App sidebar">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-nav-item"
          aria-current={item.id === activeId ? 'page' : undefined}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export function AppTabs({ items, activeId }: { items: NavItem[]; activeId: string }) {
  return (
    <nav className="ds-tabs" aria-label="App tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-tab"
          aria-current={item.id === activeId ? 'page' : undefined}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export function VerticalMenu({ items, activeId }: { items: NavItem[]; activeId: string }) {
  return (
    <nav className="ds-vertical-menu" aria-label="Section menu">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-menu-item"
          aria-current={item.id === activeId ? 'page' : undefined}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span className="status-chip" data-tone={tone}>
      <span aria-hidden="true">●</span>
      <span>{label}</span>
    </span>
  )
}

export function MetricCard({
  label,
  value,
  tone,
  helperText,
}: {
  label: string
  value: string
  tone: StatusTone
  helperText?: string
}) {
  return (
    <article className="ds-card">
      <div className="ds-card-row">
        <strong>{label}</strong>
        <StatusChip tone={tone} label={tone} />
      </div>
      <p className="ds-kpi-value">{value}</p>
      {helperText ? <p className="ds-muted">{helperText}</p> : null}
    </article>
  )
}

export function ConfidenceMeter({ label, score }: { label: string; score: number }) {
  return (
    <div className="ds-card">
      <div className="ds-card-row">
        <strong>{label}</strong>
        <span>{score}%</span>
      </div>
      <div className="ds-meter">
        <div className="ds-meter-fill" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
    </div>
  )
}

export function DataTable({
  columns,
  rows,
  caption,
  density = 'compact',
}: {
  columns: string[]
  rows: string[][]
  caption: string
  density?: Density
}) {
  return (
    <table className="ds-table" data-density={density} aria-label={caption}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={`${caption}-${idx}`}>
            {row.map((cell, cellIdx) => (
              <td key={`${caption}-${idx}-${cellIdx}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LoadingSkeleton({ title, message }: { title: string; message: string }) {
  return (
    <div className="ds-feedback" role="status" aria-live="polite">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="ds-feedback">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}

export function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="ds-feedback" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}

export function DegradedStateBanner({ message }: { message: string }) {
  return (
    <p className="ds-degraded-banner" role="status">
      {message}
    </p>
  )
}

export function FutureCapabilityCard({
  title,
  reason,
  requiredBackend,
}: {
  title: string
  reason: string
  requiredBackend: string
}) {
  return (
    <article className="ds-card ds-card-future">
      <StatusChip tone="future" label="future" />
      <h3>{title}</h3>
      <p className="ds-muted">{reason}</p>
      <p className="ds-muted">Required backend: {requiredBackend}</p>
    </article>
  )
}

export function NonClaimBanner({ copy }: { copy: string }) {
  return <p className="ds-non-claim">{copy}</p>
}

export function ContextDrawer({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <section className="ds-drawer" role="complementary" aria-label={title}>
      <h3>{title}</h3>
      {subtitle ? <p className="ds-muted">{subtitle}</p> : null}
      {children}
    </section>
  )
}

export function EvidenceDrawer({
  title,
  sections,
}: {
  title: string
  sections: Array<{ id: string; label: string; status: string }>
}) {
  return (
    <section className="ds-drawer" role="complementary" aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {sections.map((section) => (
          <li key={section.id}>
            {section.label}: <span className="ds-muted">{section.status}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function WorkflowStepper({
  steps,
  activeStepId,
  blockedReason,
}: {
  steps: Array<{ id: string; label: string; status: string }>
  activeStepId: string
  blockedReason?: string
}) {
  return (
    <ol className="ds-stepper">
      {steps.map((step) => (
        <li key={step.id} aria-current={step.id === activeStepId ? 'step' : undefined}>
          <strong>{step.label}</strong> - <span className="ds-muted">{step.status}</span>
        </li>
      ))}
      {blockedReason ? <li className="ds-muted">Blocked: {blockedReason}</li> : null}
    </ol>
  )
}

export function ApprovalQueue({
  items,
}: {
  items: Array<{ id: string; summary: string; state: string }>
}) {
  return (
    <div className="ds-card">
      <h3>Approval Queue</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.summary} - <span className="ds-muted">{item.state}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
