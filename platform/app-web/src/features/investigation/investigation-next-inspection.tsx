import type { InvestigationContextAssemblyResponse } from "../../api/contracts";
import { navigateForInvestigationContextDomain } from "../../lib/investigation-context-domain-nav";

export interface InvestigationNextInspectionProps {
  data: InvestigationContextAssemblyResponse;
}

export function InvestigationNextInspection({ data }: InvestigationNextInspectionProps) {
  const { next_inspection_framing, next_inspection_suggestions } = data;

  return (
    <section className="investigation-next-inspection" aria-labelledby="inv-next-heading">
      <h3 id="inv-next-heading">Where to inspect next (optional)</h3>
      <p className="table-note investigation-next-inspection__framing">{next_inspection_framing}</p>
      <ol className="investigation-next-inspection__list">
        {next_inspection_suggestions.map((s) => (
          <li key={s.suggestion_id} className="investigation-next-inspection__item">
            <div className="investigation-next-inspection__row">
              <div>
                <p className="investigation-next-inspection__headline">{s.headline}</p>
                <p className="investigation-next-inspection__rationale">{s.rationale}</p>
                <p className="investigation-next-inspection__meta">
                  <code>{s.context_domain}</code> · <code>{s.framing_rule}</code> ·{" "}
                  <code>{s.suggestion_id}</code>
                </p>
              </div>
              <button
                type="button"
                className="nav-drilldown-button"
                onClick={() => navigateForInvestigationContextDomain(s.context_domain)}
              >
                Open related surface
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
