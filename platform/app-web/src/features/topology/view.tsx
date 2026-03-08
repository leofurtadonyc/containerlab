import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime } from "../../lib/presentation";
import { useTopologyQuery } from "./api";

export function TopologyView() {
  const { data, error, isLoading, reload } = useTopologyQuery();
  const [nodeSearchValue, setNodeSearchValue] = useState("");
  const [nodeStateFilter, setNodeStateFilter] = useState("all");
  const topology = data?.topology;
  const nodes = topology?.nodes ?? [];
  const links = topology?.links ?? [];
  const nodeCounts = countBy(nodes, (node) => node.state);
  const linkCounts = countBy(links, (link) => link.state);
  const filteredNodes = useMemo(() => {
    const normalizedSearch = nodeSearchValue.trim().toLowerCase();

    return nodes.filter((node) => {
      const matchesState = nodeStateFilter === "all" || node.state === nodeStateFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [node.display_name, node.node_id, node.role, node.device_id ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesState && matchesSearch;
    });
  }, [nodeSearchValue, nodeStateFilter, nodes]);

  if (isLoading) {
    return (
      <section>
        <h2>Topology</h2>
        <LoadingState label="Loading normalized topology state." />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Topology</h2>
        <ErrorState error={error} onRetry={reload} />
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2>Topology</h2>
        <EmptyState
          title="No topology data"
          description="The backend did not return a topology response."
        />
      </section>
    );
  }

  if (!topology) {
    return (
      <section>
        <h2>Topology</h2>
        <EmptyState
          title="No topology data"
          description="The backend did not return a topology response."
        />
      </section>
    );
  }

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Topology</h2>
          <p>
            Topology is shown through the backend-owned normalized read model rather
            than direct observability dashboards or raw protocol payloads.
          </p>
        </div>
        <StatusPill value={topology.completeness} />
      </div>

      <div className="metadata-row">
        <span>Sync source: {topology.sync_source}</span>
        <span>Observed: {formatDateTime(topology.observed_at)}</span>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Nodes</p>
          <strong>{topology.nodes.length}</strong>
          <p>{topology.topology_name}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Links</p>
          <strong>{topology.links.length}</strong>
          <p>{data.summary}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Sync status</p>
          <strong>
            <StatusPill value={topology.sync_status} />
          </strong>
          <p>Data status: {data.data_status}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Unknown node state</p>
          <strong>{nodeCounts.unknown ?? 0}</strong>
          <p>Nodes whose observed state remains explicitly unknown.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Unknown links</p>
          <strong>{linkCounts.unknown ?? 0}</strong>
          <p>Links that still depend on partial evidence in Phase 1.</p>
        </article>
      </div>

      {topology.notes.length > 0 ? (
        <div className="callout">
          <strong>Current limits</strong>
          <ul className="notes-list">
            {topology.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="toolbar">
        <label className="field-group">
          <span>Search nodes</span>
          <input
            value={nodeSearchValue}
            onChange={(event) => setNodeSearchValue(event.target.value)}
            placeholder="name, node id, role, or linked device"
          />
        </label>
        <label className="field-group">
          <span>Node state</span>
          <select
            value={nodeStateFilter}
            onChange={(event) => setNodeStateFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="degraded">Degraded</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
      </div>

      {topology.nodes.length === 0 ? (
        <EmptyState
          title="No topology nodes"
          description="The topology contract is present, but no node records are available."
        />
      ) : filteredNodes.length === 0 ? (
        <EmptyState
          title="No nodes match the current filter"
          description="Adjust the search text or state filter to widen the topology view."
        />
      ) : (
        <div className="table-card">
          <h3>Nodes</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>State</th>
                <th>Source</th>
                <th>Device ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node) => (
                <tr key={node.node_id}>
                  <td>
                    <strong>{node.display_name}</strong>
                    <div className="table-note">{node.node_id}</div>
                  </td>
                  <td>{node.role}</td>
                  <td>
                    <StatusPill value={node.state} />
                  </td>
                  <td>{node.source}</td>
                  <td>{node.device_id ?? "Not linked"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {topology.links.length > 0 ? (
        <div className="table-card">
          <h3>Links</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>Endpoints</th>
                <th>State</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {topology.links.map((link) => (
                <tr key={link.link_id}>
                  <td>{link.link_id}</td>
                  <td>
                    {link.source_node_id} → {link.target_node_id}
                  </td>
                  <td>
                    <StatusPill value={link.state} />
                  </td>
                  <td>{link.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
