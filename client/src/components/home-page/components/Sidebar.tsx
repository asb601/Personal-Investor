'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

const NAV_ITEMS = [
  {
    label: 'Expenses',
    href: '/home',
    icon: Wallet,
    description: 'Track spending & income',
  },
  {
    label: 'Card Analytics',
    href: '/home/card-analytics',
    icon: CreditCard,
    description: 'Credit & debit insights',
  },
  {
    label: 'Analytics',
    href: '/home/analytics',
    icon: BarChart3,
    description: 'Spending insights & trends',
  },
  {
    label: 'Stock Analytics',
    href: '/home/stock-analytics',
    icon: TrendingUp,
    description: 'Portfolio & market data',
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ===== Desktop Sidebar ===== */}
      <aside
        className={cn(
          'hidden sm:flex flex-col fixed left-0 top-0 h-screen z-30',
          'bg-card border-r border-border transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {/* Logo area + collapse toggle */}
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-5 border-b border-border',
            collapsed ? 'justify-center px-0 flex-col gap-2' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-md shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold truncate">FinOS</span>
            )}
          </div>
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                  'hover:bg-accent/60',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    active && 'text-primary'
                  )}
                />
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* ===== Mobile Bottom Tab Bar ===== */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border safe-area-bottom">
        <div className="grid grid-cols-4 h-14">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 transition-colors relative',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
                )}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
