import { IdentifierChip } from "./identifier-chip";
import { StatusPill } from "./status-pill";

type TrustCueRow =
  | {
      label: string;
      kind: "status";
      value: string;
      note?: string | string[];
    }
  | {
      label: string;
      kind: "anchor";
      value: string | null | undefined;
      emptyLabel?: string;
      note?: string | string[];
    }
  | {
      label: string;
      kind: "text";
      value: string;
      note?: string | string[];
    };

interface TrustCueCardProps {
  title: string;
  summary: string;
  rows: TrustCueRow[];
}

function renderValue(row: TrustCueRow) {
  switch (row.kind) {
    case "status":
      return <StatusPill value={row.value} />;
    case "anchor":
      return <IdentifierChip value={row.value} emptyLabel={row.emptyLabel} />;
    default:
      return <strong>{row.value}</strong>;
  }
}

function renderNote(note: string | string[]) {
  if (Array.isArray(note)) {
    return (
      <ul className="notes-list">
        {note.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    );
  }

  return <p className="table-note">{note}</p>;
}

export function TrustCueCard({ title, summary, rows }: TrustCueCardProps) {
  return (
    <article className="detail-card">
      <h3>{title}</h3>
      <p>{summary}</p>
      <div className="key-value-list">
        {rows.map((row) => (
          <div className="key-value-row" key={`${title}-${row.label}`}>
            <span>{row.label}</span>
            <div>
              {renderValue(row)}
              {row.note ? renderNote(row.note) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}