"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cloud,
  CloudOff,
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileArchive,
  Image as ImageIcon,
  Activity,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cloudMaskService, type CloudMaskResponse } from "@/lib/cloud-mask-service";

interface CloudMaskingProps {
  safeFile: File;
  onClose: () => void;
}

const CloudMasking = ({ safeFile, onClose }: CloudMaskingProps) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<CloudMaskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<"clean_rgb" | "cloud_mask" | "cloud_prob">("clean_rgb");

  // Perform cloud masking on SAFE file
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

        // Call cloud masking service with SAFE file
        const response = await cloudMaskService.maskClouds({
          safeZip: safeFile,
          threshold: 0.4, // Default s2cloudless threshold
        });

        setResult(response);
        toast.success(`Cloud masking complete! ${response.cloud_percent.toFixed(1)}% cloud coverage detected`);
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
  }, [safeFile]);

  const handleDownload = (imageType: "clean_rgb" | "cloud_mask" | "cloud_prob") => {
    if (!result) return;

    const imageData = result[imageType];
    if (!imageData) return;

    try {
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `${safeFile.name.replace('.SAFE.zip', '')}_${imageType}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${imageType.replace('_', ' ')} downloaded successfully`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
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
                Cloud Masking - Sentinel-2
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Automated cloud detection with s2cloudless
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(selectedView)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
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
            {/* File Info */}
            <Card className="bg-card backdrop-blur-sm border-border shadow-sm p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileArchive className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{safeFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isProcessing ? "Processing..." : result ? "Cloud masking complete" : "Ready"}
                    </p>
                  </div>
                </div>
                {result && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Processed
                  </Badge>
                )}
              </div>
            </Card>

            {/* Image Viewer with Tabs */}
            <Card className="bg-card backdrop-blur-sm border-border shadow-sm flex-1 min-h-0 overflow-hidden">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-2xl opacity-40 animate-pulse" />
                    <Loader2 className="w-16 h-16 animate-spin text-primary relative" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      Processing SAFE File...
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Extracting bands, running s2cloudless model, and generating outputs
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
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                </div>
              ) : result ? (
                <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as typeof selectedView)} className="w-full h-full flex flex-col">
                  <div className="border-b border-border px-4 pt-4 flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="clean_rgb" className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Clean RGB
                      </TabsTrigger>
                      <TabsTrigger value="cloud_mask" className="flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        Cloud Mask
                      </TabsTrigger>
                      <TabsTrigger value="cloud_prob" className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Probability
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4 h-full">
                      <TabsContent value="clean_rgb" className="m-0 h-full data-[state=active]:flex flex-col">
                        <div className="relative flex-1 rounded-lg overflow-hidden border border-border bg-muted">
                          <img
                            src={result.clean_rgb}
                            alt="Cloud-removed RGB"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          RGB composite with clouds removed
                        </p>
                      </TabsContent>

                      <TabsContent value="cloud_mask" className="m-0 h-full data-[state=active]:flex flex-col">
                        <div className="relative flex-1 rounded-lg overflow-hidden border border-border bg-black">
                          <img
                            src={result.cloud_mask}
                            alt="Binary cloud mask"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Binary mask: White = Cloud, Black = Clear
                        </p>
                      </TabsContent>

                      <TabsContent value="cloud_prob" className="m-0 h-full data-[state=active]:flex flex-col">
                        <div className="relative flex-1 rounded-lg overflow-hidden border border-border bg-muted">
                          <img
                            src={result.cloud_prob}
                            alt="Cloud probability heatmap"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Probability heatmap: Brighter = Higher cloud likelihood
                        </p>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </Tabs>
              ) : null}
            </Card>
          </div>

          {/* Right: Results & Info */}
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
            {isProcessing ? (
              <Card className="bg-card backdrop-blur-sm border-border shadow-sm p-6 flex-1">
                <div className="flex flex-col items-center justify-center gap-4 h-full">
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Unzipping SAFE...</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Loading bands...</span>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                    <div className="flex items-center justify-between text-sm opacity-50">
                      <span className="text-muted-foreground">Running s2cloudless...</span>
                    </div>
                    <div className="flex items-center justify-between text-sm opacity-30">
                      <span className="text-muted-foreground">Generating outputs...</span>
                    </div>
                  </div>
                </div>
              </Card>
            ) : result ? (
              <>
                {/* Cloud Coverage Summary */}
                <Card className={`bg-card backdrop-blur-sm border ${getCloudCoverageBg(result.cloud_percent)} shadow-sm p-4 flex-shrink-0`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <Cloud className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">Cloud Coverage</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-3xl font-bold ${getCloudCoverageColor(result.cloud_percent)}`}>
                          {result.cloud_percent.toFixed(1)}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getCloudCoverageLabel(result.cloud_percent)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Processing Stats */}
                <Card className="bg-card backdrop-blur-sm border-border shadow-sm p-4 flex-shrink-0">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Processing Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Processing Time</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {(result.processingTimeMs / 1000).toFixed(2)}s
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">File Size</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {(safeFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Model</span>
                      <Badge variant="outline" className="text-xs">
                        s2cloudless
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Bands Used</span>
                      <Badge variant="outline" className="text-xs">
                        B02, B03, B04, B08
                      </Badge>
                    </div>
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
                              Processing Complete
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Three outputs generated: clean RGB, cloud mask, and probability map
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold mb-2">Output Layers</h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium text-foreground">Clean RGB:</span> Cloud-removed composite for visualization
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Cloud Mask:</span> Binary mask (255=cloud, 0=clear)
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Probability:</span> Likelihood heatmap for analysis
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold mb-2">Sentinel-2 L2A Format</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          SAFE format contains Bottom-of-Atmosphere reflectance at 10m resolution. 
                          RGB bands (B02, B03, B04) plus NIR (B08) are used by s2cloudless model.
                        </p>
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

                      {result.cloud_percent > 70 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                                High Cloud Coverage
                              </p>
                              <p className="text-xs text-muted-foreground">
                                This scene has significant cloud coverage. Consider using images 
                                from different acquisition dates for better surface visibility.
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
