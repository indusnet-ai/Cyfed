"use client";

import React, { useEffect } from 'react';
import { Sidebar } from '../../components/sidebar';
import { Header } from '../../components/header';
import { DemoControlPanel } from '../../components/demo-control-panel';
import { useAuth } from '@/context/useAuthContext';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/design-system/LoadingState';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090d16] text-white p-12">
        <div className="w-full max-w-md space-y-4 text-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Verifying Security Session Credentials...</span>
          <LoadingState rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-white font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Dashboard Metrics */}
        <Header />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0b0f19] relative">
          {children}
          {/* Floating Demo Console */}
          <DemoControlPanel />
        </main>
      </div>
    </div>
  );
}
