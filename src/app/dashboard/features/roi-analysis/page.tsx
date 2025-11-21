"use client";

// Copied from prototype - ROI Analysis feature
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ROISelector from "@/features/roi-analysis/components/ROISelector";

export default function ROIAnalysisPage() {
    const router = useRouter();
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [roiMode, setRoiMode] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string);
                setRoiMode(true);
                toast.success("Image uploaded. Draw a region to analyze.");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleROISelect = (roi: any) => {
        if (roi) {
            toast.success("ROI selected! Analysis would be performed here.");
            // In full implementation, this would trigger analysis
        }
    };

    return (
        <div className="min-h-screen bg-background">
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
                    <h1 className="text-4xl font-bold mb-4">ROI Analysis</h1>
                    <p className="text-muted-foreground mb-8">
                        Upload an image and select a region of interest for focused analysis
                    </p>

                    {!uploadedImage ? (
                        <div className="p-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors text-center">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-4">
                                Upload satellite image
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload">
                                <Button asChild>
                                    <span>Choose Image</span>
                                </Button>
                            </label>
                        </div>
                    ) : (
                        <ROISelector
                            imageUrl={uploadedImage}
                            onROISelect={handleROISelect}
                            isActive={roiMode}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
