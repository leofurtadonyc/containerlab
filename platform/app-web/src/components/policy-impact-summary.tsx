import type { RelatedPolicyRelationshipKind } from "../api/contracts";
import { formatLabel } from "../lib/presentation";
/** Human-readable relationship strength (bounded: naming alignment, not blast radius). */
export function policyRelationshipStrengthLabel(kind: RelatedPolicyRelationshipKind): string {
  if (kind === "policy_field_matches_node_identifier") {
    return "Direct identifier match (node)";
  }
  return "Endpoint identifier match (link — adjacency not verified)";
}

export interface PolicyImpactSummaryFields {
  relationship_kind: RelatedPolicyRelationshipKind;
  matched_field: string;
  matched_policy_value: string;
  matched_topology_identifier: string;
  anchor_topology_node_id: string;
  evidence_source: string;
  caveats: string[];
}

export interface PolicyImpactSummaryBlockProps {
  fields: PolicyImpactSummaryFields;
  /** Optional leading context (e.g. policy name on topology page). */
  heading?: string;
}

/**
 * Bounded read-only relationship context: same vocabulary as backend topology-related-policies /
 * policy-topology-impact contracts — exact string equality on normalized fields, not operational impact.
 */
export function PolicyImpactSummaryBlock({ fields, heading }: PolicyImpactSummaryBlockProps) {
  return (
    <div className="policy-impact-summary">
      {heading ? (
        <p className="summary-label">{heading}</p>
      ) : null}
      <div className="key-value-list">
        <div className="key-value-row">
          <span>Relationship strength</span>
          <strong>{policyRelationshipStrengthLabel(fields.relationship_kind)}</strong>
        </div>
        <div className="key-value-row">
          <span>Mechanism</span>
          <strong>{formatLabel(fields.relationship_kind)}</strong>
        </div>
        <div className="key-value-row">
          <span>Matched policy field</span>
          <strong>{fields.matched_field}</strong>
        </div>
        <div className="key-value-row">
          <span>Policy value</span>
          <strong>{fields.matched_policy_value}</strong>
        </div>
        <div className="key-value-row">
          <span>Topology identifier</span>
          <strong>{fields.matched_topology_identifier}</strong>
        </div>
        <div className="key-value-row">
          <span>Anchor node</span>
          <strong>{fields.anchor_topology_node_id}</strong>
        </div>
        <div className="key-value-row">
          <span>Evidence source</span>
          <span className="table-note">{fields.evidence_source}</span>
        </div>
      </div>
      {fields.caveats.length > 0 ? (
        <ul className="notes-list">
          {fields.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PolicyImpactSummaryIntro() {
  return (
    <p className="footnote">
      <strong>Read-only naming alignment.</strong> Rows below use the same bounded rules as the backend
      topology↔policy pivot: exact string equality between policy headend, endpoint, and source_target and
      topology node identifiers — <em>not</em> dataplane dependency, blast radius, or TE resolution.
    </p>
  );
}
