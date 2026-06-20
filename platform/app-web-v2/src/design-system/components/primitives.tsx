import type { PropsWithChildren, ReactNode } from 'react'

export type StatusTone = 'healthy' | 'warning' | 'critical' | 'unknown' | 'pending' | 'future' | 'readOnly'
export type Density = 'compact' | 'comfortable'

export interface NavItem {
  id: string
  label: string
  disabled?: boolean
  icon?: string
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
        <div className="ds-workspace" data-has-menu={verticalMenu ? 'true' : 'false'} data-has-drawer={contextDrawer ? 'true' : 'false'}>
          {verticalMenu ? verticalMenu : null}
          <main role="main" className="ds-content">
            {children}
          </main>
          {contextDrawer ? (
            <aside aria-label="Context" className="ds-drawer-host">
              {contextDrawer}
            </aside>
          ) : null}
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
      <div className="ds-top-bar-brand">
        <span className="ds-brand-mark" aria-hidden="true">
          N
        </span>
        <span className="ds-brand">NETOPS PLATFORM</span>
      </div>
      <div className="ds-top-bar-main">
        <button type="button" className="ds-control ds-control-selector" aria-label="Environment selector" disabled>
          <span className="ds-control-label">Environment</span>
          <span className="ds-control-value">
            <span className="ds-env-dot" aria-hidden="true">●</span>
            {environment}
          </span>
          <span className="ds-caret" aria-hidden="true">▾</span>
        </button>
        <button type="button" className="ds-control ds-control-selector" aria-label="Fabric selector" disabled>
          <span className="ds-control-label">Region / Fabric</span>
          <span className="ds-control-value">
            <span className="ds-fabric-globe" aria-hidden="true">◎</span>
            {fabric}
          </span>
          <span className="ds-caret" aria-hidden="true">▾</span>
        </button>
        {commandSlot}
      </div>
      <div className="ds-top-controls">
        <button type="button" className="ds-control ds-icon-control ds-notification-btn" aria-label="Notifications" disabled>
          <span aria-hidden="true">🔔</span>
          <span className="ds-notification-badge" aria-hidden="true">4</span>
        </button>
        <button type="button" className="ds-control" aria-label="Quick actions" disabled>
          ⚡ Quick Actions <span className="ds-caret" aria-hidden="true">▾</span>
        </button>
        <button type="button" className="ds-control ds-icon-control" aria-label="Help menu">
          ?
        </button>
        <button type="button" className="ds-control" aria-label="User menu" disabled>
          <span className="ds-user-avatar" aria-hidden="true">AD</span>
          <span className="ds-user-meta">
            <span className="ds-control-value">Alex Doe</span>
            <span className="ds-control-label">Network Operator</span>
          </span>
        </button>
      </div>
    </div>
  )
}

export function AppSidebar({
  items,
  activeId,
  onNavigate,
}: {
  items: NavItem[]
  activeId: string
  onNavigate?: (id: string) => void
}) {
  return (
    <nav className="ds-app-sidebar" aria-label="App sidebar">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-nav-item"
          aria-current={item.id === activeId ? 'page' : undefined}
          disabled={item.disabled}
          onClick={onNavigate && !item.disabled ? () => onNavigate(item.id) : undefined}
        >
          <span className="ds-nav-icon" aria-hidden="true">
            {item.icon ?? item.label.slice(0, 1)}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
      <button type="button" className="ds-sidebar-collapse" aria-label="Collapse sidebar">
        <span aria-hidden="true">‹</span>
        <span>Collapse</span>
      </button>
    </nav>
  )
}

export function AppTabs({
  items,
  activeId,
  onNavigate,
}: {
  items: NavItem[]
  activeId: string
  onNavigate?: (id: string) => void
}) {
  return (
    <nav className="ds-tabs" aria-label="App tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-tab"
          aria-current={item.id === activeId ? 'page' : undefined}
          disabled={item.disabled}
          onClick={onNavigate && !item.disabled ? () => onNavigate(item.id) : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export function VerticalMenu({
  items,
  activeId,
  header,
  footer,
  onNavigate,
}: {
  items: NavItem[]
  activeId: string
  header?: ReactNode
  footer?: ReactNode
  onNavigate?: (id: string) => void
}) {
  return (
    <nav className="ds-vertical-menu" aria-label="Section menu">
      {header ? <div className="ds-vertical-menu-header">{header}</div> : null}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ds-menu-item"
          aria-current={item.id === activeId ? 'page' : undefined}
          disabled={item.disabled}
          onClick={onNavigate && !item.disabled ? () => onNavigate(item.id) : undefined}
        >
          {item.label}
        </button>
      ))}
      {footer ? <div className="ds-vertical-menu-footer">{footer}</div> : null}
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
  headerAction,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string; headerAction?: ReactNode }>) {
  return (
    <section className="ds-drawer" role="complementary" aria-label={title}>
      <div className="ds-drawer-header">
        <div className="ds-drawer-header-text">
          <h3>{title}</h3>
          {subtitle ? <p className="ds-muted">{subtitle}</p> : null}
        </div>
        {headerAction ? <div className="ds-drawer-header-action">{headerAction}</div> : null}
      </div>
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
