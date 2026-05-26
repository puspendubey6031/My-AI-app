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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">VirJoy AI</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location === "/" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>
            <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Studio</span>
          </Link>
          <Link href="/history" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location === "/history" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>
            <span className="flex items-center gap-2"><History className="w-4 h-4" /> History</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
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
