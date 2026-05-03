import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AuthChangeEvent } from '@supabase/supabase-js';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  passwordRecoveryPending: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
  updatePasswordAfterRecovery: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false);

  useEffect(() => {
    async function bootstrapAuth() {
      const hashIndicatesRecovery =
        typeof window !== 'undefined' && /[#&](?:[^#&]*[&])?type=recovery(?:&|$)/.test(window.location.hash);

      try {
        const [{ data: sessionData }, { data: userData }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);
        setSession(sessionData.session);
        // Сессия без user из getUser (сеть/retry) не должна сбрасывать профиль во flash на null.
        const u = userData.user ?? sessionData.session?.user ?? null;
        setUser(u);
        if (hashIndicatesRecovery && sessionData.session) {
          setPasswordRecoveryPending(true);
        }
      } catch (e) {
        console.error('Не удалось восстановить сессию:', e);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true);
      }
      setSession(nextSession);
      if (!nextSession) {
        setUser(null);
        setPasswordRecoveryPending(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user ?? nextSession.user ?? null);
      } catch (e) {
        console.error('Не удалось обновить пользователя после смены сессии:', e);
        setUser(nextSession.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    setPasswordRecoveryPending(false);
    await supabase.auth.signOut();
  }

  async function sendPasswordResetEmail(email: string) {
    const trimmed = email.trim();
    const origin =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: origin ? `${origin}/` : undefined,
    });
    return { error: error?.message ?? null };
  }

  async function updatePasswordAfterRecovery(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setPasswordRecoveryPending(false);
    }
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        passwordRecoveryPending,
        signIn,
        signUp,
        signOut,
        sendPasswordResetEmail,
        updatePasswordAfterRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
