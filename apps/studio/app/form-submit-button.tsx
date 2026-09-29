'use client'

import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

type FormSubmitButtonProps = {
  readonly children: ReactNode
  readonly className?: string
  readonly disabled?: boolean
  readonly label: string
  readonly pendingLabel: string
  readonly pendingStyle?: 'text' | 'spinner'
  readonly title?: string
}

export function FormSubmitButton({
  children,
  className,
  disabled = false,
  label,
  pendingLabel,
  pendingStyle = 'text',
  title,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      aria-busy={pending || undefined}
      aria-label={pending ? pendingLabel : label}
      className={className}
      disabled={disabled || pending}
      title={pending ? pendingLabel : title}
      type="submit"
    >
      {pending && pendingStyle === 'spinner' ? (
        <span aria-hidden="true" className="button-spinner" />
      ) : pending ? (
        pendingLabel
      ) : (
        children
      )}
    </button>
  )
}
