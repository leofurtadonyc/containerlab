interface IdentifierChipProps {
  value: string | null | undefined;
  emptyLabel?: string;
}

export function IdentifierChip({
  value,
  emptyLabel = "Not exposed",
}: IdentifierChipProps) {
  const isPresent = Boolean(value);

  return (
    <span
      className={isPresent ? "identifier-chip identifier-chip-present" : "identifier-chip"}
      title={value ?? emptyLabel}
    >
      {value ?? emptyLabel}
    </span>
  );
}