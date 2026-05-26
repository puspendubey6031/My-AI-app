import { useState, useRef } from "react";
import { UploadCloud, X, FileVideo, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  type: "image" | "clip";
  maxFiles: number;
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function FileUpload({ type, maxFiles, files, onChange, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === "image" ? "image/*" : "video/*";
  const Icon = type === "image" ? ImageIcon : FileVideo;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && files.length < maxFiles) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (newFiles: FileList | null) => {
    if (!newFiles || disabled) return;
    
    const validFiles = Array.from(newFiles).filter(f => f.type.startsWith(type === "image" ? "image/" : "video/"));
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length > 0) {
      onChange([...files, ...filesToAdd]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const isFull = files.length >= maxFiles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium capitalize">{type}s</h4>
        <span className="text-xs text-muted-foreground">
          {files.length} / {maxFiles}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isFull && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center justify-center text-center",
          disabled ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10" :
          isFull ? "bg-white/5 border-white/10 cursor-not-allowed" :
          isDragging ? "border-primary bg-primary/5" : "border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={disabled || isFull}
        />
        <div className="p-3 rounded-full bg-white/5 mb-3">
          <UploadCloud className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">
          {isFull ? "Maximum files reached" : `Click or drag ${type}s here`}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports {type === "image" ? "JPG, PNG, WEBP" : "MP4, MOV, WEBM"}
        </p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-video flex items-center justify-center">
              {type === "image" ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${i}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-2 text-center">
                  <FileVideo className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground truncate w-full px-2" title={file.name}>
                    {file.name}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
