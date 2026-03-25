import type { PoliciesListResponse } from "../api/contracts";

const POSTURE_RANK: Record<string, number> = {
  degraded: 0,
  unknown: 1,
  ok: 2,
};

/** Stable worst-first sort for cockpit navigation (matches priority navigation panel). */
export function worstDegradedPolicyFirst(items: PoliciesListResponse["items"]): PoliciesListResponse["items"] {
  return [...items].sort((a, b) => {
    const pa = POSTURE_RANK[a.degraded_policy_v1.posture] ?? 99;
    const pb = POSTURE_RANK[b.degraded_policy_v1.posture] ?? 99;
    if (pa !== pb) {
      return pa - pb;
    }
    return a.policy_id.localeCompare(b.policy_id);
  });
}

/**
 * Prefer the worst `degraded_policy_v1` row when inventory exists; otherwise first policy id from topology slice.
 */
export function pickStrongestPolicyId(
  policiesData: PoliciesListResponse | null,
  fallbackPolicyId: string | null,
): string | null {
  if (policiesData && policiesData.items.length > 0) {
    const sorted = worstDegradedPolicyFirst(policiesData.items);
    return sorted[0]?.policy_id ?? null;
  }
  return fallbackPolicyId;
}
