import type { ReactNode } from "react";

export function DsKeyValueGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="ds-kv-grid">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DsEvidenceList({ items }: { items: string[] }) {
  return (
    <ul className="ds-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export const DsTimelineList = DsEvidenceList;
export const DsDeltaList = DsEvidenceList;
export const DsCaveatList = DsEvidenceList;
