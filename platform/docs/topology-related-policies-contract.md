# Topology object → related policies (Phase 2, read-only)

## Endpoint

`GET /api/v1/topology/objects/{object_id}/related-policies`

## Purpose

Give operators a **bounded pivot** from a topology **node** (`node_id`) or **link** (`link_id`) to **policy inventory records** that reference the same normalized names or identifiers, using the same policy and topology snapshots that back `GET /api/v1/policies` and `GET /api/v1/topology`.

## Resolution rules

1. **Object identity** — `object_id` must match a `node_id` on the current normalized topology snapshot **or** a `link_id` on that snapshot. Otherwise the API returns **404** (unknown object), not an empty `items` list.

2. **Node case** — For each policy record, compare these policy fields (exact string equality, empty strings ignored):
   - `headend`
   - `endpoint`
   - `source_target`  
   to these identifiers on the selected **node**:
   - `node_id`
   - `display_name`
   - `device_id` (when present)

3. **Link case** — Evaluate the same policy↔node match independently for the **source** and **target** endpoint nodes of the link, then **union** the results. Co-presence on a link does **not** mean the policy “uses” that link in a dataplane or TE sense.

4. **Relationship typing** — Each hit is labeled `policy_field_matches_node_identifier` (direct node query) or `policy_field_matches_link_endpoint_identifier` (link query), describing *where* the match was evaluated, not a stronger graph semantic.

## Explicit non-claims

- Not operational dependency, failure impact, or forwarding path truth.
- Not validation that the policy is configured on a specific interface or protocol adjacency.
- Not completeness across devices outside the current policy inventory slice.
- Topology inference/pairing partiality axes on `GET /api/v1/topology` still apply; this endpoint does not reopen topology truth-depth work.

## Inverse endpoint (policy → topology)

`GET /api/v1/policies/{policy_id}/topology-impact` lists topology **nodes** and **links** (link rows appear when an endpoint node matches) that **string-align** with this policy’s `headend`, `endpoint`, and `source_target` using the **same** equality rules as above. It is an inverse pivot for operator context, **not** blast-radius or dependency simulation. **404** when `policy_id` is not in the current normalized policy inventory.

- Schema: `platform/app-api/src/app_api/schemas/policy_topology_impact.py`
- Assembly: `platform/app-api/src/app_api/services/policy_topology_impact.py`

## References

- Schema: `platform/app-api/src/app_api/schemas/topology_related_policies.py`
- Assembly: `platform/app-api/src/app_api/services/topology_related_policies.py`
