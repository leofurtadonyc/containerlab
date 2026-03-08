export function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
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
      return "good";
    case "degraded":
    case "partial":
    case "partially_supported":
    case "planned":
    case "placeholder":
      return "warn";
    case "down":
    case "failed":
    case "unsupported":
    case "unreachable":
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
