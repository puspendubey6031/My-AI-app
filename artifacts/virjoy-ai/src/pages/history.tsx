import { format } from "date-fns";
import { useListVideos, useDeleteVideo, getListVideosQueryKey, getGetVideosSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Trash2, Film, PlayCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const { data: videos, isLoading } = useListVideos();
  const deleteVideo = useDeleteVideo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteVideo.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVideosSummaryQueryKey() });
      toast({
        title: "Video deleted",
        description: "The project has been removed from your history.",
      });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: "Could not remove the video.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed": return "bg-destructive/10 text-destructive border-destructive/20";
      case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "queued": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-white/10 text-white border-white/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return <PlayCircle className="w-3 h-3 mr-1" />;
      case "failed": return <AlertCircle className="w-3 h-3 mr-1" />;
      case "processing":
      case "queued": return <Loader2 className="w-3 h-3 mr-1 animate-spin" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Project History</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Project History</h1>
          <p className="text-muted-foreground">Manage your generated cinematic videos.</p>
        </div>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No videos yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            You haven't generated any videos. Head over to the Studio to create your first cinematic masterpiece.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={video.id}
              className="group relative flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300"
            >
              <div className="aspect-video bg-black relative flex items-center justify-center border-b border-white/10">
                {video.status === "done" && video.outputUrl ? (
                  <video 
                    src={video.outputUrl} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    muted 
                    loop 
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <Film className="w-10 h-10 text-white/20" />
                )}
                
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="outline" className={`backdrop-blur-md bg-black/50 ${getStatusColor(video.status)}`}>
                    {getStatusIcon(video.status)}
                    <span className="capitalize">{video.status}</span>
                  </Badge>
                </div>
                
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant="secondary" className="backdrop-blur-md bg-black/50 border-white/20 capitalize">
                    {video.videoType}
                  </Badge>
                  <Badge variant="secondary" className="backdrop-blur-md bg-black/50 border-white/20 capitalize text-primary font-bold">
                    {video.plan}
                  </Badge>
                </div>

                <div className="absolute bottom-3 right-3">
                  <Badge variant="outline" className="backdrop-blur-md bg-black/50 border-white/20">
                    <Clock className="w-3 h-3 mr-1" />
                    {video.duration}s
                  </Badge>
                </div>
              </div>
              
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="font-semibold text-lg mb-1 truncate" title={video.title || "Untitled"}>
                  {video.title || "Untitled Project"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {format(new Date(video.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
                
                <div className="mt-auto flex gap-2 pt-4 border-t border-white/5">
                  {video.status === "done" && video.outputUrl && (
                    <Button 
                      variant="secondary" 
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = video.outputUrl!;
                        a.download = `${video.title || "video"}.mp4`;
                        a.click();
                      }}
                    >
                      Download
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={`shrink-0 ${video.status === "done" && video.outputUrl ? "w-10" : "w-full"} border-white/10 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 transition-colors`}
                    onClick={() => handleDelete(video.id)}
                    disabled={deleteVideo.isPending}
                  >
                    {deleteVideo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
