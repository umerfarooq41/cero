import { lazy, Suspense, useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';

import PageNotFound from './lib/PageNotFound';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Logo from '@/components/Logo';
import Onboarding from '@/pages/Onboarding';
import Auth from '@/pages/Auth';

// Keep primary navigation pages eager so the bottom/side nav feels instant.
import Dashboard from '@/pages/Dashboard';
import Plan from '@/pages/Plan';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import ManagePlan from '@/pages/ManagePlan';

import { useUserSettings } from '@/hooks/useBudgetData';
import AutoSweepPrompt from '@/components/AutoSweepPrompt';

// Lazy-load secondary pages that are opened less often.
const AddTransaction = lazy(() => import('@/pages/AddTransaction'));
const AccountDetail = lazy(() => import('@/pages/AccountDetail'));
const AddAccount = lazy(() => import('@/pages/AddAccount'));
const Settings = lazy(() => import('@/pages/Settings'));

const LoadingScreen = () => (
  <div className="app-page-surface fixed inset-0 flex items-center justify-center p-6">
    <div className="flex flex-col items-center text-center">
      <Logo size={64} priority />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Cero</h1>
      <p className="mt-1 text-sm font-medium text-muted-foreground">Zero-Based Budgeting</p>
      <div className="mt-6 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>
  </div>
);

const RouteLoadingState = () => (
  <div className="flex min-h-[50vh] items-center justify-center p-6">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
  </div>
);

const LazyPage = ({ children }) => (
  <Suspense fallback={<RouteLoadingState />}>
    {children}
  </Suspense>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();

  const {
    data: userSettings,
    isFetched: settingsFetched,
    isError: settingsError,
    refetch: refetchSettings,
  } = useUserSettings();


  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  if (!settingsFetched) {
    return <LoadingScreen />;
  }

  if (settingsError) {
    return (
      <div className="app-page-surface fixed inset-0 flex items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center text-center">
          <Logo size={64} priority />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Couldn't load your settings
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your connection and try again. Your Cero data has not been changed.
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => refetchSettings()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const onboardingComplete = userSettings?.onboarding_complete === true;
  const isOnboardingRoute = location.pathname === '/onboarding';

  if (!onboardingComplete && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingComplete && isOnboardingRoute) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plan" element={<Plan />} />
        <Route
          path="/edit-plan"
          element={<Navigate to="/manage-plan?tab=monthly-plan" replace />}
        />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/manage-plan" element={<ManagePlan />} />

        <Route path="/add-transaction" element={<LazyPage><AddTransaction /></LazyPage>} />
        <Route path="/transactions/:id/edit" element={<LazyPage><AddTransaction /></LazyPage>} />
        <Route path="/accounts/:id" element={<LazyPage><AccountDetail /></LazyPage>} />
        <Route path="/add-account" element={<LazyPage><AddAccount /></LazyPage>} />
        <Route path="/accounts/:id/edit" element={<LazyPage><AddAccount /></LazyPage>} />
        <Route
          path="/categories"
          element={<Navigate to="/manage-plan?tab=categories" replace />}
        />
        <Route path="/settings" element={<LazyPage><Settings /></LazyPage>} />
        <Route
          path="/reflect"
          element={<Navigate to="/?tab=reflect" replace />}
        />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function ConnectionStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [updateRegistration, setUpdateRegistration] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      queryClientInstance.invalidateQueries();
    };
    const handleOffline = () => setOnline(false);
    const handleUpdate = (event) => setUpdateRegistration(event.detail?.registration || null);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('cero:pwa-update', handleUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('cero:pwa-update', handleUpdate);
    };
  }, []);

  const applyUpdate = () => {
    const worker = updateRegistration?.waiting;
    if (!worker) return;

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
    worker.postMessage({ type: 'SKIP_WAITING' });
  };

  if (online && !updateRegistration) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur">
      {!online && <span>Offline · changes are disabled until you reconnect</span>}
      {online && updateRegistration && (
        <>
          <span>A new Cero version is ready</span>
          <button type="button" className="font-semibold text-primary" onClick={applyUpdate}>
            Update
          </button>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthenticatedApp />
      </Router>

      <AutoSweepPrompt />
      <ConnectionStatus />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
