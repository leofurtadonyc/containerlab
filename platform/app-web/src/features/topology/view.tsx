import { useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "../../components/query-states";
import { StatusPill } from "../../components/status-pill";
import { countBy, formatDateTime } from "../../lib/presentation";
import { useTopologyQuery } from "./api";

export function TopologyView() {
  const { data, error, isLoading, reload } = useTopologyQuery();
  const [nodeSearchValue, setNodeSearchValue] = useState("");
  const [nodeStateFilter, setNodeStateFilter] = useState("all");
  const [linkSearchValue, setLinkSearchValue] = useState("");
  const [linkStateFilter, setLinkStateFilter] = useState("all");
  const topology = data?.topology;
  const nodes = topology?.nodes ?? [];
  const links = topology?.links ?? [];
  const nodeCounts = countBy(nodes, (node) => node.state);
  const linkCounts = countBy(links, (link) => link.state);
  const roleCounts = useMemo(() => countBy(nodes, (node) => node.role), [nodes]);
  const sortedRoleCounts = useMemo(
    () => Object.entries(roleCounts).sort((left, right) => right[1] - left[1]),
    [roleCounts],
  );
  const singleSidedLinkCount = useMemo(
    () => links.filter((link) => link.attributes.endpoint_evidence_count === "1").length,
    [links],
  );
  const observedLoopbackCount = useMemo(
    () =>
      nodes.filter(
        (node) =>
          node.attributes.loopback_ipv4 !== undefined &&
          node.attributes.loopback_ipv4 !== "unknown",
      ).length,
    [nodes],
  );
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
  const filteredLinks = useMemo(() => {
    const normalizedSearch = linkSearchValue.trim().toLowerCase();

    return links.filter((link) => {
      const matchesState = linkStateFilter === "all" || link.state === linkStateFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          link.link_id,
          link.source_node_id,
          link.target_node_id,
          link.attributes.inference_method ?? "",
          link.attributes.observed_interfaces ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesState && matchesSearch;
    });
  }, [linkSearchValue, linkStateFilter, links]);

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
        <span>Data status: {data.data_status}</span>
        <span>Sync source: {topology.sync_source}</span>
        <span>Sync status: {topology.sync_status}</span>
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
          <p className="summary-label">Degraded Links</p>
          <strong>{linkCounts.degraded ?? 0}</strong>
          <p>Links whose evidence or state is degraded remain explicit.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Single-Sided Evidence</p>
          <strong>{singleSidedLinkCount}</strong>
          <p>Links inferred from only one observed endpoint stay explicitly partial.</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Observed Loopbacks</p>
          <strong>{observedLoopbackCount}</strong>
          <p>Nodes with a live loopback carried into the normalized topology view.</p>
        </article>
      </div>

      <div className="content-grid">
        <article className="detail-card">
          <h3>Operational Readout</h3>
          <p>{data.summary}</p>
          <ul className="compact-list">
            <li>
              <span>Backend topology status</span>
              <StatusPill value={data.data_status} />
            </li>
            <li>
              <span>Topology sync status</span>
              <StatusPill value={topology.sync_status} />
            </li>
            <li>
              <span>Explicit completeness</span>
              <StatusPill value={topology.completeness} />
            </li>
          </ul>
        </article>
        <article className="detail-card">
          <h3>Node Role Distribution</h3>
          {sortedRoleCounts.length === 0 ? (
            <p>No node roles are available in the current topology snapshot.</p>
          ) : (
            <ul className="compact-list">
              {sortedRoleCounts.map(([role, count]) => (
                <li key={role}>
                  <span>{role}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="detail-card">
          <h3>State Distribution</h3>
          <ul className="compact-list">
            <li>
              <span>Nodes up</span>
              <strong>{nodeCounts.up ?? 0}</strong>
            </li>
            <li>
              <span>Nodes degraded</span>
              <strong>{nodeCounts.degraded ?? 0}</strong>
            </li>
            <li>
              <span>Links up</span>
              <strong>{linkCounts.up ?? 0}</strong>
            </li>
            <li>
              <span>Links degraded</span>
              <strong>{linkCounts.degraded ?? 0}</strong>
            </li>
          </ul>
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
                <th>Loopback</th>
                <th>Management</th>
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
                  <td>{node.attributes.loopback_ipv4 ?? "Unknown"}</td>
                  <td>{node.attributes.management_address ?? "Unknown"}</td>
                  <td>{node.source}</td>
                  <td>{node.device_id ?? "Not linked"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="toolbar">
        <label className="field-group">
          <span>Search links</span>
          <input
            value={linkSearchValue}
            onChange={(event) => setLinkSearchValue(event.target.value)}
            placeholder="link id, endpoint, or evidence"
          />
        </label>
        <label className="field-group">
          <span>Link state</span>
          <select
            value={linkStateFilter}
            onChange={(event) => setLinkStateFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="degraded">Degraded</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
      </div>

      {topology.links.length === 0 ? (
        <EmptyState
          title="No topology links"
          description="The topology snapshot is present, but no link records are available yet."
        />
      ) : filteredLinks.length === 0 ? (
        <EmptyState
          title="No links match the current filter"
          description="Adjust the link search text or state filter to widen the topology view."
        />
      ) : (
        <div className="table-card">
          <h3>Links</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>Endpoints</th>
                <th>State</th>
                <th>Knowledge</th>
                <th>Evidence</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link) => (
                <tr key={link.link_id}>
                  <td>
                    <strong>{link.link_id}</strong>
                    <div className="table-note">
                      {link.attributes.inference_method ?? "No inference method recorded"}
                    </div>
                  </td>
                  <td>
                    {link.source_node_id} → {link.target_node_id}
                  </td>
                  <td>
                    <StatusPill value={link.state} />
                  </td>
                  <td>{link.attributes.knowledge_state ?? "Unknown"}</td>
                  <td>
                    <strong>
                      {link.attributes.endpoint_evidence_count ?? "0"} endpoint
                      {link.attributes.endpoint_evidence_count === "1" ? "" : "s"}
                    </strong>
                    <div className="table-note">
                      {link.attributes.observed_interfaces ?? "No observed interfaces recorded"}
                    </div>
                  </td>
                  <td>{link.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
