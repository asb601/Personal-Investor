"use client"

import React from 'react'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
}

export default function CTAButton({ children, onClick, variant = 'solid', size = 'lg', className = '', type = 'button' }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium'
  const sizeClass = size === 'lg' ? 'h-12 px-5 text-base' : 'h-10 px-4 text-sm'
  const variantClass = variant === 'ghost'
    ? 'bg-transparent'
    : variant === 'outline'
      ? 'bg-card border border-border'
      : 'bg-primary text-primary-foreground'

  return (
    <button type={type} onClick={onClick} className={`${base} ${sizeClass} ${variantClass} ${className}`}>
      {children}
    </button>
  )
}
