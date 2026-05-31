import { lazy, Suspense } from 'react';
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

import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Logo from '@/components/Logo';
import { useAutoSweepSurplus, useUserSettings } from '@/hooks/useBudgetData';

const PageNotFound = lazy(() => import('./lib/PageNotFound'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Plan = lazy(() => import('@/pages/Plan'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const ManagePlan = lazy(() => import('@/pages/ManagePlan'));
const AddTransaction = lazy(() => import('@/pages/AddTransaction'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const AccountDetail = lazy(() => import('@/pages/AccountDetail'));
const AddAccount = lazy(() => import('@/pages/AddAccount'));
const Settings = lazy(() => import('@/pages/Settings'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Auth = lazy(() => import('@/pages/Auth'));

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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();

  const {
    data: userSettings,
    isFetched: settingsFetched,
  } = useUserSettings();

  useAutoSweepSurplus();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="*" element={<Auth />} />
        </Routes>
      </Suspense>
    );
  }

  if (!settingsFetched) {
    return <LoadingScreen />;
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
    <Suspense fallback={<LoadingScreen />}>
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
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/transactions/:id/edit" element={<AddTransaction />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/add-account" element={<AddAccount />} />
        <Route path="/accounts/:id/edit" element={<AddAccount />} />
        <Route path="/manage-plan" element={<ManagePlan />} />
        <Route
          path="/categories"
          element={<Navigate to="/manage-plan?tab=categories" replace />}
        />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/reflect"
          element={<Navigate to="/?tab=reflect" replace />}
        />
      </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthenticatedApp />
      </Router>

      <Toaster />
    </QueryClientProvider>
  );
}

export default App;