import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Video, History, Sparkles } from "lucide-react";
import NotFound from "@/pages/not-found";
import Studio from "@/pages/studio";
import HistoryPage from "@/pages/history";

const queryClient = new QueryClient();

function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_-10px_rgba(var(--primary),0.2)]" 
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
            VirJoy AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${location === "/" ? "bg-white/10 text-white shadow-inner" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Studio</span>
          </Link>
          <Link href="/history" className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${location === "/history" ? "bg-white/10 text-white shadow-inner" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <span className="flex items-center gap-2"><History className="w-4 h-4" /> History</span>
          </Link>
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;