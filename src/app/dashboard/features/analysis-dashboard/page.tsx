"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, BarChart3, Loader2, ImageIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AnalysisDashboard, { type AnalysisData } from "@/features/analysis-dashboard/components/AnalysisDashboard";
import { responseService } from "@/lib/response-service";

export default function AnalysisDashboardPage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

    const parseAIResponseToMetrics = (aiText: string): AnalysisData => {
        // Try to extract JSON from AI response
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed;
            }
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", e);
        }

        // Fallback: Parse text-based response intelligently
        const defaultData: AnalysisData = {
            summary: aiText.substring(0, 200) + "...",
            confidence: 75,
            landCover: {
                vegetation: 0,
                water: 0,
                urban: 0,
                bareSoil: 0,
                forest: 0,
                agriculture: 0
            },
            vegetation: {
                health: "Moderate",
                ndvi: 0.5,
                density: 50,
                types: []
            },
            waterBodies: {
                totalArea: 0,
                quality: "Moderate",
                sources: []
            },
            urban: {
                builtUpArea: 0,
                development: "Medium",
                infrastructure: []
            },
            environmental: {
                temperature: 20,
                humidity: 50,
                airQuality: "Moderate",
                cloudCover: 30
            },
            features: [],
            insights: [aiText],
            recommendations: ["Review the analysis for detailed insights"]
        };

        // Try to extract metrics from text using pattern matching
        const extractPercentage = (text: string, keywords: string[]): number => {
            for (const keyword of keywords) {
                const regex = new RegExp(keyword + `[^\\d]*(\\d+(?:\\.\\d+)?)\\s*%`, 'i');
                const match = text.match(regex);
                if (match) return parseFloat(match[1]);
            }
            return 0;
        };

        // Extract land cover percentages
        defaultData.landCover.vegetation = extractPercentage(aiText, ['vegetation', 'green', 'plant']);
        defaultData.landCover.water = extractPercentage(aiText, ['water', 'lake', 'river', 'ocean']);
        defaultData.landCover.urban = extractPercentage(aiText, ['urban', 'built', 'city', 'building']);
        defaultData.landCover.forest = extractPercentage(aiText, ['forest', 'tree']);
        defaultData.landCover.agriculture = extractPercentage(aiText, ['agriculture', 'farm', 'crop']);
        defaultData.landCover.bareSoil = extractPercentage(aiText, ['bare', 'soil', 'sand', 'desert']);

        return defaultData;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
            const reader = new FileReader();
            reader.onload = async (event) => {
                const imageUrl = event.target?.result as string;
                setUploadedImage(imageUrl);
                await analyzeImage(imageUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async (imageUrl: string) => {
        setIsAnalyzing(true);
        setAnalysisData(null);

        try {
            const result = await responseService.analyzeImage({
                imageUrls: [imageUrl],
                prompt: `Analyze this satellite/aerial imagery and provide comprehensive Earth Observation metrics.

Return your analysis in the following JSON format:
{
  "summary": "Brief overall summary of the scene",
  "confidence": <number 0-100>,
  "landCover": {
    "vegetation": <percentage 0-100>,
    "water": <percentage 0-100>,
    "urban": <percentage 0-100>,
    "bareSoil": <percentage 0-100>,
    "forest": <percentage 0-100>,
    "agriculture": <percentage 0-100>
  },
  "vegetation": {
    "health": "Excellent|Good|Moderate|Poor|Critical",
    "ndvi": <value -1 to 1>,
    "density": <percentage 0-100>,
    "types": ["Forest", "Grassland", "Cropland", etc.]
  },
  "waterBodies": {
    "totalArea": <percentage 0-100>,
    "quality": "Clean|Moderate|Polluted",
    "sources": ["River", "Lake", "Ocean", etc.]
  },
  "urban": {
    "builtUpArea": <percentage 0-100>,
    "development": "High|Medium|Low",
    "infrastructure": ["Roads", "Buildings", "Industrial", etc.]
  },
  "environmental": {
    "temperature": <estimated celsius>,
    "humidity": <percentage 0-100>,
    "airQuality": "Good|Moderate|Poor",
    "cloudCover": <percentage 0-100>
  },
  "features": [
    {
      "type": "Feature name",
      "description": "Description",
      "severity": "High|Medium|Low"
    }
  ],
  "insights": ["Key insight 1", "Key insight 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "coordinates": {
    "latitude": <number>,
    "longitude": <number>,
    "location": "Place name if identifiable"
  }
}

Provide accurate quantitative metrics based on visual analysis of land cover, vegetation health, water presence, urban development, and environmental conditions.`,
                metadata: {
                    feature: "metrics-dashboard"
                }
            });

            const parsedData = parseAIResponseToMetrics(result.text);
            setAnalysisData(parsedData);
            toast.success("Analysis complete!");

        } catch (error) {
            console.error("Analysis error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to analyze image");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                                Metrics Dashboard
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Comprehensive Earth Observation analytics and metrics
                            </p>
                        </div>
                    </div>
                </div>

                {!uploadedImage ? (
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardContent className="pt-12 pb-12">
                                <div className="text-center">
                                    <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl mb-6">
                                        <ImageIcon className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                                        Upload Satellite Image
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                        Upload Earth Observation imagery for comprehensive metrics analysis
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
                    <div className="space-y-6">
                        {/* Image Preview */}
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardContent className="pt-6">
                                <div className="flex gap-4 items-start flex-wrap">
                                    <img 
                                        src={uploadedImage} 
                                        alt="Analyzed" 
                                        className="w-64 h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setUploadedImage(null);
                                            setAnalysisData(null);
                                        }}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload New Image
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Loading State */}
                        {isAnalyzing && (
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardContent className="pt-12 pb-12">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                                        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                                            Analyzing Metrics...
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Extracting land cover, vegetation, water, and environmental data
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Analysis Dashboard */}
                        {analysisData && !isAnalyzing && (
                            <AnalysisDashboard data={analysisData} isLoading={false} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
