'use client'

import { useState } from 'react'

import { Cancel01Icon, Edit01Icon } from '@hugeicons/core-free-icons'

import { saveTeachingAction } from '../actions'
import { Icon, IconButton } from './ui'

type TeachSheetProps = {
  readonly agentId: string
  readonly agentName: string
  readonly conversationId: string
  readonly userInput: string
  readonly originalResponse: string
}

export function TeachSheet({
  agentId,
  agentName,
  conversationId,
  userInput,
  originalResponse,
}: TeachSheetProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="message-teach"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Icon icon={Edit01Icon} size={15} /> Teach
      </button>
      {open ? (
        <div
          aria-modal="true"
          className="sheet-backdrop"
          onMouseDown={() => setOpen(false)}
          role="dialog"
        >
          <section
            className="teach-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-heading">
              <div>
                <p className="kicker">Refine a response</p>
                <h2>Teach {agentName}</h2>
              </div>
              <IconButton
                label="Close teaching form"
                onClick={() => setOpen(false)}
              >
                <Icon icon={Cancel01Icon} />
              </IconButton>
            </div>
            <div className="said-card">
              <span>It said</span>
              <p>{originalResponse}</p>
            </div>
            <form action={saveTeachingAction} className="form-stack">
              <input type="hidden" name="agentId" value={agentId} />
              <input
                type="hidden"
                name="conversationId"
                value={conversationId}
              />
              <input type="hidden" name="userInput" value={userInput} />
              <input
                type="hidden"
                name="originalResponse"
                value={originalResponse}
              />
              <label className="field-label">
                What should it have said?
                <textarea
                  defaultValue={originalResponse}
                  name="correctedResponse"
                  required
                  rows={6}
                />
              </label>
              <label className="field-label">
                Why? <span>Optional</span>
                <textarea
                  name="explanation"
                  placeholder="Add context for similar situations."
                  rows={3}
                />
              </label>
              <div className="sheet-actions">
                <button
                  className="quiet-button"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Teach {agentName}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
