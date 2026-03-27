import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
}

export function AppShell({ children, title, onBack }: AppShellProps) {
  const online = useOnlineStatus();

  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-slate-400 active:text-white transition-colors p-1 -ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <h1 className="text-white font-bold text-lg tracking-tight">
              {title ?? 'Golf Trip Scorer'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-500">{online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
