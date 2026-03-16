import type { ReactNode } from "react";

import type { ApiClientError } from "../api/client";

interface QueryMessageProps {
  title: string;
  children: ReactNode;
  tone?: "info" | "error";
}

function QueryMessage({
  title,
  children,
  tone = "info",
}: QueryMessageProps) {
  return (
    <div className={`query-message ${tone === "error" ? "query-message-error" : ""}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return <QueryMessage title="Loading">{label}</QueryMessage>;
}

interface ErrorStateProps {
  error: ApiClientError;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <QueryMessage title="Unable to load data" tone="error">
      <p>{error.message}</p>
      <button type="button" className="inline-action" onClick={onRetry}>
        Retry
      </button>
    </QueryMessage>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <QueryMessage title={title}>{description}</QueryMessage>;
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
  return (
    <article className={`summary-card ${resolveToneClassName(tone)}`.trim()}>
      <p className="summary-label">{title}</p>
      <strong>{stateLabel}</strong>
      <p>{detail}</p>
      {onRetry ? (
        <button type="button" className="inline-action" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </article>
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
  return (
    <article className={`detail-card ${resolveToneClassName(tone)}`.trim()}>
      <h3>{title}</h3>
      <p className="table-note">{stateLabel}</p>
      <p>{detail}</p>
      {children}
      {onRetry ? (
        <button type="button" className="inline-action" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </article>
  );
}
