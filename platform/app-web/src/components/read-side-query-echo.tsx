import type { ReadSideQueryEcho } from "../api/contracts";

interface ReadSideQueryEchoCalloutProps {
  echo: ReadSideQueryEcho;
  /** Devices vs policies use the same echo shape; label only affects wording for the primary list. */
  slice: "devices" | "policies";
}

export function ReadSideQueryEchoCallout({ echo, slice }: ReadSideQueryEchoCalloutProps) {
  const primaryNoun = slice === "devices" ? "device inventory" : "policy inventory";
  const primaryParagraph =
    echo.items_returned < echo.items_total
      ? `Primary ${primaryNoun} list shows ${echo.items_returned} of ${echo.items_total} rows (optional limit). Total count remains honest for the full logical list before truncation.`
      : `Primary ${primaryNoun} list includes all ${echo.items_total} row(s) from the logical view (no tighter optional limit applied).`;

  const historyParagraphs: string[] = [];
  if (
    echo.history_recent_limit_effective != null &&
    echo.history_recent_snapshots_returned != null
  ) {
    const requested =
      echo.history_recent_limit_requested != null
        ? `requested ${echo.history_recent_limit_requested}`
        : "default window";
    historyParagraphs.push(
      `Persisted snapshot summaries: ${echo.history_recent_snapshots_returned} row(s) under effective history_recent_limit ${echo.history_recent_limit_effective} (${requested}).`,
    );
    if (echo.history_recent_snapshots_returned < echo.history_recent_limit_effective) {
      historyParagraphs.push(
        "Fewer snapshot rows than the cap usually means Postgres does not hold more persisted snapshot summaries in this window—bounded honest absence, not a missing filter.",
      );
    }
  }

  return (
    <div className="callout read-side-query-echo">
      <strong>Bounded query readout (from API)</strong>
      <p>{primaryParagraph}</p>
      {historyParagraphs.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
