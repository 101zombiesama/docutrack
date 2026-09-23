import { ToastProvider } from '@/components/ui/Toast';
import { AppProvider } from '@/lib/store/AppProvider';
import { AppShell } from '@/components/app/AppShell';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppProvider>
        <AppShell>{children}</AppShell>
      </AppProvider>
    </ToastProvider>
  );
}
