import { motion } from "framer-motion";
import { useGetVideosSummary } from "@workspace/api-client-react";
import { Activity, CheckCircle2, Clock, Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatStrip() {
  const { data: summary, isLoading } = useGetVideosSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/5 border border-white/10" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      label: "Total Videos",
      value: summary.total,
      icon: Film,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "group-hover:border-primary/30",
      glow: "group-hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]",
    },
    {
      label: "Completed",
      value: summary.byStatus?.done || 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "group-hover:border-emerald-400/30",
      glow: "group-hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.3)]",
    },
    {
      label: "Processing",
      value: summary.byStatus?.processing || 0,
      icon: Activity,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      border: "group-hover:border-cyan-400/30",
      glow: "group-hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]",
    },
    {
      label: "Queued",
      value: summary.byStatus?.queued || 0,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "group-hover:border-amber-400/30",
      glow: "group-hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.3)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl mx-auto z-10 relative">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className={`group flex flex-col items-center sm:flex-row sm:items-start gap-4 p-5 md:p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.08] hover:-translate-y-1 ${stat.border} ${stat.glow}`}
          >
            <div className={`p-3.5 rounded-2xl transition-colors duration-300 ${stat.bg}`}>
              <Icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-center sm:text-left mt-2 sm:mt-0">
              <p className="text-sm font-bold text-white/50 mb-1 tracking-wider uppercase">{stat.label}</p>
              <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}