import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  MailCheck,
  Receipt,
  ShieldCheck,
  Target,
  WalletCards,
} from 'lucide-react';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const featureItems = [
  {
    icon: CalendarCheck,
    title: 'Monthly plan',
    description: 'Assign income across expenses, savings, and debt before the month starts.',
  },
  {
    icon: Receipt,
    title: 'Transactions',
    description: 'Track history, scheduled bills, recurring rules, and goal transfers clearly.',
  },
  {
    icon: Target,
    title: 'Savings goals',
    description: 'Turn every contribution into visible progress without mixing it with spending.',
  },
];

function HeaderLink({ children }) {
  return (
    <span className="text-sm font-bold text-muted-foreground/82 transition-colors hover:text-foreground">
      {children}
    </span>
  );
}

function ProductPreviewCard({ icon: Icon, title, subtitle, amount, progress, className }) {
  return (
    <div className={cn('app-card-surface-soft rounded-3xl p-4 shadow-sm', className)}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/75 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-foreground">{title}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{subtitle}</p>
        </div>

        {amount ? (
          <p className="shrink-0 text-sm font-black tabular-nums text-foreground">{amount}</p>
        ) : null}
      </div>

      {typeof progress === 'number' ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary/80">
          <div
            className="h-full rounded-full bg-primary/75"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <article className="app-card-surface-soft rounded-3xl p-4 sm:p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-black tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

export default function Auth() {
  const { isAuthenticated, signIn, signUp, signInWithGoogle } = useAuth();
  const scope = usePageEntrance();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupNotice, setSignupNotice] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isSignup = mode === 'signup';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const cleanEmail = email.trim();

      if (isSignup) {
        const result = await signUp(cleanEmail, password);
        const confirmationRequired = !result?.session;

        if (confirmationRequired) {
          const message = `We sent a confirmation link to ${cleanEmail}. Confirm your email, then sign in to Cero.`;
          setSignupNotice(message);
          setMode('signin');
          setPassword('');
          toast.success('Check your email to confirm your account', {
            description: `Open the confirmation link sent to ${cleanEmail}, then sign in.`,
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
    <div ref={scope} className="app-page-surface min-h-screen overflow-hidden bg-transparent">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6 lg:px-8 lg:py-7">
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
          onClick={() => {
            setSignupNotice('');
            setMode(isSignup ? 'signin' : 'signup');
          }}
        >
          {isSignup ? 'Sign in' : 'Sign up'}
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-4 pb-10 pt-2 md:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:pb-16 lg:pt-8">
        <section className="animate-child max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/45 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            The modern way to manage your money
          </div>

          <h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-foreground sm:text-5xl lg:text-7xl">
            Build a monthly plan where every penny you earn has a purpose.
          </h1>

          <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg lg:text-xl lg:leading-8">
            Cero brings your plan, transactions, accounts, recurring bills, and savings goals into one clean website-style command center.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-12 rounded-full px-6 text-sm font-bold shadow-sm"
              onClick={() => {
                setSignupNotice('');
                setMode('signup');
              }}
            >
              Set up your first budget
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-6 text-sm font-bold"
              onClick={() => {
                setSignupNotice('');
                setMode('signin');
              }}
            >
              I already have an account
            </Button>
          </div>

          <div className="mt-7 grid gap-3 text-sm font-semibold text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
              Monthly budget clarity
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
              Manual recurring control
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
              Goal-based saving
            </div>
          </div>
        </section>

        <aside className="animate-child grid gap-4 lg:gap-5">
          <form onSubmit={handleSubmit} className="app-card-surface-strong rounded-[2rem] p-5 sm:p-6">
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
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/8 p-3.5 text-left">
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs font-semibold leading-5 text-muted-foreground">
                  {signupNotice}
                </p>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
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

            <Button type="submit" disabled={loading} className="mt-5 h-12 w-full rounded-2xl font-bold">
              {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            </Button>

            {isSignup ? (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-secondary/45 px-3 py-2.5 text-xs font-medium leading-5 text-muted-foreground">
                <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                After creating your account, confirm your email from the link we send before signing in.
              </p>
            ) : null}

            <div className="relative my-5">
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
              onClick={() => {
                setSignupNotice('');
                setMode(isSignup ? 'signin' : 'signup');
              }}
              className="mt-5 w-full text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <ProductPreviewCard
              icon={WalletCards}
              title="Left to allocate"
              subtitle="May monthly balance"
              amount="250"
              progress={72}
            />
            <ProductPreviewCard
              icon={Receipt}
              title="Upcoming bills"
              subtitle="3 scheduled this week"
              amount="1,850"
              progress={58}
            />
          </div>
        </aside>
      </main>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-4 pb-12 md:px-6 lg:grid-cols-3 lg:px-8">
        {featureItems.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </section>
    </div>
  );
}
