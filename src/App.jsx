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

import Dashboard from '@/pages/Dashboard';
import Plan from '@/pages/Plan';
import EditPlan from '@/pages/EditPlan';
import Transactions from '@/pages/Transactions';
import AddTransaction from '@/pages/AddTransaction';
import Accounts from '@/pages/Accounts';
import AccountDetail from '@/pages/AccountDetail';
import AddAccount from '@/pages/AddAccount';
import Categories from '@/pages/Categories';
import Settings from '@/pages/Settings';
import Reflect from '@/pages/Reflect';
import Onboarding from '@/pages/Onboarding';
import Auth from '@/pages/Auth';

import { useAutoSweepSurplus, useUserSettings } from '@/hooks/useBudgetData';
import CommandPalette from '@/components/shared/CommandPalette';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
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
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/edit-plan" element={<EditPlan />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/transactions/:id/edit" element={<AddTransaction />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/add-account" element={<AddAccount />} />
        <Route path="/accounts/:id/edit" element={<AddAccount />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reflect" element={<Reflect />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthenticatedApp />
      </Router>

      <Toaster />
          <CommandPalette />
      </QueryClientProvider>
  );
}

export default App;