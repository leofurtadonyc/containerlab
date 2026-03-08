import type { ReactNode } from "react";

interface NavigationItem {
  id: string;
  label: string;
}

interface AppShellProps {
  title: string;
  navigationItems: NavigationItem[];
  activeItemId: string;
  onSelect: (id: string) => void;
  children: ReactNode;
}

export function AppShell({
  title,
  navigationItems,
  activeItemId,
  onSelect,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>{title}</h1>
        <p className="sidebar-copy">
          Operator-facing product UI scaffold. Observability remains in Grafana.
        </p>
        <nav className="nav-list" aria-label="Primary">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeItemId ? "nav-item active" : "nav-item"}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
