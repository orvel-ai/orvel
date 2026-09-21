import type { ComponentProps, ReactNode } from 'react'

import { HugeiconsIcon } from '@hugeicons/react'

type IconSvgObject = ComponentProps<typeof HugeiconsIcon>['icon']

export function Icon({
  icon,
  size = 18,
  ...props
}: {
  readonly icon: IconSvgObject
  readonly size?: number
} & Omit<ComponentProps<typeof HugeiconsIcon>, 'icon' | 'size'>) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} {...props} />
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: { readonly label: string; readonly children: ReactNode } & Omit<
  ComponentProps<'button'>,
  'children'
>) {
  return (
    <button
      aria-label={label}
      className={`icon-button ${className}`}
      title={label}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function Avatar({
  name,
  compact = false,
}: {
  readonly name: string
  readonly compact?: boolean
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span aria-hidden="true" className={`avatar ${compact ? 'compact' : ''}`}>
      {initials}
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  readonly children: ReactNode
  readonly tone?: 'neutral' | 'active'
}) {
  return <span className={`badge ${tone}`}>{children}</span>
}
