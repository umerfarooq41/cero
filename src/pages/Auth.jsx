import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

function HeaderLink({ children }) {
  return (
    <span className="text-sm font-bold text-muted-foreground/82 transition-colors hover:text-foreground">
      {children}
    </span>
  );
}

export default function Auth() {
  const { isAuthenticated, signIn, signUp, signInWithGoogle } = useAuth();
  const scope = usePageEntrance();
  const authCardRef = useRef(null);
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupNotice, setSignupNotice] = useState('');
  const [showMobileAuth, setShowMobileAuth] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isSignup = mode === 'signup';

  const focusAuthCard = (nextMode) => {
    setSignupNotice('');
    setMode(nextMode);
    setShowMobileAuth(true);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        authCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const cleanEmail = email.trim();

      if (isSignup) {
        const result = await signUp(cleanEmail, password);
        const confirmationRequired = !result?.session;

        if (confirmationRequired) {
          const message = 'After creating your account, confirm your email from the link we send before signing in.';
          setSignupNotice(message);
          setMode('signin');
          setPassword('');
          toast.success('Check your email to confirm your account', {
            description: 'Confirm your email from the link we send before signing in.',
            duration: 7000,
          });
        } else {
          setSignupNotice('');
          toast.success('Account created and signed in');
        }
      } else {
        await signIn(cleanEmail, password);
        setSignupNotice('');
        toast.success('Signed in');
      }
    } catch (error) {
      console.error('Auth form error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      toast.error(error.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div ref={scope} className="app-page-surface min-h-screen overflow-x-hidden bg-transparent">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8 lg:py-7">
        <div className="flex items-center gap-3">
          <Logo size={42} priority />
          <div>
            <p className="text-xl font-black leading-none tracking-tight text-foreground">Cero</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/72">
              Zero-based budgeting
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-7 md:flex">
          <HeaderLink>Plan</HeaderLink>
          <HeaderLink>Track</HeaderLink>
          <HeaderLink>Goals</HeaderLink>
          <HeaderLink>Reports</HeaderLink>
        </nav>

        <Button
          type="button"
          variant="outline"
          className="hidden rounded-full px-5 font-bold sm:inline-flex"
          onClick={() => focusAuthCard(isSignup ? 'signin' : 'signup')}
        >
          {isSignup ? 'Sign in' : 'Sign up'}
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 pb-8 pt-1 md:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-16 lg:pt-8">
        <section className="animate-child max-w-3xl">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/50 bg-background/45 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground shadow-sm sm:text-xs sm:tracking-[0.16em]">
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">The modern way to manage your money</span>
          </div>

          <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-foreground sm:mt-5 sm:text-5xl lg:text-7xl">
            Give every penny you earn a purpose.
          </h1>

          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:mt-6 sm:text-lg lg:text-xl lg:leading-8">
            Cero empowers you to build a zero-based monthly budget, keeping your finances perfectly aligned by organizing your plan, transactions, accounts, bills, and savings goals in one clean command center.
          </p>

          <div className="mt-5 grid max-w-2xl gap-2.5 text-sm font-semibold text-muted-foreground sm:mt-6 sm:text-[0.95rem]">
            <div className="inline-flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
              <span>Plan every month with total clarity</span>
            </div>
            <div className="inline-flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
              <span>Purposefully allocate your income</span>
            </div>
            <div className="inline-flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
              <span>Track transactions and balances seamlessly</span>
            </div>
            <div className="inline-flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
              <span>Manage recurring bills manually</span>
            </div>
            <div className="inline-flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
              <span>Build goals and track progress</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-12 rounded-full px-6 text-sm font-bold shadow-sm"
              onClick={() => focusAuthCard('signup')}
            >
              Set up your first budget
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-6 text-sm font-bold"
              onClick={() => focusAuthCard('signin')}
            >
              I already have an account
            </Button>
          </div>
        </section>

        <aside
          ref={authCardRef}
          id="auth-card"
          className={`${showMobileAuth ? 'block' : 'hidden'} animate-child scroll-mt-4 lg:block`}
        >
          <form onSubmit={handleSubmit} className="app-card-surface-strong rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground/75">
                  {isSignup ? 'Start Cero' : 'Welcome back'}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
                  {isSignup ? 'Create your account' : 'Sign in to Cero'}
                </h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>

            {signupNotice ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/8 p-3.5 text-left sm:mt-5">
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs font-semibold leading-5 text-muted-foreground">
                  {signupNotice}
                </p>
              </div>
            ) : null}

            <div className="mt-4 space-y-3 sm:mt-5">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                required
                className="h-12 rounded-2xl"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="h-12 rounded-2xl"
              />
            </div>

            <Button type="submit" disabled={loading} className="mt-4 h-12 w-full rounded-2xl font-bold sm:mt-5">
              {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            </Button>

            {isSignup ? (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-secondary/45 px-3 py-2.5 text-xs font-medium leading-5 text-muted-foreground">
                <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                After creating your account, confirm your email from the link we send before signing in.
              </p>
            ) : null}

            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/55" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="rounded-full bg-background/70 px-3 py-1 font-bold text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="h-12 w-full rounded-2xl font-bold"
            >
              <KeyRound className="h-4 w-4" />
              Continue with Google
            </Button>

            <button
              type="button"
              onClick={() => focusAuthCard(isSignup ? 'signin' : 'signup')}
              className="mt-4 w-full text-sm font-bold text-muted-foreground transition-colors hover:text-foreground sm:mt-5"
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}
