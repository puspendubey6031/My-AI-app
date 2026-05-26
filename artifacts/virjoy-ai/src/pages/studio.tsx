import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().optional(),
  videoType: z.nativeEnum(VideoJobVideoType),
  duration: z.coerce.number().refine(v => [10, 30, 60, 180].includes(v), { message: "Invalid duration" }),
  plan: z.nativeEnum(VideoJobPlan),
});

export default function Studio() {
  const { data: plans } = useGetPlans();
  const createVideoJob = useCreateVideoJob();
  const generateAiStory = useGenerateAiStory();
  const { toast } = useToast();

  const [images, setImages] = useState<File[]>([]);
  const [clips, setClips] = useState<File[]>([]);
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const { data: activeJob, error: jobError } = useGetVideo(activeJobId || "", {
    query: {
      enabled: !!activeJobId,
      refetchInterval: (query) => {
        const state = query.state.data;
        if (!state) return 3000;
        return (state.status === "queued" || state.status === "processing") ? 3000 : false;
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoType: "promo",
      duration: 30,
      plan: "free",
    },
  });

  const selectedPlanId = form.watch("plan");
  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  // AI Idea Box state
  const [aiIdea, setAiIdea] = useState("");

  const handleGenerateStory = async () => {
    if (!aiIdea.trim()) return;
    
    try {
      const res = await generateAiStory.mutateAsync({
        data: {
          idea: aiIdea,
          videoType: form.getValues("videoType") as any
        }
      });
      
      form.setValue("title", res.title);
      toast({
        title: "Story Generated!",
        description: "Your AI story has been applied to the form.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to generate story",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    if (values.title) formData.append("title", values.title);
    formData.append("videoType", values.videoType);
    formData.append("duration", values.duration.toString());
    formData.append("plan", values.plan);
    
    images.forEach(img => formData.append("images", img));
    clips.forEach(clip => formData.append("clips", clip));

    try {
      const job = await createVideoJob.mutateAsync({ data: formData as any });
      setActiveJobId(job.id);
      toast({
        title: "Job Queued",
        description: "Your video is now being generated.",
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

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
          Create Cinematic AI Videos
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select your plan, upload your media, and let our AI engine craft professional video content in minutes.
        </p>
      </div>

      <StatStrip />

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs">1</span>
          Choose your engine
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              onSelect={() => {
                form.setValue("plan", plan.id as PlanId);
                // Adjust duration if current selection exceeds new plan limit
                if (form.getValues("duration") > plan.maxDuration) {
                  form.setValue("duration", plan.maxDuration);
                }
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {selectedPlan?.aiStory && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-24 h-24" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary">
                    <Wand2 className="w-5 h-5" />
                    AI Idea Box
                  </h3>
                  <p className="text-sm text-primary/80 mb-4">
                    Describe your vision and our AI will generate a complete story structure.
                  </p>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="e.g. A moody commercial for a futuristic coffee brand..." 
                      value={aiIdea}
                      onChange={(e) => setAiIdea(e.target.value)}
                      className="bg-black/40 border-primary/20 focus-visible:ring-primary/50 text-white placeholder:text-white/30"
                    />
                    <Button 
                      type="button" 
                      onClick={handleGenerateStory}
                      disabled={generateAiStory.isPending || !aiIdea.trim()}
                      className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {generateAiStory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs">2</span>
                  Configuration
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Video" className="bg-white/5 border-white/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style & Vibe</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue placeholder="Select type" />
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
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10">
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

              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs">3</span>
                  Assets
                </h2>
                
                <div className="grid grid-cols-1 gap-8">
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
                  className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
                  disabled={isGenerating}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Cinematic Video
                </Button>
              )}
            </form>
          </Form>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <AnimatePresence mode="popLayout">
              {activeJobId && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="font-semibold text-lg mb-4">Generation Status</h3>
                    
                    {isGenerating && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{activeJob?.status || "Initializing"}...</span>
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: "5%" }}
                            animate={{ width: activeJob?.status === "processing" ? "60%" : "30%" }}
                            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Applying cinematic effects, grading, and rendering. This may take a few minutes.
                        </p>
                      </div>
                    )}

                    {isDone && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium text-sm">Render Complete</span>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full border-white/20 hover:bg-white/10"
                          onClick={() => {
                            setActiveJobId(null);
                            form.reset();
                            setImages([]);
                            setClips([]);
                          }}
                        >
                          Create Another
                        </Button>
                      </div>
                    )}

                    {isFailed && (
                      <div className="space-y-4">
                        <div className="text-destructive bg-destructive/10 p-3 rounded-lg text-sm">
                          Generation failed. Please try again.
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full border-white/20 hover:bg-white/10"
                          onClick={() => setActiveJobId(null)}
                        >
                          Reset
                        </Button>
                      </div>
                    )}
                  </div>

                  {isDone && activeJob?.outputUrl && (
                    <VideoPlayer url={activeJob.outputUrl} title={activeJob.title || "Generated Video"} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Temporary icon imports missed above
import { CheckCircle2 } from "lucide-react";