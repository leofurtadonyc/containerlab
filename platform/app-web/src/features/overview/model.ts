import type { ApiClientError } from "../../api/client";
import type { QueryStateTone } from "../../components/query-states";

export interface OverviewSliceSnapshot {
  label: string;
  data: object | null;
  error: ApiClientError | null;
  isLoading: boolean;
  isRefreshing: boolean;
}

export interface OverviewSliceState {
  label: string;
  status: "ready" | "refreshing" | "stale_error" | "loading" | "error" | "waiting";
  hasData: boolean;
  stateLabel: string;
  tone: QueryStateTone;
  detail: string;
}

export interface OverviewRenderState {
  mode: "loading" | "error" | "partial" | "ready";
  slices: OverviewSliceState[];
  firstError: ApiClientError | null;
}

export function buildOverviewRenderState(
  slices: OverviewSliceSnapshot[],
  allRequiredDataReady: boolean,
): OverviewRenderState {
  const hasAnyData = slices.some((slice) => slice.data !== null);
  const firstError = slices.find((slice) => slice.error !== null)?.error ?? null;
  const hasLoadingWithoutData = slices.some((slice) => slice.isLoading && slice.data === null);
  const sliceStates = slices.map((slice) => {
    if (slice.data !== null && slice.error) {
      return {
        label: slice.label,
        status: "stale_error" as const,
        hasData: true,
        stateLabel: "Retry needed",
        tone: "warn" as const,
        detail: `Showing the last successful summary while the latest refresh failed: ${slice.error.message}`,
      };
    }
    if (slice.data !== null && slice.isRefreshing) {
      return {
        label: slice.label,
        status: "refreshing" as const,
        hasData: true,
        stateLabel: "Refreshing",
        tone: "info" as const,
        detail: "Showing the last successful summary while a fresh request is still loading.",
      };
    }
    if (slice.data !== null) {
      return {
        label: slice.label,
        status: "ready" as const,
        hasData: true,
        stateLabel: "Available",
        tone: "info" as const,
        detail: "Current summary data is available.",
      };
    }
    if (slice.error) {
      return {
        label: slice.label,
        status: "error" as const,
        hasData: false,
        stateLabel: "Unavailable",
        tone: "error" as const,
        detail: slice.error.message,
      };
    }
    if (slice.isLoading) {
      return {
        label: slice.label,
        status: "loading" as const,
        hasData: false,
        stateLabel: "Loading",
        tone: "info" as const,
        detail: "Still loading current summary data.",
      };
    }
    return {
      label: slice.label,
      status: "waiting" as const,
      hasData: false,
      stateLabel: "Unavailable",
      tone: "warn" as const,
      detail: "No summary data is currently available.",
    };
  });
  const hasNonReadySlices = sliceStates.some((slice) => slice.status !== "ready");

  if (!hasAnyData && hasLoadingWithoutData && !firstError) {
    return {
      mode: "loading",
      slices: sliceStates,
      firstError,
    };
  }

  if (!hasAnyData && firstError) {
    return {
      mode: "error",
      slices: sliceStates,
      firstError,
    };
  }

  return {
    mode: allRequiredDataReady && !hasNonReadySlices ? "ready" : "partial",
    slices: sliceStates,
    firstError,
  };
}