import type { ReactNode } from "react";

import type { ApiClientError } from "../api/client";
import { DsButton, DsQueryStateNotice } from "../design-system";

interface QueryMessageProps {
  title: string;
  children: ReactNode;
  tone?: "info" | "error";
  kind?: "loading" | "refreshing" | "empty" | "sparse" | "partial" | "unsupported" | "error";
}

function QueryMessage({
  title,
  children,
  tone = "info",
  kind = "empty",
}: QueryMessageProps) {
  return (
    <DsQueryStateNotice
      kind={tone === "error" ? "error" : kind}
      title={title}
      detail=""
    >
      <div className={`query-message ${tone === "error" ? "query-message-error" : ""}`}>{children}</div>
    </DsQueryStateNotice>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <QueryMessage title="Loading" kind="loading">
      {label}
    </QueryMessage>
  );
}

interface ErrorStateProps {
  error: ApiClientError;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <QueryMessage title="Unable to load data" tone="error">
      <p>{error.message}</p>
      <DsButton type="button" variant="secondary" className="inline-action" onClick={onRetry}>
        Retry
      </DsButton>
    </QueryMessage>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <QueryMessage title={title} kind="empty">
      {description}
    </QueryMessage>
  );
}

export type QueryStateTone = "info" | "warn" | "error";

interface QueryStateCardProps {
  title: string;
  stateLabel: string;
  detail: string;
  tone?: QueryStateTone;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
}

function resolveToneClassName(tone: QueryStateTone): string {
  switch (tone) {
    case "error":
      return "query-message-error";
    default:
      return "";
  }
}

export function QueryStateSummaryCard({
  title,
  stateLabel,
  detail,
  tone = "info",
  onRetry,
  retryLabel = "Retry",
}: QueryStateCardProps) {
  const kind: "loading" | "refreshing" | "empty" | "sparse" | "partial" | "unsupported" | "error" =
    tone === "error" ? "error" : tone === "warn" ? "partial" : "empty";
  return (
    <DsQueryStateNotice kind={kind} title={title} detail={detail}>
      <article className={`summary-card ${resolveToneClassName(tone)}`.trim()}>
        <p className="summary-label">{title}</p>
        <strong>{stateLabel}</strong>
        <p>{detail}</p>
        {onRetry ? (
          <DsButton type="button" variant="secondary" className="inline-action" onClick={onRetry}>
            {retryLabel}
          </DsButton>
        ) : null}
      </article>
    </DsQueryStateNotice>
  );
}

export function QueryStateDetailCard({
  title,
  stateLabel,
  detail,
  tone = "info",
  onRetry,
  retryLabel = "Retry",
  children,
}: QueryStateCardProps) {
  const kind: "loading" | "refreshing" | "empty" | "sparse" | "partial" | "unsupported" | "error" =
    tone === "error" ? "error" : tone === "warn" ? "sparse" : "empty";
  return (
    <DsQueryStateNotice kind={kind} title={title} detail={detail}>
      <article className={`detail-card ${resolveToneClassName(tone)}`.trim()}>
        <h3>{title}</h3>
        <p className="table-note">{stateLabel}</p>
        <p>{detail}</p>
        {children}
        {onRetry ? (
          <DsButton type="button" variant="secondary" className="inline-action" onClick={onRetry}>
            {retryLabel}
          </DsButton>
        ) : null}
      </article>
    </DsQueryStateNotice>
  );
}
