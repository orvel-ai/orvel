'use client'

import { useState } from 'react'

import { updateGeneralKnowledgeAction } from '../actions'

export function KnowledgeEditor({
  agentId,
  value,
}: {
  readonly agentId: string
  readonly value?: string | undefined
}) {
  const [knowledge, setKnowledge] = useState(value ?? '')
  return (
    <form
      action={updateGeneralKnowledgeAction}
      className="settings-card form-stack"
    >
      <input type="hidden" name="agentId" value={agentId} />
      <label className="field-label">
        General Knowledge <span>Optional · recommended</span>
        <textarea
          name="generalKnowledge"
          maxLength={10000}
          onChange={(event) => setKnowledge(event.target.value)}
          placeholder={
            'Delivery takes 5–7 business days.\nReturns are accepted within 14 days.\nWe deliver throughout Nigeria.'
          }
          rows={12}
          value={knowledge}
        />
      </label>
      <div className="form-footer">
        <span>{knowledge.length.toLocaleString()} / 10,000 characters</span>
        <button className="primary-button" type="submit">
          Save knowledge
        </button>
      </div>
    </form>
  )
}
