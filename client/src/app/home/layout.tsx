'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/home-page/components/Sidebar';
import { SidebarProvider, useSidebar } from '@/components/home-page/components/SidebarContext';
import { Header } from '@/components/home-page/components/Header';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      {/* Main area — shifted right on desktop to account for sidebar */}
      <div
        className="transition-all duration-300 flex flex-col min-h-screen"
        style={{ paddingLeft: 'var(--sidebar-width)' }}
      >
        <style>{`
          :root { --sidebar-width: 0px; }
          @media (min-width: 640px) {
            :root { --sidebar-width: ${collapsed ? '72px' : '240px'}; }
          }
        `}</style>

        <Header />

        <main className="flex-1 pb-16 sm:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
