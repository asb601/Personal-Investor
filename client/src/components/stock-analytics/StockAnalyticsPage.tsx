'use client';

import { TrendingUp, Plus } from 'lucide-react';

export default function StockAnalyticsPage() {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 sm:py-24">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center">
          Stock Analytics
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
          Monitor your portfolio, track market indices, and make research-driven
          investment decisions.
        </p>

        <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Add Holdings
        </button>
      </div>

      {/* Placeholder sections */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {['Portfolio Value', 'Watchlist', 'Market Indices'].map(
          (title) => (
            <div
              key={title}
              className="bg-card rounded-lg border border-dashed border-border p-6 flex flex-col items-center justify-center min-h-[140px]"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {title}
              </p>
              <p className="text-sm text-muted-foreground">No data yet</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
