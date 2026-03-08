import { formatLabel, getStatusTone } from "../lib/presentation";

interface StatusPillProps {
  value: string;
}

export function StatusPill({ value }: StatusPillProps) {
  return (
    <span className={`status-pill status-${getStatusTone(value)}`}>
      {formatLabel(value)}
    </span>
  );
}
