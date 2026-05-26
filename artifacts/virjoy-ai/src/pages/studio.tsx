import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetPlans,
  useCreateVideoJob,
  useGetVideo,
  useGenerateAiStory,
  VideoJobVideoType,
  VideoJobPlan,
  PlanId
} from "@workspace/api-client-react";

import { StatStrip } from "@/components/stat-strip";
import { PlanCard } from "@/components/plan-card";
import { FileUpload } from "@/components/file-upload";
import { VideoPlayer } from "@/components/video-player";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, Wand2, CheckCircle2,
  Image as ImageIcon, Film, AlignLeft, Bot,
  Target, Ghost, MonitorPlay, Smartphone, Clapperboard, Video,
  ArrowRight, Download, PlayCircle, Activity, Upload
} from "lucide-react";

const formSchema = z.object({
  prompt: z.string().min(3, "Please describe your video idea (at least 3 characters)"),
  videoType: z.nativeEnum(VideoJobVideoType).optional(),
  duration: z.coerce.number().refine(v => [10, 30, 60, 180].includes(v), { message: "Invalid duration" }),
  plan: z.nativeEnum(VideoJobPlan),
});

// Client-side style detection mirroring the backend logic
function detectStyle(prompt: string): { label: string; color: string } {
  const l = prompt.toLowerCase();
  if (/horror|scary|dark|thriller|spooky|ghost|nightmare|terror|creepy|eerie/.test(l))
    return { label: "Cinematic Horror", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (/vlog|lifestyle|travel|daily|diary|day in|my life|personal|routine/.test(l))
    return { label: "Lifestyle Vlog", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
  if (/\bad\b|commercial|product|sell|advertisement|offer|deal|discount/.test(l))
    return { label: "Commercial Ad", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  return { label: "Brand Promo", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" };
}

export default function Studio() {
  const { data: plans } = useGetPlans();
  const createVideoJob = useCreateVideoJob();
  const generateAiStory = useGenerateAiStory();
  const { toast } = useToast();

  const [images, setImages] = useState<File[]>([]);
  const [clips, setClips] = useState<File[]>([]);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: activeJob } = useGetVideo(activeJobId || "", {
    query: {
      queryKey: [activeJobId],
      enabled: !!activeJobId,
      refetchInterval: (query: any) => {
        const state = query.state.data;
        if (!state) return 3000;
        return (state.status === "queued" || state.status === "processing") ? 3000 : false;
      }
    }
  } as any);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      videoType: undefined,
      duration: 30,
      plan: "free",
    },
  });

  const selectedPlanId = form.watch("plan");
  const selectedPlan = plans?.find(p => p.id === selectedPlanId);
  const watchedPrompt = form.watch("prompt");
  const detectedStyle = watchedPrompt.length > 2 ? detectStyle(watchedPrompt) : null;

  const handleEnhanceWithAi = async () => {
    const prompt = form.getValues("prompt");
    if (!prompt.trim()) return;

    try {
      const res = await generateAiStory.mutateAsync({
        data: { prompt }
      });
      // Fill the prompt with the AI-generated title + story for a richer prompt
      form.setValue("prompt", `${res.title}. ${res.story}`);
      if (res.detectedType) {
        form.setValue("videoType", res.detectedType as VideoJobVideoType);
      }
      toast({
        title: "Prompt Enhanced!",
        description: "Your AI has expanded your idea into a full cinematic brief.",
      });
    } catch (err: any) {
      toast({
        title: "Enhancement Failed",
        description: err?.message || "Could not enhance prompt",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append("prompt", values.prompt);
    if (values.videoType) formData.append("videoType", values.videoType);
    formData.append("duration", values.duration.toString());
    formData.append("plan", values.plan);

    images.forEach(img => formData.append("images", img));
    clips.forEach(clip => formData.append("clips", clip));

    try {
      const job = await createVideoJob.mutateAsync({ data: formData as any });
      setActiveJobId(job.id);
      toast({
        title: "Job Queued",
        description: "Your video is now being generated from your prompt.",
      });
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err?.message || "Could not create video job",
        variant: "destructive",
      });
    }
  };

  const isGenerating = createVideoJob.isPending || activeJob?.status === "queued" || activeJob?.status === "processing";
  const isDone = activeJob?.status === "done";
  const isFailed = activeJob?.status === "failed";

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full">
      {/* SECTION A — HERO */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 100, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen"
          />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -100, 0],
              y: [0, 100, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen"
          />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-br from-white via-white to-primary/80 bg-clip-text text-transparent leading-[1.1]"
          >
            Turn Your Ideas Into <br className="hidden md:block"/> Cinematic Videos
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12 font-medium"
          >
            Type a prompt, optionally upload screenshots or clips, and let VirJoy AI create stunning cinematic videos automatically.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
          >
            <Button
              size="lg"
              onClick={() => scrollToSection('create')}
              className="h-16 px-10 rounded-2xl text-lg font-bold bg-white text-black hover:bg-white/90 shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105"
            >
              Start Creating <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('how-it-works')}
              className="h-16 px-10 rounded-2xl text-lg font-bold border-white/20 text-white hover:bg-white/10 backdrop-blur-md transition-all duration-300"
            >
              See How It Works <PlayCircle className="ml-2 w-5 h-5 text-white/70" />
            </Button>
          </motion.div>
        </div>

        <div className="w-full mt-auto">
          <StatStrip />
        </div>
      </section>

      {/* SECTION B — FEATURES */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-[0.2em] text-sm uppercase mb-4 block">What You Can Do</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Create Videos From Your Own Content</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: ImageIcon, title: "Upload Screenshots", desc: "Drop your screenshots and we'll turn them into moving scenes", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: Film, title: "Upload Images", desc: "Add up to 10 images with cinematic zoom, pan, and fade effects", color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: Video, title: "Upload Short Clips", desc: "Bring your own video clips, we apply professional grading", color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { icon: AlignLeft, title: "Prompt-Based Video Creation", desc: "Describe your video idea and optionally upload screenshots or clips for cinematic editing", color: "text-amber-400", bg: "bg-amber-400/10" },
              { icon: Bot, title: "Automatic Cinematic Editing", desc: "AI handles effects, pacing, and audio matching", color: "text-pink-400", bg: "bg-pink-400/10" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:scale-[1.02] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_40px_-15px_rgba(var(--primary),0.3)] transition-all duration-300 cursor-default flex flex-col"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg}`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION C — SUPPORTED TYPES */}
      <section className="py-24 md:py-32 relative border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Built for Every Format</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { id: 'ad', name: "Ads", desc: "High-converting commercial videos", icon: Target, gradient: "from-amber-500/20 to-orange-600/5", border: "hover:border-amber-500/50" },
              { id: 'horror', name: "Horror Stories", desc: "Dark, atmospheric storytelling", icon: Ghost, gradient: "from-red-500/20 to-rose-900/5", border: "hover:border-red-500/50" },
              { id: 'promo', name: "Promo Videos", desc: "Brand and product promotions", icon: MonitorPlay, gradient: "from-violet-500/20 to-purple-600/5", border: "hover:border-violet-500/50" },
              { id: 'reels', name: "Reels", desc: "Short-form vertical content", icon: Smartphone, gradient: "from-pink-500/20 to-rose-500/5", border: "hover:border-pink-500/50" },
              { id: 'vlogs', name: "Vlogs", desc: "Personal lifestyle storytelling", icon: Video, gradient: "from-cyan-500/20 to-blue-600/5", border: "hover:border-cyan-500/50" },
              { id: 'shorts', name: "Social Media Shorts", desc: "Optimized for quick sharing", icon: Clapperboard, gradient: "from-green-500/20 to-emerald-600/5", border: "hover:border-green-500/50" },
            ].map((type, i) => (
              <div
                key={i}
                className={`group p-8 rounded-3xl border border-white/5 bg-gradient-to-br ${type.gradient} backdrop-blur-md transition-all duration-300 ${type.border} hover:scale-[1.02]`}
              >
                <type.icon className="w-10 h-10 mb-6 text-white/80 group-hover:text-white transition-colors" />
                <h3 className="text-2xl font-bold mb-2">{type.name}</h3>
                <p className="text-white/60">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION D — HOW IT WORKS */}
      <section id="how-it-works" className="py-24 md:py-32 relative border-t border-white/5">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">From Idea to Video in 3 Steps</h2>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 -translate-x-1/2" />

            <div className="space-y-24">
              {[
                { num: "01", title: "Choose Your Plan", desc: "Select the processing engine and quality that fits your needs.", icon: Target },
                { num: "02", title: "Type Your Prompt", desc: "Describe your video in plain language. Optionally upload screenshots or clips as supporting visuals.", icon: AlignLeft },
                { num: "03", title: "Download Your Video", desc: "Our AI automatically renders, grades, and delivers your cinematic video.", icon: Download }
              ].map((step, i) => (
                <div key={i} className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`w-full md:w-1/2 flex justify-center ${i % 2 !== 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
                      <span className="text-[120px] md:text-[180px] font-black text-white/5 absolute -z-10 leading-none select-none">{step.num}</span>
                      <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                        <step.icon className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className={`w-full md:w-1/2 text-center ${i % 2 !== 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                    <p className="text-xl text-white/60 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E — CREATION STUDIO */}
      <section id="create" className="py-24 md:py-32 relative border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Prompt-Based Video Creation</h2>
            <p className="text-lg text-white/50 mb-6">Describe your video idea and optionally upload screenshots or clips for cinematic editing.</p>
            <div className="w-24 h-1 bg-primary rounded-full" />
          </div>

          {/* Step 1 — Plan */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">1</span>
              Choose Your Engine
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlanId === plan.id}
                  onSelect={() => {
                    form.setValue("plan", plan.id as PlanId);
                    if (form.getValues("duration") > plan.maxDuration) {
                      form.setValue("duration", plan.maxDuration);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 xl:col-span-8 space-y-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                  {/* Step 2 — Prompt (PRIMARY) */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">2</span>
                      Your Prompt
                    </h3>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                      <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. Create a cinematic horror trailer for a new thriller movie with dark atmospheric visuals and intense music..."
                                rows={5}
                                className="text-base bg-black/40 border-white/10 rounded-xl resize-none text-white placeholder:text-white/25 focus-visible:ring-primary/50 focus-visible:border-primary/40"
                                disabled={isGenerating}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Auto-detected style badge */}
                      {detectedStyle && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-white/40">Detected style:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${detectedStyle.color}`}>
                            {detectedStyle.label}
                          </span>
                          <span className="text-white/30 text-xs">· auto-detected from prompt</span>
                        </motion.div>
                      )}

                      {/* AI Enhance button — Premium only */}
                      {selectedPlan?.aiStory && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-3 pt-2"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEnhanceWithAi}
                            disabled={generateAiStory.isPending || !watchedPrompt.trim() || isGenerating}
                            className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl font-semibold"
                          >
                            {generateAiStory.isPending
                              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enhancing...</>
                              : <><Wand2 className="w-4 h-4 mr-2" /><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Enhance with AI</>
                            }
                          </Button>
                          <span className="text-xs text-white/30">Expand your idea into a full cinematic brief</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Step 3 — Settings (secondary, compact) */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">3</span>
                      Settings
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl bg-white/5 border border-white/10">
                      <FormField
                        control={form.control}
                        name="videoType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base text-white/80 flex items-center gap-2">
                              Style Override
                              <span className="text-xs font-normal text-white/30 border border-white/10 rounded-full px-2 py-0.5">Optional</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl">
                                  <SelectValue placeholder="Auto-detect from prompt" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ad">Commercial Ad</SelectItem>
                                <SelectItem value="horror">Cinematic Horror</SelectItem>
                                <SelectItem value="promo">Brand Promo</SelectItem>
                                <SelectItem value="vlog">Lifestyle Vlog</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base text-white/80">Duration</FormLabel>
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl">
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="10" disabled={(selectedPlan?.maxDuration || 0) < 10}>10 Seconds</SelectItem>
                                <SelectItem value="30" disabled={(selectedPlan?.maxDuration || 0) < 30}>30 Seconds</SelectItem>
                                <SelectItem value="60" disabled={(selectedPlan?.maxDuration || 0) < 60}>1 Minute</SelectItem>
                                <SelectItem value="180" disabled={(selectedPlan?.maxDuration || 0) < 180}>3 Minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Step 4 — Upload Media (Optional) */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">4</span>
                      Upload Supporting Media
                      <span className="text-sm font-normal text-white/30 border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Optional
                      </span>
                    </h3>
                    <p className="text-sm text-white/40 -mt-2">Uploaded images and clips are inserted into your video as supporting visuals alongside your prompt.</p>

                    <div className="grid grid-cols-1 gap-6 p-8 rounded-3xl bg-white/5 border border-white/10">
                      <FileUpload
                        type="image"
                        maxFiles={selectedPlan?.maxImages || 0}
                        files={images}
                        onChange={setImages}
                        disabled={isGenerating}
                      />
                      <FileUpload
                        type="clip"
                        maxFiles={selectedPlan?.maxClips || 0}
                        files={clips}
                        onChange={setClips}
                        disabled={isGenerating}
                      />
                    </div>
                  </div>

                  {!activeJobId && (
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-16 rounded-2xl text-xl font-black bg-white text-black hover:bg-white/90 shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-[1.02]"
                      disabled={isGenerating}
                    >
                      <Sparkles className="w-6 h-6 mr-2 text-primary" />
                      Generate Video from Prompt
                    </Button>
                  )}
                </form>
              </Form>
            </div>

            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-28">
                <AnimatePresence mode="popLayout">
                  {activeJobId && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-6"
                    >
                      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-primary" />
                          Generation Status
                        </h3>

                        {isGenerating && (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between text-sm font-medium">
                              <span className="text-white capitalize">{activeJob?.status || "Initializing"}...</span>
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </div>
                            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary to-cyan-400"
                                initial={{ width: "5%" }}
                                animate={{ width: activeJob?.status === "processing" ? "60%" : "30%" }}
                                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                              />
                            </div>
                            <p className="text-sm text-white/50 text-center leading-relaxed">
                              Applying cinematic effects, grading, and rendering. This may take a few minutes.
                            </p>
                          </div>
                        )}

                        {isDone && (
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 text-emerald-400 bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20">
                              <CheckCircle2 className="w-6 h-6 shrink-0" />
                              <span className="font-bold">Render Complete</span>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full h-14 rounded-xl border-white/20 hover:bg-white/10 font-bold"
                              onClick={() => {
                                setActiveJobId(null);
                                form.reset();
                                setImages([]);
                                setClips([]);
                              }}
                            >
                              Create Another Video
                            </Button>
                          </div>
                        )}

                        {isFailed && (
                          <div className="space-y-6">
                            <div className="text-rose-400 bg-rose-400/10 p-4 rounded-xl border border-rose-400/20 font-medium">
                              Generation failed. Please try again.
                            </div>
                            <Button
                              variant="outline"
                              className="w-full h-14 rounded-xl border-white/20 hover:bg-white/10 font-bold"
                              onClick={() => setActiveJobId(null)}
                            >
                              Reset
                            </Button>
                          </div>
                        )}
                      </div>

                      {isDone && activeJob?.outputUrl && (
                        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                          <VideoPlayer url={activeJob.outputUrl} title={activeJob.title || "Generated Video"} />
                        </div>
                      )}
                    </motion.div>
                  )}
                  {!activeJobId && (
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center min-h-[300px]">
                      <Video className="w-12 h-12 text-white/10 mb-4" />
                      <h3 className="text-xl font-bold text-white/40 mb-2">Ready to Render</h3>
                      <p className="text-sm text-white/30">Type your prompt and generate to see progress here.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F — PRICING (Marketing) */}
      <section className="py-24 md:py-32 relative border-t border-white/5 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-white/60">Choose the perfect plan for your video creation needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans?.map((plan) => (
              <PlanCard
                key={`marketing-${plan.id}`}
                plan={plan}
                displayOnly={true}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
