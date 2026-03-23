/**
 * Parse example drill-down ids emitted in delta-digest `recommended_pivots` detail lines
 * (backend-owned strings; see `platform/app-api/services/delta_digest.py`).
 */

const POLICY_EXAMPLE_RE = /Example policy_id for drill-down:\s*([^\s.]+)/;
const TOPOLOGY_NODE_EXAMPLE_RE = /Example topology node_id for drill-down:\s*([^\s.]+)/;

export function extractExamplePolicyIdFromDigestNotes(notes: readonly string[]): string | null {
  for (const line of notes) {
    const m = line.match(POLICY_EXAMPLE_RE);
    if (m?.[1]) {
      return m[1];
    }
  }
  return null;
}

export function extractExampleTopologyNodeIdFromDigestNotes(notes: readonly string[]): string | null {
  for (const line of notes) {
    const m = line.match(TOPOLOGY_NODE_EXAMPLE_RE);
    if (m?.[1]) {
      return m[1];
    }
  }
  return null;
}
