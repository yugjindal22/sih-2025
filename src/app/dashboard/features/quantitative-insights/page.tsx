'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Upload, TrendingUp, BarChart3, PieChart, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { responseService } from "@/lib/response-service";

interface QuantitativeMetric {
  category: string;
  name: string;
  value: number;
  unit: string;
  confidence?: number;
  description?: string;
}

interface MetricCategory {
  name: string;
  icon: React.ReactNode;
  metrics: QuantitativeMetric[];
  color: string;
}

export default function QuantitativeInsightsPage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [metrics, setMetrics] = useState<MetricCategory[]>([]);
    const [summary, setSummary] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target?.result as string);
                setMetrics([]);
                setSummary("");
            };
            reader.readAsDataURL(file);
        }
    };

    const parseQuantitativeMetrics = (aiResponse: string): { metrics: MetricCategory[], summary: string } => {
        // Try to extract JSON first
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.metrics && Array.isArray(parsed.metrics)) {
                    const categorized = categorizeMetrics(parsed.metrics);
                    return {
                        metrics: categorized,
                        summary: parsed.summary || "Quantitative analysis completed"
                    };
                }
            } catch (e) {
                console.error("JSON parsing failed:", e);
            }
        }

        // Fallback: Extract metrics from text using patterns
        const extractedMetrics: QuantitativeMetric[] = [];
        
        // Pattern: "metric_name: value unit" or "metric_name is value unit"
        const patterns = [
            /(\w+(?:\s+\w+)*?):\s*([\d.]+)\s*(%|km²|km|hectares|m|meters|degrees?|°C|°F|ppm|kg|tons?|mm|index)/gi,
            /(\w+(?:\s+\w+)*?)\s+(?:is|measures?|equals?|approximately)\s+([\d.]+)\s*(%|km²|km|hectares|m|meters|degrees?|°C|°F|ppm|kg|tons?|mm|index)/gi,
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(aiResponse)) !== null) {
                extractedMetrics.push({
                    category: "General",
                    name: match[1].trim(),
                    value: parseFloat(match[2]),
                    unit: match[3],
                });
            }
        });

        const categorized = categorizeMetrics(extractedMetrics);
        
        // If no metrics found, return mock data
        if (categorized.length === 0) {
            return {
                metrics: getMockMetrics(),
                summary: "Analysis completed. Displaying sample metrics."
            };
        }

        return {
            metrics: categorized,
            summary: "Metrics extracted from AI analysis"
        };
    };

    const categorizeMetrics = (metrics: QuantitativeMetric[]): MetricCategory[] => {
        const categories: { [key: string]: QuantitativeMetric[] } = {
            "Land Cover": [],
            "Vegetation": [],
            "Water Bodies": [],
            "Urban Development": [],
            "Environmental": [],
            "Geospatial": []
        };

        metrics.forEach(metric => {
            const name = metric.name.toLowerCase();
            const unit = metric.unit.toLowerCase();
            
            if (name.includes('vegetation') || name.includes('forest') || name.includes('tree')) {
                categories["Vegetation"].push({ ...metric, category: "Vegetation" });
            } else if (name.includes('water') || name.includes('lake') || name.includes('river') || name.includes('ocean')) {
                categories["Water Bodies"].push({ ...metric, category: "Water Bodies" });
            } else if (name.includes('urban') || name.includes('building') || name.includes('road') || name.includes('infrastructure')) {
                categories["Urban Development"].push({ ...metric, category: "Urban Development" });
            } else if (name.includes('temperature') || name.includes('pollution') || name.includes('emission') || name.includes('quality')) {
                categories["Environmental"].push({ ...metric, category: "Environmental" });
            } else if (name.includes('area') || name.includes('distance') || name.includes('elevation') || name.includes('coordinate')) {
                categories["Geospatial"].push({ ...metric, category: "Geospatial" });
            } else {
                categories["Land Cover"].push({ ...metric, category: "Land Cover" });
            }
        });

        const result: MetricCategory[] = [];
        const icons = {
            "Land Cover": <PieChart className="w-5 h-5" />,
            "Vegetation": <TrendingUp className="w-5 h-5" />,
            "Water Bodies": <Activity className="w-5 h-5" />,
            "Urban Development": <BarChart3 className="w-5 h-5" />,
            "Environmental": <Activity className="w-5 h-5" />,
            "Geospatial": <BarChart3 className="w-5 h-5" />
        };

        const colors = {
            "Land Cover": "text-amber-500",
            "Vegetation": "text-green-500",
            "Water Bodies": "text-blue-500",
            "Urban Development": "text-purple-500",
            "Environmental": "text-red-500",
            "Geospatial": "text-cyan-500"
        };

        Object.entries(categories).forEach(([name, metrics]) => {
            if (metrics.length > 0) {
                result.push({
                    name,
                    icon: icons[name as keyof typeof icons],
                    metrics,
                    color: colors[name as keyof typeof colors]
                });
            }
        });

        return result;
    };

    const getMockMetrics = (): MetricCategory[] => {
        return [
            {
                name: "Land Cover",
                icon: <PieChart className="w-5 h-5" />,
                color: "text-amber-500",
                metrics: [
                    { category: "Land Cover", name: "Total Area", value: 245.7, unit: "km²", confidence: 95 },
                    { category: "Land Cover", name: "Forest Coverage", value: 68.3, unit: "%", confidence: 92 },
                    { category: "Land Cover", name: "Agricultural Land", value: 87.4, unit: "km²", confidence: 88 }
                ]
            },
            {
                name: "Vegetation",
                icon: <TrendingUp className="w-5 h-5" />,
                color: "text-green-500",
                metrics: [
                    { category: "Vegetation", name: "Vegetation Density", value: 84.5, unit: "%", confidence: 91 },
                    { category: "Vegetation", name: "Canopy Height", value: 18.3, unit: "m", confidence: 87 }
                ]
            },
            {
                name: "Water Bodies",
                icon: <Activity className="w-5 h-5" />,
                color: "text-blue-500",
                metrics: [
                    { category: "Water Bodies", name: "Water Surface Area", value: 32.8, unit: "km²", confidence: 94 },
                    { category: "Water Bodies", name: "Water Quality Index", value: 7.6, unit: "index", confidence: 85 },
                    { category: "Water Bodies", name: "Turbidity Level", value: 12.4, unit: "NTU", confidence: 89 }
                ]
            },
            {
                name: "Urban Development",
                icon: <BarChart3 className="w-5 h-5" />,
                color: "text-purple-500",
                metrics: [
                    { category: "Urban Development", name: "Built-up Area", value: 45.2, unit: "km²", confidence: 93 },
                    { category: "Urban Development", name: "Urbanization Rate", value: 18.4, unit: "%", confidence: 90 },
                    { category: "Urban Development", name: "Road Network", value: 234.6, unit: "km", confidence: 86 }
                ]
            }
        ];
    };

    const analyzeQuantitativeMetrics = async () => {
        if (!selectedImage) return;

        setAnalyzing(true);
        try {
            const prompt = `Analyze this satellite/aerial image and extract ALL quantitative metrics with numerical values.

CRITICAL: Respond with a JSON object in this exact format:
{
  "summary": "Brief overview of quantitative findings",
  "metrics": [
    {
      "category": "Land Cover" | "Vegetation" | "Water Bodies" | "Urban Development" | "Environmental" | "Geospatial",
      "name": "Metric Name",
      "value": numeric_value,
      "unit": "km²" | "%" | "m" | "index" | etc.,
      "confidence": 0-100,
      "description": "Brief explanation"
    }
  ]
}

Extract metrics for:
1. Land Cover: Total area, forest coverage, agricultural land, barren land percentages
2. Vegetation: Vegetation density, canopy height, greenness index
3. Water Bodies: Water surface area, water quality indicators, turbidity levels
4. Urban Development: Built-up area, urbanization rate, road network length, building density
5. Environmental: Temperature readings, pollution levels, air quality index
6. Geospatial: Coordinates, elevation, slope angles, distances

Provide at least 10-15 quantitative metrics with precise numerical values and appropriate units.`;

            const response = await responseService.analyzeImage({
                imageUrls: [selectedImage],
                prompt
            });
            const { metrics: parsedMetrics, summary: parsedSummary } = parseQuantitativeMetrics(response.text);
            
            setMetrics(parsedMetrics);
            setSummary(parsedSummary);
        } catch (error) {
            console.error("Analysis error:", error);
            setMetrics(getMockMetrics());
            setSummary("Error during analysis. Displaying sample metrics.");
        } finally {
            setAnalyzing(false);
        }
    };

    const getTotalMetricsCount = () => {
        return metrics.reduce((sum, category) => sum + category.metrics.length, 0);
    };

    const getAverageConfidence = () => {
        let total = 0;
        let count = 0;
        metrics.forEach(category => {
            category.metrics.forEach(metric => {
                if (metric.confidence) {
                    total += metric.confidence;
                    count++;
                }
            });
        });
        return count > 0 ? (total / count).toFixed(1) : "N/A";
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4">Quantitative Insights</h1>
                        <p className="text-muted-foreground mb-2">
                            Extract and visualize quantitative metrics from satellite imagery
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Upload an image to automatically extract numerical measurements, percentages, and quantitative data
                        </p>
                    </div>

                    {/* Upload Section */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Upload Image</CardTitle>
                            <CardDescription>
                                Select a satellite or aerial image for quantitative analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center gap-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="w-full max-w-md"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose Image
                                </Button>

                                {selectedImage && (
                                    <div className="w-full max-w-2xl">
                                        <img
                                            src={selectedImage}
                                            alt="Selected for analysis"
                                            className="w-full rounded-lg border"
                                        />
                                        <Button
                                            onClick={analyzeQuantitativeMetrics}
                                            disabled={analyzing}
                                            className="w-full mt-4"
                                        >
                                            {analyzing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Extracting Metrics...
                                                </>
                                            ) : (
                                                <>
                                                    <BarChart3 className="w-4 h-4 mr-2" />
                                                    Extract Quantitative Metrics
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Section */}
                    {metrics.length > 0 && (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Total Metrics</p>
                                            <p className="text-3xl font-bold">{getTotalMetricsCount()}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Categories</p>
                                            <p className="text-3xl font-bold">{metrics.length}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground mb-1">Avg. Confidence</p>
                                            <p className="text-3xl font-bold">{getAverageConfidence()}%</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Summary */}
                            {summary && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Analysis Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{summary}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Metrics by Category */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {metrics.map((category, idx) => (
                                    <Card key={idx}>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className={category.color}>
                                                    {category.icon}
                                                </div>
                                                <CardTitle>{category.name}</CardTitle>
                                            </div>
                                            <CardDescription>
                                                {category.metrics.length} metric{category.metrics.length !== 1 ? 's' : ''} extracted
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[300px] pr-4">
                                                <div className="space-y-4">
                                                    {category.metrics.map((metric, mIdx) => (
                                                        <div key={mIdx} className="border-l-2 border-primary/20 pl-4 py-2">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="font-semibold text-sm">{metric.name}</h4>
                                                                {metric.confidence && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {metric.confidence}% confidence
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-2xl font-bold text-primary">
                                                                {metric.value.toLocaleString()} <span className="text-base text-muted-foreground">{metric.unit}</span>
                                                            </p>
                                                            {metric.description && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {metric.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
