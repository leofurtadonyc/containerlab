import type { ApiClientError } from "../../api/client";

export interface OverviewSliceSnapshot {
  label: string;
  data: object | null;
  error: ApiClientError | null;
  isLoading: boolean;
}

export interface OverviewSliceState {
  label: string;
  status: "ready" | "loading" | "error" | "waiting";
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
    if (slice.data !== null) {
      return {
        label: slice.label,
        status: "ready" as const,
        detail: "Current summary data is available.",
      };
    }
    if (slice.error) {
      return {
        label: slice.label,
        status: "error" as const,
        detail: slice.error.message,
      };
    }
    if (slice.isLoading) {
      return {
        label: slice.label,
        status: "loading" as const,
        detail: "Still loading current summary data.",
      };
    }
    return {
      label: slice.label,
      status: "waiting" as const,
      detail: "No summary data is currently available.",
    };
  });

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
    mode: allRequiredDataReady ? "ready" : "partial",
    slices: sliceStates,
    firstError,
  };
}