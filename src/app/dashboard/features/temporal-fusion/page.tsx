"use client";

import { useState } from "react";
import TemporalFusion from "@/features/temporal-fusion/components/TemporalFusion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, ArrowLeft, Calendar, Info, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { extractMetadataFromFilename } from "@/lib/metadata-utils";
import type { TemporalImage } from "@/features/temporal-fusion/components/TemporalFusion";

export default function TemporalFusionPage() {
  const router = useRouter();
  const [temporalImages, setTemporalImages] = useState<TemporalImage[]>([]);
  const [fusionActive, setFusionActive] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ url: string; label: string } | null>(null);
  const [dateInput, setDateInput] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        
        // Try to extract date from filename
        const metadata = extractMetadataFromFilename(file.name);
        
        if (metadata.date) {
          // Date found in filename
          addImageToTimeline(imageUrl, file.name, metadata.date);
        } else {
          // Show date input dialog
          setPendingImage({ url: imageUrl, label: file.name });
          setShowDateInput(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addImageToTimeline = (url: string, label: string, date: string) => {
    const timestamp = new Date(date).getTime();
    
    if (isNaN(timestamp)) {
      toast.error("Invalid date format. Use YYYY-MM-DD");
      return;
    }

    const newImage: TemporalImage = {
      url,
      label,
      date,
      timestamp,
    };

    setTemporalImages((prev) => [...prev, newImage]);
    toast.success(`Image added to timeline (${date})`);
    
    // Clear pending image and date input
    setPendingImage(null);
    setShowDateInput(false);
    setDateInput("");
  };

  const handleDateSubmit = () => {
    if (pendingImage && dateInput) {
      addImageToTimeline(pendingImage.url, pendingImage.label, dateInput);
    }
  };

  const removeImage = (index: number) => {
    setTemporalImages((prev) => prev.filter((_, idx) => idx !== index));
    toast.info("Image removed from timeline");
  };

  const startAnalysis = () => {
    if (temporalImages.length < 3) {
      toast.error("Please upload at least 3 images for temporal analysis");
      return;
    }
    setFusionActive(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {fusionActive && temporalImages.length >= 3 ? (
        <TemporalFusion
          images={temporalImages}
          onClose={() => {
            setFusionActive(false);
            setTemporalImages([]);
          }}
        />
      ) : (
        <div className="container mx-auto px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                <Calendar className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Temporal Fusion</h1>
              <p className="text-muted-foreground mb-4">
                Multi-temporal data fusion for time-series analysis and trend detection
              </p>
              <Badge variant="outline" className="text-xs">
                Upload 3+ images with dates for temporal analysis
              </Badge>
            </div>

            {/* Info Card */}
            <Card className="p-4 mb-6 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-2">How it works</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Upload satellite/aerial images from different time periods (minimum 3)</li>
                    <li>• Each image must have an associated date (extracted from filename or manually entered)</li>
                    <li>• AI will analyze temporal patterns, trends, and anomalies</li>
                    <li>• View time-series visualizations and predictive insights</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Upload Area */}
            <Card className="p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors mb-6">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Upload temporal images (minimum 3 required)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="temporal-image-upload"
              />
              <label htmlFor="temporal-image-upload" className="block text-center">
                <Button asChild>
                  <span>Choose Image</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {temporalImages.length} of 3+ images uploaded
              </p>
            </Card>

            {/* Date Input Dialog */}
            {showDateInput && pendingImage && (
              <Card className="p-6 mb-6 border-primary">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Enter Image Date</h3>
                    <p className="text-sm text-muted-foreground">
                      {pendingImage.label}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDateInput(false);
                      setPendingImage(null);
                      setDateInput("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="YYYY-MM-DD"
                  />
                  <Button onClick={handleDateSubmit} disabled={!dateInput}>
                    Add to Timeline
                  </Button>
                </div>
              </Card>
            )}

            {/* Timeline Preview */}
            {temporalImages.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Timeline Preview</h3>
                <div className="space-y-3">
                  {temporalImages
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((img, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-16 h-16 object-cover rounded border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{img.label}</p>
                          <p className="text-xs text-muted-foreground">{img.date}</p>
                        </div>
                        <Badge variant="outline">{idx + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={startAnalysis}
                  disabled={temporalImages.length < 3}
                >
                  {temporalImages.length < 3
                    ? `Upload ${3 - temporalImages.length} more image${3 - temporalImages.length === 1 ? "" : "s"}`
                    : "Start Temporal Analysis"}
                </Button>
              </Card>
            )}

            {/* Empty State */}
            {temporalImages.length === 0 && !showDateInput && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  No images uploaded yet. Start by uploading your first temporal image.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
