import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Video, History, Sparkles, LogOut, Coins, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import Studio from "@/pages/studio";
import HistoryPage from "@/pages/history";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { firebaseUser, dbUser, authLoading, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const planColors: Record<string, string> = {
    free: "text-white/50",
    starter: "text-yellow-400",
    creator: "text-blue-400",
    premium: "text-purple-400",
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_-10px_rgba(var(--primary),0.2)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
            VirJoy AI
          </span>
        </Link>

        {/* Nav links + auth */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              location === "/"
                ? "bg-white/10 text-white shadow-inner"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-2">
              <Video className="w-4 h-4" /> Studio
            </span>
          </Link>

          <Link
            href="/history"
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              location === "/history"
                ? "bg-white/10 text-white shadow-inner"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" /> History
            </span>
          </Link>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Auth area */}
          <AnimatePresence mode="wait">
            {authLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 rounded-full bg-white/10 animate-pulse"
              />
            ) : firebaseUser ? (
              <motion.div
                key="user"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                {/* Credits badge */}
                {dbUser && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <Coins className={`w-3.5 h-3.5 ${planColors[dbUser.currentPlan] ?? "text-white/50"}`} />
                    <span className="text-sm font-semibold text-white/80">
                      {dbUser.credits}
                    </span>
                    <span className="text-xs text-white/35 capitalize">
                      {dbUser.currentPlan}
                    </span>
                  </div>
                )}

                {/* User email */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <UserCircle className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-sm text-white/60 max-w-[120px] truncate">
                    {firebaseUser.email}
                  </span>
                </div>

                {/* Sign out */}
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="p-2.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="guest"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary/80 to-cyan-500/80 hover:from-primary hover:to-cyan-500 text-white shadow-md shadow-primary/20 transition-all duration-300"
                >
                  Get Started
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/30 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10 pointer-events-none" />
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={Studio} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
