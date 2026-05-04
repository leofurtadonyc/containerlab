import type { ReactNode } from "react";

export function DsPage({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={["ds-page", className ?? ""].join(" ").trim()}>{children}</section>;
}

export function DsObjectPage({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={["ds-object-page", className ?? ""].join(" ").trim()}>{children}</section>;
}

export function DsSplitDetail({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={["ds-split-detail", className ?? ""].join(" ").trim()}>{children}</section>;
}

export function DsTabbedPage({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={["ds-tabbed-page", className ?? ""].join(" ").trim()}>{children}</section>;
}

interface DsTabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
}

export function DsTabs({ tabs, activeId, onSelect, ariaLabel }: DsTabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="ds-tabs">
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            className="ds-tab"
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
