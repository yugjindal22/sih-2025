import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, AlertCircle } from "lucide-react";

interface ImagePreviewProps {
  imageUrl: string;
  altText?: string;
  onRemove: () => void;
  size?: "small" | "medium" | "large";
}

/**
 * Optimized preview component for uploaded images with loading states and error handling
 */
const ImagePreview = memo(
  ({
    imageUrl,
    altText = "Preview",
    onRemove,
    size = "small",
  }: ImagePreviewProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const sizeClasses = {
      small: "h-16 w-16",
      medium: "h-24 w-24",
      large: "h-32 w-32",
    };

    if (hasError) {
      return (
        <div className="mb-2 relative inline-block">
          <div
            className={`${sizeClasses[size]} rounded-lg border border-red-500/20 bg-red-500/10 flex items-center justify-center`}
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
            onClick={onRemove}
            title="Remove image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="mb-2 relative inline-block group">
        {isLoading && (
          <Skeleton className={`${sizeClasses[size]} rounded-lg bg-white/10`} />
        )}
        <img
          src={imageUrl}
          alt={altText}
          className={`${
            sizeClasses[size]
          } rounded-lg border border-white/20 object-cover transition-all group-hover:border-white/40 ${
            isLoading ? "hidden" : "block"
          }`}
          loading="eager"
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
        <Button
          size="icon"
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
          title="Remove image"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Prevent re-renders if props haven't changed
    return (
      prevProps.imageUrl === nextProps.imageUrl &&
      prevProps.altText === nextProps.altText &&
      prevProps.size === nextProps.size
    );
  }
);

ImagePreview.displayName = "ImagePreview";

export default ImagePreview;
