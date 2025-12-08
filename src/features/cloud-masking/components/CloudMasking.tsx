"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Cloud,
  CloudOff,
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Gauge,
  Clock,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cloudMaskService, type CloudMaskResponse } from "@/lib/cloud-mask-service";

interface CloudMaskingProps {
  image: {
    url: string;
    label: string;
  };
  onClose: () => void;
}

const CloudMasking = ({ image, onClose }: CloudMaskingProps) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<CloudMaskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(0.5);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Perform cloud masking
  useEffect(() => {
    const performCloudMasking = async () => {
      setIsProcessing(true);
      setError(null);

      try {
        // Check service health first
        const health = await cloudMaskService.checkServiceHealth();
        if (!health.available) {
          throw new Error(
            `Cloud masking service is not available. ${health.message || ""}\n\nPlease ensure the backend is running and the URL is configured correctly in Settings.`
          );
        }

        // Extract base64 image data
        const base64Image = image.url.includes(",") 
          ? image.url.split(",")[1] 
          : image.url;

        // Call cloud masking service
        const response = await cloudMaskService.maskClouds({
          image: base64Image,
          format: "base64",
          threshold,
          metadata: {
            filename: image.label,
            timestamp: new Date().toISOString(),
          },
        });

        setResult(response);
        toast.success(`Cloud masking complete! ${response.cloudCoverage.toFixed(1)}% cloud coverage detected`);
      } catch (err: any) {
        console.error("Cloud masking error:", err);
        const errorMessage = err.message || "Failed to process cloud masking";
        setError(errorMessage);
        toast.error("Cloud masking failed", {
          description: errorMessage.split("\n")[0],
        });
      } finally {
        setIsProcessing(false);
      }
    };

    performCloudMasking();
  }, [image, threshold]);

  const handleReprocess = () => {
    setIsProcessing(true);
    setError(null);
    // Trigger re-processing by updating a dummy state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleDownload = () => {
    if (!result?.maskedImage) return;

    try {
      // Create download link
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${result.maskedImage}`;
      link.download = `cloud_masked_${image.label}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Masked image downloaded!");
    } catch (err) {
      toast.error("Failed to download image");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const getCloudCoverageColor = (coverage: number) => {
    if (coverage < 10) return "text-green-500";
    if (coverage < 30) return "text-blue-500";
    if (coverage < 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getCloudCoverageBg = (coverage: number) => {
    if (coverage < 10) return "bg-green-500/10 border-green-500/30";
    if (coverage < 30) return "bg-blue-500/10 border-blue-500/30";
    if (coverage < 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const getCloudCoverageLabel = (coverage: number) => {
    if (coverage < 10) return "Clear";
    if (coverage < 30) return "Partly Cloudy";
    if (coverage < 60) return "Mostly Cloudy";
    return "Overcast";
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background animate-fade-in">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-xl opacity-20 animate-pulse" />
              <div className="relative bg-primary p-3 rounded-xl shadow-lg">
                <CloudOff className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Cloud Masking
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Automated cloud detection and removal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  {showComparison ? "Split View" : "Side by Side"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid lg:grid-cols-3 gap-4 sm:gap-6 overflow-hidden min-h-0">
          {/* Left: Image Display */}
          <div className="lg:col-span-2 flex flex-col gap-3 sm:gap-4 min-h-0">
            {/* Image Info */}
            <Card className="bg-card backdrop-blur-sm border-border shadow-sm p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{image.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {isProcessing ? "Processing..." : result ? "Cloud masking complete" : "Ready"}
                    </p>
                  </div>
                </div>
                {result && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOriginal(!showOriginal)}
                    >
                      {showOriginal ? "Show Masked" : "Show Original"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Image Viewer */}
            <Card className="bg-card backdrop-blur-sm border-border shadow-sm flex-1 min-h-0 overflow-hidden">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-2xl opacity-40 animate-pulse" />
                    <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      Processing Cloud Mask...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Detecting and masking clouds in the image
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <AlertCircle className="w-16 h-16 text-red-500" />
                  <div className="text-center max-w-md">
                    <h3 className="text-lg font-semibold mb-2 text-red-500">
                      Processing Failed
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {error}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReprocess} variant="outline">
                      Try Again
                    </Button>
                    <Button onClick={onClose} variant="ghost">
                      Close
                    </Button>
                  </div>
                </div>
              ) : result ? (
                showComparison ? (
                  <div className="grid grid-cols-2 gap-2 w-full h-full p-4">
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={image.url}
                        alt="Original"
                        className="w-full h-full object-contain bg-muted"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-blue-500/80 text-white">Original</Badge>
                      </div>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={`data:image/png;base64,${result.maskedImage}`}
                        alt="Masked"
                        className="w-full h-full object-contain bg-muted"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-green-500/80 text-white">Cloud Masked</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative w-full h-full overflow-hidden rounded-lg cursor-ew-resize group"
                    onMouseMove={handleMouseMove}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    {/* Masked Image (base layer) */}
                    <img
                      src={showOriginal ? image.url : `data:image/png;base64,${result.maskedImage}`}
                      alt={showOriginal ? "Original" : "Masked"}
                      className="absolute inset-0 w-full h-full object-contain bg-muted"
                    />

                    {!showOriginal && (
                      <>
                        {/* Original Image (clipped) */}
                        <div
                          className="absolute inset-0 overflow-hidden transition-all"
                          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                        >
                          <img
                            src={image.url}
                            alt="Original"
                            className="w-full h-full object-contain bg-muted"
                          />
                        </div>

                        {/* Slider */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 shadow-lg cursor-ew-resize transition-all group-hover:w-2"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
                            <Layers className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Labels */}
                        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          Original (Drag Right →)
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          Masked (← Drag Left)
                        </div>
                      </>
                    )}
                  </div>
                )
              ) : null}
            </Card>
          </div>

          {/* Right: Results & Info */}
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
            {isProcessing ? (
              <Card className="bg-card backdrop-blur-sm border-border shadow-sm p-6 flex-1">
                <div className="flex flex-col items-center justify-center gap-4 h-full">
                  <Progress value={66} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Analyzing image and detecting clouds...
                  </p>
                </div>
              </Card>
            ) : result ? (
              <>
                {/* Cloud Coverage Summary */}
                <Card className={`bg-card backdrop-blur-sm border ${getCloudCoverageBg(result.cloudCoverage)} shadow-sm p-4 flex-shrink-0`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <Cloud className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">Cloud Coverage</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-3xl font-bold ${getCloudCoverageColor(result.cloudCoverage)}`}>
                          {result.cloudCoverage.toFixed(1)}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getCloudCoverageLabel(result.cloudCoverage)}
                        </Badge>
                      </div>
                      <Progress value={result.cloudCoverage} className="h-2" />
                    </div>
                  </div>
                </Card>

                {/* Processing Stats */}
                <Card className="bg-card backdrop-blur-sm border-border shadow-sm p-4 flex-shrink-0">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Processing Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Processing Time</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {(result.processingTime / 1000).toFixed(2)}s
                      </span>
                    </div>

                    {result.maskData && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Cloud Pixels</span>
                          </div>
                          <span className="text-sm font-semibold">
                            {result.maskData.cloudPixels.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Total Pixels</span>
                          </div>
                          <span className="text-sm font-semibold">
                            {result.maskData.totalPixels.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}

                    {result.metadata && (
                      <>
                        {result.metadata.originalSize && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Image Size</span>
                            <span className="text-sm font-semibold">
                              {result.metadata.originalSize.width} × {result.metadata.originalSize.height}
                            </span>
                          </div>
                        )}

                        {result.metadata.detectionMethod && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Method</span>
                            <Badge variant="outline" className="text-xs">
                              {result.metadata.detectionMethod}
                            </Badge>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>

                {/* Info & Tips */}
                <Card className="bg-card backdrop-blur-sm border-border shadow-sm flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-border flex-shrink-0">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Information
                    </h3>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4 space-y-3">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                              Cloud Masking Complete
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Clouds have been detected and masked from the satellite image.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold mb-2">What is Cloud Masking?</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Cloud masking is the process of identifying and removing clouds from satellite imagery. 
                          This improves the quality of Earth observation data by revealing the surface beneath.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold mb-2">How to Use</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Drag the slider to compare original vs masked images</li>
                          <li>• Toggle "Show Original" to view the source image</li>
                          <li>• Download the masked image for further analysis</li>
                          <li>• Use "Side by Side" for detailed comparison</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold mb-2">Coverage Levels</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-muted-foreground">Clear (0-10%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-muted-foreground">Partly Cloudy (10-30%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="text-muted-foreground">Mostly Cloudy (30-60%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-muted-foreground">Overcast (60%+)</span>
                          </div>
                        </div>
                      </div>

                      {result.cloudCoverage > 70 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                                High Cloud Coverage
                              </p>
                              <p className="text-xs text-muted-foreground">
                                This image has significant cloud coverage. Consider using images 
                                from different dates for better surface visibility.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </>
            ) : error ? (
              <Card className="bg-card backdrop-blur-sm border-border shadow-sm p-6 flex-1">
                <div className="flex flex-col items-center justify-center gap-4 h-full">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <div className="text-center">
                    <h3 className="text-sm font-semibold mb-2">Error Occurred</h3>
                    <p className="text-xs text-muted-foreground">
                      Unable to process cloud masking
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudMasking;
