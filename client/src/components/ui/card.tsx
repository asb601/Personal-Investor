import React from 'react'

export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card rounded-lg p-4 border border-border ${className}`}>{children}</div>
}
