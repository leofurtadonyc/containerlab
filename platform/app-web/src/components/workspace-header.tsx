import type { ReactNode } from "react";

import { StatusPill } from "./status-pill";

interface WorkspaceHeaderProps {
  eyebrow?: string;
  title: string;
  summary: string;
  statusValue?: string | null;
  actions?: ReactNode;
}

export function WorkspaceHeader({
  eyebrow,
  title,
  summary,
  statusValue,
  actions,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-header__content">
        {eyebrow ? <p className="workspace-header__eyebrow">{eyebrow}</p> : null}
        <div className="workspace-header__title-row">
          <h2>{title}</h2>
          {statusValue ? <StatusPill value={statusValue} /> : null}
        </div>
        <p className="workspace-header__summary">{summary}</p>
      </div>
      {actions ? <div className="workspace-header__actions">{actions}</div> : null}
    </header>
  );
}
