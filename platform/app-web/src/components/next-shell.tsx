import { useEffect, useState, type ReactNode } from "react";

import { DsButton } from "../design-system";
import type { NextShellNavGroup, RouteContextChip } from "../lib/next-shell-navigation";

interface NextShellProps {
  title: string;
  navigationGroups: readonly NextShellNavGroup[];
  activeItemId: string;
  onSelect: (id: string) => void;
  currentGroupLabel: string;
  currentPageLabel: string;
  currentPageDescription: string;
  routeContextChips: RouteContextChip[];
  environmentSummary: string;
  onCopyLink: () => void | Promise<void>;
  copyState: "idle" | "copied" | "failed";
  onResetContext: () => void;
  commandSlot?: ReactNode;
  fallbackNote?: string | null;
  children: ReactNode;
}

export function NextShell({
  title,
  navigationGroups,
  activeItemId,
  onSelect,
  currentGroupLabel,
  currentPageLabel,
  currentPageDescription,
  routeContextChips,
  environmentSummary,
  onCopyLink,
  copyState,
  onResetContext,
  commandSlot,
  fallbackNote,
  children,
}: NextShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [activeItemId]);

  return (
    <div className="next-shell">
      <a className="skip-link" href="#app-main">
        Skip to main content
      </a>
      <div
        className={`next-shell__backdrop${navOpen ? " next-shell__backdrop--open" : ""}`}
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />
      <aside className={`next-shell__sidebar${navOpen ? " next-shell__sidebar--open" : ""}`}>
        <div className="next-shell__brand">
          <p className="next-shell__eyebrow">Next shell preview</p>
          <h1>{title}</h1>
          <p className="sidebar-copy">
            New information architecture over existing view components. Feature behavior remains unchanged.
          </p>
        </div>
        <nav id="next-primary-navigation" className="next-shell__nav" aria-label="Primary">
          {navigationGroups.map((group) => (
            <section key={group.id} className="next-shell__nav-group" aria-labelledby={`next-nav-group-${group.id}`}>
              <h2 id={`next-nav-group-${group.id}`} className="next-shell__nav-group-label">
                {group.label}
              </h2>
              <div className="next-shell__nav-list">
                {group.items.map((item) => {
                  const isActive = item.id === activeItemId;
                  return (
                    <DsButton
                      key={item.id}
                      type="button"
                      variant="navigation"
                      className={isActive ? "next-nav-button next-nav-button--active" : "next-nav-button"}
                      onClick={() => onSelect(item.id)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="next-nav-button__label">{item.label}</span>
                      <span className="next-nav-button__description">{item.description}</span>
                    </DsButton>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>
      <div className="next-shell__main-column">
        <header className="next-shell__topbar">
          <div className="next-shell__topbar-main">
            <div className="next-shell__context">
              <DsButton
                type="button"
                variant="secondary"
                className="next-shell__menu-toggle"
                onClick={() => setNavOpen((open) => !open)}
                aria-expanded={navOpen}
                aria-controls="next-primary-navigation"
              >
                Menu
              </DsButton>
              <div className="next-shell__context-copy">
                <nav aria-label="Breadcrumb" className="next-shell__breadcrumb">
                  <span>Home</span>
                  <span aria-hidden="true">/</span>
                  <span>{currentGroupLabel}</span>
                  <span aria-hidden="true">/</span>
                  <span>{currentPageLabel}</span>
                </nav>
                <h2 className="next-shell__route-title">{currentPageLabel}</h2>
                <p className="next-shell__route-description">{currentPageDescription}</p>
                {routeContextChips.length > 0 ? (
                  <div className="next-shell__chips" aria-label="Route context">
                    {routeContextChips.map((chip) => (
                      <span key={`${chip.label}:${chip.value}`} className="next-shell__chip">
                        {chip.label}: {chip.value}
                      </span>
                    ))}
                  </div>
                ) : null}
                {fallbackNote ? <p className="next-shell__fallback-note">{fallbackNote}</p> : null}
              </div>
            </div>
            <div className="next-shell__command-area">
              {commandSlot}
              <div className="next-shell__actions" role="group" aria-label="Page actions">
                <span className="app-badge">{environmentSummary}</span>
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
                >
                  Reset context
                </DsButton>
              </div>
            </div>
          </div>
        </header>
        <main id="app-main" className="next-shell__content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
