import { memo, useState, useEffect } from "react";
import AttentionHeatmap from "./AttentionHeatmap";
import ROISelector from "./ROISelector";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface MessageImageProps {
  imageUrl: string;
  isRoiMode: boolean;
  showAttentionHeatmap: boolean;
  onROISelect: (roi: any, imageUrl?: string) => void;
}

/**
 * Optimized image component for chat messages with lazy loading, error handling, and performance optimizations
 */
const MessageImage = memo(
  ({
    imageUrl,
    isRoiMode,
    showAttentionHeatmap,
    onROISelect,
  }: MessageImageProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({
      width: 0,
      height: 0,
    });

    useEffect(() => {
      // Reset states when imageUrl changes
      setIsLoading(true);
      setHasError(false);

      // Preload image to get dimensions and ensure it's loaded
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setIsLoading(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      img.src = imageUrl;
    }, [imageUrl]);

    if (isRoiMode) {
      return (
        <ROISelector
          imageUrl={imageUrl}
          onROISelect={onROISelect}
          isActive={isRoiMode}
        />
      );
    }

    if (hasError) {
      return (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-300">Failed to load image</span>
        </div>
      );
    }

    return (
      <div className="relative">
        {isLoading && (
          <Skeleton className="w-full h-64 rounded-lg mb-2 bg-white/10" />
        )}
        <div className={isLoading ? "hidden" : "block"}>
          <img
            src={imageUrl}
            alt="Uploaded satellite imagery"
            className="rounded-lg mb-2 max-w-full h-auto object-contain transition-opacity duration-300"
            loading="lazy"
            decoding="async"
            width={imageDimensions.width}
            height={imageDimensions.height}
            style={{
              maxHeight: "600px",
              aspectRatio:
                imageDimensions.width && imageDimensions.height
                  ? `${imageDimensions.width} / ${imageDimensions.height}`
                  : "auto",
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
          <AttentionHeatmap
            imageUrl={imageUrl}
            isActive={showAttentionHeatmap}
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.imageUrl === nextProps.imageUrl &&
      prevProps.isRoiMode === nextProps.isRoiMode &&
      prevProps.showAttentionHeatmap === nextProps.showAttentionHeatmap
    );
  }
);

MessageImage.displayName = "MessageImage";

export default MessageImage;
