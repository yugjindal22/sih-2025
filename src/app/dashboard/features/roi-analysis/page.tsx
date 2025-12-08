"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ArrowLeft, Crosshair, Loader2, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ROISelector from "@/features/roi-analysis/components/ROISelector";
import { responseService } from "@/lib/response-service";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ROI {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function ROIAnalysisPage() {
    const router = useRouter();
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [roiMode, setRoiMode] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
                setAnalysisResult(null);
                setCroppedImageUrl(null);
                toast.success("Image uploaded. Draw a region to analyze.");
            };
            reader.readAsDataURL(file);
        }
    };

    const cropImageToROI = async (imageUrl: string, roi: ROI): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    reject(new Error("Canvas not available"));
                    return;
                }

                // Calculate actual pixel coordinates from percentages
                const cropX = (roi.x / 100) * img.width;
                const cropY = (roi.y / 100) * img.height;
                const cropWidth = (roi.width / 100) * img.width;
                const cropHeight = (roi.height / 100) * img.height;

                // Set canvas size to cropped region
                canvas.width = cropWidth;
                canvas.height = cropHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Draw the cropped region
                ctx.drawImage(
                    img,
                    cropX, cropY, cropWidth, cropHeight,
                    0, 0, cropWidth, cropHeight
                );

                // Convert to base64
                const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
                resolve(croppedDataUrl);
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = imageUrl;
        });
    };

    const handleROISelect = async (roi: ROI | null, imageUrl?: string) => {
        if (!roi || !imageUrl) return;

        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            // Crop the image to the selected ROI
            const croppedImage = await cropImageToROI(imageUrl, roi);
            setCroppedImageUrl(croppedImage);

            // Analyze the cropped region with the backend
            const result = await responseService.analyzeImage({
                imageUrls: [croppedImage],
                prompt: `Analyze this region of interest from satellite/aerial imagery. Provide detailed analysis of:
1. Land cover and vegetation types
2. Key features and objects visible
3. Environmental characteristics
4. Any notable patterns or anomalies
5. Potential use or classification of this area

Be specific and detailed in your analysis.`,
                metadata: {
                    feature: "roi-analysis",
                    roiCoordinates: roi,
                },
            });

            setAnalysisResult(result.text);
            toast.success("ROI analysis complete!");
        } catch (error) {
            console.error("ROI analysis error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to analyze ROI");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hidden canvas for image cropping */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div className="container mx-auto px-4 py-12">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard")}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                            <Crosshair className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                                Region of Interest Analysis
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Select and analyze specific regions in satellite imagery
                            </p>
                        </div>
                    </div>
                </div>

                {!uploadedImage ? (
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardContent className="pt-12 pb-12">
                                <div className="text-center">
                                    <div className="inline-flex p-6 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 rounded-2xl mb-6">
                                        <ImageIcon className="w-16 h-16 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                                        Upload Satellite Image
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                        Upload an Earth Observation image to begin focused regional analysis
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload">
                                        <Button asChild size="lg">
                                            <span>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Choose Image
                                            </span>
                                        </Button>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Image Selection */}
                        <div className="space-y-4">
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-900 dark:text-white">
                                        Select Region of Interest
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Click and drag to select the area you want to analyze
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ROISelector
                                        imageUrl={uploadedImage}
                                        onROISelect={handleROISelect}
                                        isActive={roiMode}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-sm text-slate-900 dark:text-white">
                                        Instructions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Click and drag on the image to draw a selection box</li>
                                        <li>Click the <strong className="text-green-600">"Analyze ROI"</strong> button to process</li>
                                        <li>Use <strong>"Clear"</strong> to reset and select a different region</li>
                                        <li>Upload a new image anytime to start over</li>
                                    </ol>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setUploadedImage(null);
                                            setRoiMode(false);
                                            setAnalysisResult(null);
                                            setCroppedImageUrl(null);
                                        }}
                                        className="mt-4 w-full"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload New Image
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Analysis Results */}
                        <div className="space-y-4">
                            {isAnalyzing && (
                                <Card className="border-slate-200 dark:border-slate-800">
                                    <CardContent className="pt-12 pb-12">
                                        <div className="text-center">
                                            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                                            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                                                Analyzing Region...
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Processing the selected area with AI vision model
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {croppedImageUrl && !isAnalyzing && (
                                <Card className="border-slate-200 dark:border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-slate-900 dark:text-white">
                                            Selected Region
                                        </CardTitle>
                                        <CardDescription className="text-slate-600 dark:text-slate-400">
                                            Cropped area sent for analysis
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <img 
                                            src={croppedImageUrl} 
                                            alt="Cropped ROI" 
                                            className="w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {analysisResult && !isAnalyzing && (
                                <Card className="border-slate-200 dark:border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-slate-900 dark:text-white">
                                            Analysis Results
                                        </CardTitle>
                                        <CardDescription className="text-slate-600 dark:text-slate-400">
                                            AI-powered analysis of the selected region
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[500px] pr-4">
                                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                                <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                                                    {analysisResult}
                                                </div>
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            )}

                            {!isAnalyzing && !analysisResult && (
                                <Card className="border-slate-200 dark:border-slate-800 border-dashed">
                                    <CardContent className="pt-12 pb-12">
                                        <div className="text-center text-slate-500 dark:text-slate-400">
                                            <Crosshair className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-sm">
                                                Select a region on the image to begin analysis
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
