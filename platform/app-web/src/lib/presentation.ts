export function formatLabel(value: string): string {
  return value.split("_").join(" ");
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function getStatusTone(value: string): "good" | "warn" | "bad" | "neutral" {
  switch (value) {
    case "ok":
    case "up":
    case "supported":
    case "implemented":
    case "active":
    case "healthy":
    case "current":
    case "live_observed":
    case "direct_observed":
    case "strong_for_current_slice":
      return "good";
    case "degraded":
    case "partial":
    case "partially_supported":
    case "planned":
    case "placeholder":
    case "stale":
    case "persisted_fallback":
    case "observed_plus_inferred":
    case "aggregate_only":
    case "aggregate_plus_bounded_records":
    case "bounded_partial":
      return "warn";
    case "down":
    case "failed":
    case "unsupported":
    case "unreachable":
    case "blocked":
    case "collector_unavailable":
    case "collector_unavailable_and_no_persisted_snapshot":
      return "bad";
    default:
      return "neutral";
  }
}

export function countBy<T>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
