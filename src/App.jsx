import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Plan from '@/pages/Plan';
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
import { useAutoSweepSurplus } from '@/hooks/useBudgetData';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  useAutoSweepSurplus();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      {!isAuthenticated && <Route path="*" element={<Auth />} />}
      {isAuthenticated && (
        <>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Plan />} />
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
        </>
      )}
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
