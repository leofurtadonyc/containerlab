import type { ReactNode } from "react";

import { DsButton } from "./button";

type QueryStateKind =
  | "loading"
  | "refreshing"
  | "empty"
  | "sparse"
  | "partial"
  | "unsupported"
  | "error";

interface QueryStateNoticeProps {
  kind: QueryStateKind;
  title: string;
  detail: string;
  retryLabel?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

function kindToTone(kind: QueryStateKind): "" | "ds-query-state--warn" | "ds-query-state--error" {
  if (kind === "error") {
    return "ds-query-state--error";
  }
  if (kind === "sparse" || kind === "partial" || kind === "unsupported") {
    return "ds-query-state--warn";
  }
  return "";
}

function kindToLiveRegion(kind: QueryStateKind): {
  role?: "status" | "alert";
  "aria-live"?: "polite" | "assertive";
} {
  if (kind === "error") {
    return { role: "alert", "aria-live": "assertive" };
  }
  if (kind === "loading" || kind === "refreshing") {
    return { role: "status", "aria-live": "polite" };
  }
  return {};
}

export function DsQueryStateNotice({
  kind,
  title,
  detail,
  retryLabel = "Retry",
  onRetry,
  children,
}: QueryStateNoticeProps) {
  const toneClass = kindToTone(kind);
  const liveRegion = kindToLiveRegion(kind);
  return (
    <article
      className={["ds-query-state", toneClass].join(" ").trim()}
      data-query-kind={kind}
      {...liveRegion}
    >
      <h3 className="ds-query-state__title">{title}</h3>
      <p className="ds-query-state__detail">{detail}</p>
      {children}
      {onRetry ? (
        <div className="ds-query-state__meta">
          <DsButton variant="secondary" onClick={onRetry}>
            {retryLabel}
          </DsButton>
        </div>
      ) : null}
    </article>
  );
}
