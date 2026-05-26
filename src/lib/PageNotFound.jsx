import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { usePageEntrance } from '@/hooks/usePageTransition';

export default function PageNotFound() {
  const scope = usePageEntrance();
  const location = useLocation();
  const { user } = useAuth();
  const pageName = location.pathname.substring(1);

  return (
    <div ref={scope} className="flex min-h-screen items-center justify-center bg-[var(--app-page-gradient)] p-6">
      <div className="animate-child w-full max-w-md rounded-3xl border border-border/50 app-card-surface p-6 text-center sm:p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-muted-foreground/70">404</h1>
            <div className="mx-auto h-0.5 w-16 rounded-full bg-border/70" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-foreground">Page Not Found</h2>
            <p className="leading-relaxed text-muted-foreground">
              The page <span className="font-medium text-foreground">&quot;{pageName}&quot;</span> could not be found.
            </p>
          </div>

          {user?.app_metadata?.role === 'admin' && (
            <div className="mt-8 rounded-2xl border border-border/50 app-card-surface-soft p-4">
              <p className="text-sm text-muted-foreground">Admin note: this route is not registered in the app.</p>
            </div>
          )}

          <div className="pt-6">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="inline-flex items-center rounded-xl border border-border/60 app-card-surface-soft px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-card/40 focus:outline-none focus:ring-2 focus:ring-primary/35"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
