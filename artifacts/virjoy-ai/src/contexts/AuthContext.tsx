import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { type User as SupabaseUser, type Session } from "@supabase/supabase-js";

// ── Backend user shape ────────────────────────────────────────────────────────
export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  is_blocked: boolean;
  role: string;
  created_at: string;
}

// ── Context type ──────────────────────────────────────────────────────────────
interface AuthContextValue {
  supabaseUser: SupabaseUser | null;
  dbUser: DbUser | null;
  authLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDbUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

async function fetchDbUser(session: Session | null): Promise<DbUser | null> {
    if (!session) return null;
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }
    return data as DbUser;
}


// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        const user = await fetchDbUser(session);
        setDbUser(user);
        setAuthLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        fetchDbUser(session).then(user => setDbUser(user));
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
}, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return session?.access_token ?? null;
  }, [session]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setDbUser(null);
  }, []);

  const refreshDbUser = useCallback(async () => {
    const user = await fetchDbUser(session);
    setDbUser(user);
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        supabaseUser,
        dbUser,
        authLoading,
        signInWithEmail,
        signOut,
        refreshDbUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
