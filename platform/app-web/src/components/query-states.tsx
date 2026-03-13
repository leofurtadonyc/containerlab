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
