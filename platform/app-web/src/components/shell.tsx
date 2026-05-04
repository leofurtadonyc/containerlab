import { useEffect, useState, type ReactNode } from "react";

import { DsButton } from "../design-system";

interface NavigationItem {
  id: string;
  label: string;
  description: string;
}

interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

interface AppShellProps {
  title: string;
  navigationGroups: NavigationGroup[];
  activeItemId: string;
  onSelect: (id: string) => void;
  currentGroupLabel: string;
  currentPageLabel: string;
  currentPageDescription: string;
  environmentSummary: string;
  routeContextCount: number;
  onCopyLink: () => void | Promise<void>;
  copyState: "idle" | "copied" | "failed";
  onResetContext: () => void;
  commandSlot?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  title,
  navigationGroups,
  activeItemId,
  onSelect,
  currentGroupLabel,
  currentPageLabel,
  currentPageDescription,
  environmentSummary,
  routeContextCount,
  onCopyLink,
  copyState,
  onResetContext,
  commandSlot,
  children,
}: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [activeItemId]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-main">
        Skip to main content
      </a>
      <div
        className={`app-shell__backdrop${navOpen ? " app-shell__backdrop--open" : ""}`}
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />
      <aside className={`app-shell__sidebar${navOpen ? " app-shell__sidebar--open" : ""}`}>
        <div className="app-shell__brand">
          <p className="app-shell__eyebrow">Operator reasoning environment</p>
          <h1>{title}</h1>
          <p className="sidebar-copy">
            Backend-owned network truth, evidence, and change-safety workflows. Grafana remains the observability layer.
          </p>
        </div>
        <nav id="primary-navigation" className="app-shell__nav" aria-label="Primary">
          {navigationGroups.map((group) => (
            <section key={group.id} className="app-shell__nav-group" aria-labelledby={`nav-group-${group.id}`}>
              <h2 id={`nav-group-${group.id}`} className="app-shell__nav-group-label">
                {group.label}
              </h2>
              <div className="app-shell__nav-list">
                {group.items.map((item) => {
                  const isActive = item.id === activeItemId;
                  return (
                    <DsButton
                      key={item.id}
                      type="button"
                      variant="navigation"
                      className={isActive ? "app-nav-button app-nav-button--active" : "app-nav-button"}
                      onClick={() => onSelect(item.id)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="app-nav-button__label">{item.label}</span>
                      <span className="app-nav-button__description">{item.description}</span>
                    </DsButton>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>
      <div className="app-shell__main-column">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-main">
            <div className="app-shell__route-context">
              <DsButton
                type="button"
                variant="secondary"
                className="app-shell__menu-toggle"
                onClick={() => setNavOpen((open) => !open)}
                aria-expanded={navOpen}
                aria-controls="primary-navigation"
              >
                Menu
              </DsButton>
              <div>
                <p className="app-shell__eyebrow">{currentGroupLabel}</p>
                <h2 className="app-shell__route-title">{currentPageLabel}</h2>
                <p className="app-shell__route-description">{currentPageDescription}</p>
              </div>
            </div>
            <div className="app-shell__command-area">
              {commandSlot}
              <div className="app-shell__actions" role="group" aria-label="Page actions">
                <span className="app-badge">{environmentSummary}</span>
                <span className="app-badge">
                  {routeContextCount > 0
                    ? `${routeContextCount} context parameter${routeContextCount === 1 ? "" : "s"}`
                    : "No extra context"}
                </span>
                <DsButton
                  type="button"
                  variant="navigation"
                  className="shell-action-button"
                  onClick={() => void onCopyLink()}
                >
                  {copyState === "copied" ? "Link copied" : copyState === "failed" ? "Copy failed" : "Copy link"}
                </DsButton>
                <DsButton
                  type="button"
                  variant="secondary"
                  className="shell-action-button shell-action-button--secondary"
                  onClick={onResetContext}
                  disabled={routeContextCount === 0}
                >
                  Reset context
                </DsButton>
              </div>
            </div>
          </div>
        </header>
        <main id="app-main" className="app-shell__content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
