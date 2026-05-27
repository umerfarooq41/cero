import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { usePageEntrance } from "@/hooks/usePageTransition";
import Logo from "@/components/Logo";

export default function Auth() {
  const { isAuthenticated, signIn, signUp, signInWithGoogle } = useAuth();
  const scope = usePageEntrance();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUp(email, password);
        toast.success("Account created");
      } else {
        await signIn(email, password);
        toast.success("Signed in");
      }
    } catch (error) {
      console.error("Auth form error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed:", error);
      toast.error(error.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="animate-child w-full max-w-sm surface-card card-elevated border border-white/40 dark:border-white/[0.05] rounded-xl p-6 space-y-5">
        <div className="text-center space-y-3">
          <Logo size={52} className="mx-auto" priority />
          <div>
            <h1 className="text-xl font-bold">Cero</h1>
            <p className="text-sm text-muted-foreground">{mode === "signup" ? "Create your budget account" : "Sign in to your budget"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6} />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-11">
          {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="app-card-surface-soft px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button type="button" variant="outline" disabled={loading} onClick={handleGoogleSignIn} className="w-full h-11 gap-2">
          <KeyRound className="w-4 h-4" />
          Continue with Google
        </Button>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </form>
    </div>
  );
}
