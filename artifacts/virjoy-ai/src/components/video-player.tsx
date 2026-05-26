import { motion } from "framer-motion";
import { Download, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  url: string;
  title: string | null;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl relative group"
    >
      <div className="aspect-video relative bg-white/5 flex items-center justify-center">
        {!url ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Preparing video stream...</p>
          </div>
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="w-full h-full object-contain"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      
      {url && (
        <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 text-primary rounded-full">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{title || "Untitled Video"}</p>
              <p className="text-xs text-muted-foreground">Ready to share</p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              const a = document.createElement("a");
              a.href = url;
              a.download = `${title || "video"}.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            variant="outline"
            className="gap-2 border-white/20 hover:bg-white/10"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      )}
    </motion.div>
  );
}
