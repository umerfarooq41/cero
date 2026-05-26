import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { usePageEntrance } from '@/hooks/usePageTransition';

export default function PageNotFound() {
  const scope = usePageEntrance();
  const location = useLocation();
  const { user } = useAuth();
  const pageName = location.pathname.substring(1);

  return (
    <div ref={scope} className="min-h-screen flex items-center justify-center p-6 app-card-surface-soft">
      <div className="animate-child max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">404</h1>
            <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">Page Not Found</h2>
            <p className="text-slate-600 leading-relaxed">
              The page <span className="font-medium text-slate-700">"{pageName}"</span> could not be found.
            </p>
          </div>

          {user?.app_metadata?.role === 'admin' && (
            <div className="mt-8 p-4 app-card-surface-soft rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">Admin note: this route is not registered in the app.</p>
            </div>
          )}

          <div className="pt-6">
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 app-card-surface-soft rounded-lg hover:brightness-105 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
