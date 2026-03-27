import type { EvidenceQualityDimension } from "../../api/contracts";

/** Short UI cue for row dimension (fallback, sparse, etc.). */
export function evidenceQualityCueLabel(d: EvidenceQualityDimension): string {
  switch (d) {
    case "fallback_conditions":
      return "Fallback";
    case "sparse_history_anchors":
      return "Sparse history";
    case "comparison_limits":
      return "Comparison limits";
    case "unsupported_partial_detail":
      return "Unsupported / partial";
    case "collection_assurance":
      return "Collection";
    case "read_path_fragility":
      return "Fragility";
    case "cross_domain_scope_note":
      return "Scope";
    default:
      return d;
  }
}

export function dimensionLabel(d: EvidenceQualityDimension): string {
  switch (d) {
    case "collection_assurance":
      return "Collection assurance";
    case "read_path_fragility":
      return "Read-path fragility";
    case "fallback_conditions":
      return "Fallback conditions";
    case "sparse_history_anchors":
      return "Sparse history / anchors";
    case "comparison_limits":
      return "Comparison limits";
    case "unsupported_partial_detail":
      return "Unsupported / partial detail";
    case "cross_domain_scope_note":
      return "Scope / coverage note";
    default:
      return d;
  }
}
