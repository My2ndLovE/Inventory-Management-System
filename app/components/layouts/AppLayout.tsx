import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toaster } from '~/components/ui/toaster';

interface AppLayoutProps {
  children: React.ReactNode;
  organizationName?: string;
}

export function AppLayout({ children, organizationName }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        organizationName={organizationName}
      />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
