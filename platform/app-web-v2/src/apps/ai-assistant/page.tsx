import { FutureCapabilityCard, NonClaimBanner } from '../../design-system/components'

export function AIAssistantPage() {
  return (
    <section className="ai-assistant">
      <h1>AI Assistant</h1>
      <NonClaimBanner copy="Future capability: AI Assistant backend support is not implemented. AI recommendations must not be shown or acted on." />

      <article className="ds-card">
        <h3>Assistant panel</h3>
        <p className="ds-muted">AI assistant interaction is unavailable until backend support exists.</p>
        <textarea
          className="ds-control ai-assistant-input"
          aria-label="Ask assistant"
          placeholder="Ask assistant (future capability)"
          disabled
        />
      </article>

      <div className="ai-assistant-grid">
        <FutureCapabilityCard
          title="Active investigation assistant"
          reason="Future capability: AI Assistant backend support is not implemented. AI recommendations must not be shown or acted on."
          requiredBackend="ai-assistant-context-api"
        />
        <FutureCapabilityCard
          title="Recommendations"
          reason="Future capability: AI Assistant backend support is not implemented. AI recommendations must not be shown or acted on."
          requiredBackend="ai-assistant-recommendation-api"
        />
      </div>

      <article className="ds-card">
        <h3>Context sources</h3>
        <ul>
          <li className="ds-muted">Change safety records (future)</li>
          <li className="ds-muted">Command center incidents (future)</li>
          <li className="ds-muted">Service assurance summaries (future)</li>
        </ul>
      </article>

      <article className="ds-card">
        <h3>Actions</h3>
        <p className="ds-muted">All AI actions remain disabled in this batch.</p>
        <div className="ds-top-controls">
          <button type="button" className="ds-control" aria-label="Apply recommendation" disabled>
            Apply recommendation
          </button>
          <button type="button" className="ds-control" aria-label="Create change" disabled>
            Create change
          </button>
        </div>
      </article>
    </section>
  )
}
