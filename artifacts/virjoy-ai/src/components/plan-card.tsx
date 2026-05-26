import { motion } from "framer-motion";
import { Plan } from "@workspace/api-client-react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
  const isPremium = plan.id === "premium";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "relative p-6 rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden flex flex-col h-full",
        isSelected
          ? "bg-primary/10 border-primary ring-1 ring-primary/50 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      )}
    >
      {isPremium && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </div>
        </div>
      )}

      {isSelected && (
        <div className="absolute -inset-px bg-gradient-to-b from-primary/20 to-transparent rounded-2xl pointer-events-none" />
      )}

      <div className="mb-4 relative z-10">
        <h3 className="text-xl font-bold capitalize mb-1">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">
            {plan.price === 0 ? "Free" : `₹${plan.price}`}
          </span>
          {plan.price > 0 && <span className="text-sm text-muted-foreground">/video</span>}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6 flex-grow relative z-10">
        {plan.description || `Perfect for ${plan.name} creations.`}
      </p>

      <ul className="space-y-3 mb-6 relative z-10">
        <li className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span>Up to {plan.maxDuration}s duration</span>
        </li>
        <li className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span>Max {plan.maxImages} images, {plan.maxClips} clips</span>
        </li>
        <li className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span>{plan.quality} quality</span>
        </li>
        {plan.aiStory && (
          <li className="flex items-start gap-2 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
            <span>AI Story Generation</span>
          </li>
        )}
        {!plan.watermark && (
          <li className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>No Watermark</span>
          </li>
        )}
      </ul>
      
      <div className={cn(
        "w-full py-2.5 rounded-lg text-center text-sm font-medium transition-colors relative z-10",
        isSelected 
          ? "bg-primary text-primary-foreground" 
          : "bg-white/10 text-white group-hover:bg-white/20"
      )}>
        {isSelected ? "Selected" : "Select Plan"}
      </div>
    </motion.div>
  );
}
