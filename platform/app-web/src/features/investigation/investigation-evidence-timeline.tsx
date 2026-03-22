import type { InvestigationContextAssemblyResponse } from "../../api/contracts";
import { buildInvestigationTimelineBeats } from "../../lib/investigation-timeline";
import { formatDateTime } from "../../lib/presentation";

export function InvestigationEvidenceTimeline({ data }: { data: InvestigationContextAssemblyResponse }) {
  const beats = buildInvestigationTimelineBeats(data);

  return (
    <section className="investigation-evidence-timeline" aria-labelledby="inv-timeline-heading">
      <h3 id="inv-timeline-heading">Recency anchors (bounded, not a unified event log)</h3>
      <p className="table-note investigation-evidence-timeline__disclaimer">
        These timestamps come from <strong>separate nested responses</strong> and domain slices already in the assembly.
        They help orient how fresh each contract is—not causal ordering, forensic reconstruction, or workflow lifecycle
        chronology. Missing anchors stay explicit on the underlying pages.
      </p>
      {beats.length === 0 ? (
        <p className="table-note">No discrete timestamps were present in the nested payloads for this response.</p>
      ) : (
        <ol className="investigation-timeline-list">
          {beats.map((beat) => (
            <li key={beat.id} className="investigation-timeline-item">
              <div className="investigation-timeline-item__row">
                <time className="investigation-timeline-time" dateTime={beat.timestampIso}>
                  {formatDateTime(beat.timestampIso)}
                </time>
                <span className="investigation-timeline-label">{beat.label}</span>
                <span className="investigation-timeline-source" title="Origin of this timestamp">
                  {beat.sourceKind.replace(/_/g, " ")}
                </span>
              </div>
              {beat.detailNote ? <p className="table-note investigation-timeline-note">{beat.detailNote}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
