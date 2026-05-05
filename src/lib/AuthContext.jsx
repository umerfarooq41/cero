import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Supabase getSession error:", error);
      setAuthError({ type: "auth_error", message: error.message });
      setSession(null);
      setUser(null);
    } else {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    }

    setAuthChecked(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthError(null);
      setAuthChecked(true);
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadSession]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Supabase signIn error:", error);
      throw error;
    }

    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Supabase signUp error:", error);
      throw error;
    }

    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Supabase Google sign-in error:", error);
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase signOut error:", error);
      throw error;
    }

    setSession(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(session?.user),
      isLoadingAuth: loading,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      logout: signOut,
      navigateToLogin: () => {
        window.location.href = "/login";
      },
      checkUserAuth: loadSession,
      checkAppState: loadSession,
    }),
    [authChecked, authError, loadSession, loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};