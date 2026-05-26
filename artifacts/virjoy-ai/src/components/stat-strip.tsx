import { motion } from "framer-motion";
import { useGetVideosSummary } from "@workspace/api-client-react";
import { Activity, CheckCircle2, Clock, Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatStrip() {
  const { data: summary, isLoading } = useGetVideosSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5 border border-white/10" />
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
    },
    {
      label: "Completed",
      value: summary.byStatus?.done || 0,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Processing",
      value: summary.byStatus?.processing || 0,
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Queued",
      value: summary.byStatus?.queued || 0,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
