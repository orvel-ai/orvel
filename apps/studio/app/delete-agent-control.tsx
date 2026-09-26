'use client'

import { deleteAgentAction } from './actions'

export function DeleteAgentControl({ agentId }: { readonly agentId: string }) {
  return (
    <form
      action={deleteAgentAction}
      className="delete-agent-control"
      onSubmit={(event) => {
        if (
          !window.confirm(
            'Delete this agent and all its conversations, knowledge, feedback, and evals? This cannot be undone.',
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input name="agentId" type="hidden" value={agentId} />
      <div>
        <strong>Delete agent</strong>
        <p>
          Permanently remove this agent and its conversations, knowledge,
          feedback, and evals from this workspace.
        </p>
      </div>
      <button className="button button-danger" type="submit">
        Delete agent
      </button>
    </form>
  )
}
