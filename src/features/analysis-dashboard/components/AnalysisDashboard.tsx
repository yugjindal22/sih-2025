import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ColoredProgress } from "@/components/ui/colored-progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trees,
  Droplets,
  Building2,
  Mountain,
  Sprout,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Eye,
  Thermometer,
  Wind,
  Cloud,
  Sun,
  MapPin,
  Gauge,
  BarChart3,
  PieChart,
  Leaf,
} from "lucide-react";
import { useState, useEffect } from "react";

export interface AnalysisData {
  summary: string;
  confidence: number;
  landCover: {
    vegetation: number;
    water: number;
    urban: number;
    bareSoil: number;
    forest: number;
    agriculture: number;
  };
  vegetation: {
    health: "Excellent" | "Good" | "Moderate" | "Poor" | "Critical";
    ndvi: number;
    density: number;
    types: string[];
  };
  waterBodies: {
    totalArea: number;
    quality: "Clean" | "Moderate" | "Polluted";
    sources: string[];
  };
  urban: {
    builtUpArea: number;
    development: "High" | "Medium" | "Low";
    infrastructure: string[];
  };
  environmental: {
    temperature: number;
    humidity: number;
    airQuality: "Good" | "Moderate" | "Poor";
    cloudCover: number;
  };
  features: {
    type: string;
    description: string;
    severity?: "High" | "Medium" | "Low";
  }[];
  insights: string[];
  recommendations: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
    location?: string;
  };
}

interface AnalysisDashboardProps {
  data: AnalysisData;
  isLoading?: boolean;
}

const AnalysisDashboard = ({
  data,
  isLoading = false,
}: AnalysisDashboardProps) => {
  const [animatedValues, setAnimatedValues] = useState({
    vegetation: 0,
    water: 0,
    urban: 0,
    bareSoil: 0,
    forest: 0,
    agriculture: 0,
    ndvi: 0,
    density: 0,
    confidence: 0,
  });

  useEffect(() => {
    if (!isLoading) {
      const duration = 1500;
      const steps = 60;
      const interval = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        setAnimatedValues({
          vegetation: data.landCover.vegetation * progress,
          water: data.landCover.water * progress,
          urban: data.landCover.urban * progress,
          bareSoil: data.landCover.bareSoil * progress,
          forest: data.landCover.forest * progress,
          agriculture: data.landCover.agriculture * progress,
          ndvi: data.vegetation.ndvi * progress,
          density: data.vegetation.density * progress,
          confidence: data.confidence * progress,
        });

        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [data, isLoading]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Excellent":
        return "text-green-500";
      case "Good":
        return "text-blue-500";
      case "Moderate":
        return "text-yellow-500";
      case "Poor":
        return "text-orange-500";
      case "Critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getHealthBg = (health: string) => {
    switch (health) {
      case "Excellent":
        return "bg-green-500/10 border-green-500/30";
      case "Good":
        return "bg-blue-500/10 border-blue-500/30";
      case "Moderate":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "Poor":
        return "bg-orange-500/10 border-orange-500/30";
      case "Critical":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 pr-4 pb-4">
          {/* Header Stats - Compact Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Confidence Score - Compact */}
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-primary/20">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Confidence</h3>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">
                {animatedValues.confidence.toFixed(1)}%
              </div>
              <Progress value={animatedValues.confidence} className="h-2" />
            </Card>

            {/* Vegetation Health - Compact */}
            <Card
              className={`p-4 border ${getHealthBg(data.vegetation.health)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-green-500/20">
                  <Leaf className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="text-sm font-semibold">Veg Health</h3>
              </div>
              <div
                className={`text-xl font-bold ${getHealthColor(
                  data.vegetation.health
                )}`}
              >
                {data.vegetation.health}
              </div>
              <div className="text-xs text-muted-foreground">
                NDVI: {animatedValues.ndvi.toFixed(3)}
              </div>
            </Card>
          </div>

          {/* Location Info - Compact */}
          {data.coordinates && (
            <Card className="p-3 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {data.coordinates.location || "Unknown Location"}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{data.coordinates.latitude.toFixed(2)}°N</span>
                    <span>{data.coordinates.longitude.toFixed(2)}°E</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tabbed Content for Better Space Usage */}
          <Tabs defaultValue="landcover" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50">
              <TabsTrigger value="landcover" className="text-xs px-2">
                <Layers className="w-4 h-4 mr-1" />
                Land
              </TabsTrigger>
              <TabsTrigger value="environment" className="text-xs px-2">
                <Sun className="w-4 h-4 mr-1" />
                Env
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs px-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="landcover" className="mt-3 space-y-3">
              {/* Land Cover - Mini Pie Chart Visualization */}
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  Land Cover
                </h3>

                {/* Visual Pie Chart */}
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 drop-shadow-lg">
                      {(() => {
                        let currentAngle = 0;
                        const colors = {
                          vegetation: "hsl(142 76% 36%)",
                          water: "hsl(217 91% 60%)",
                          urban: "hsl(220 15% 45%)",
                          bareSoil: "hsl(25 95% 53%)",
                          forest: "hsl(158 64% 52%)",
                          agriculture: "hsl(84 81% 44%)",
                        };

                        return Object.entries(data.landCover).map(
                          ([key, value]) => {
                            const percentage = value as number;
                            const angle = (percentage / 100) * 360;
                            const startAngle = currentAngle;
                            currentAngle += angle;

                            const x1 =
                              50 + 45 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 =
                              50 + 45 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 =
                              50 +
                              45 * Math.cos((currentAngle * Math.PI) / 180);
                            const y2 =
                              50 +
                              45 * Math.sin((currentAngle * Math.PI) / 180);

                            const largeArc = angle > 180 ? 1 : 0;

                            if (percentage < 1) return null;

                            return (
                              <g key={key}>
                                <path
                                  d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={colors[key as keyof typeof colors]}
                                  className="transition-all duration-500 hover:opacity-100"
                                  opacity="0.9"
                                  stroke="hsl(var(--background))"
                                  strokeWidth="0.5"
                                />
                              </g>
                            );
                          }
                        );
                      })()}
                      <circle
                        cx="50"
                        cy="50"
                        r="22"
                        fill="hsl(var(--background))"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-base font-bold text-foreground">100%</div>
                        <div className="text-[10px] text-muted-foreground font-medium">
                          Cover
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>{animatedValues.vegetation.toFixed(1)}% Veg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>{animatedValues.water.toFixed(1)}% Water</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span>{animatedValues.urban.toFixed(1)}% Urban</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>{animatedValues.bareSoil.toFixed(1)}% Soil</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-600" />
                    <span>{animatedValues.forest.toFixed(1)}% Forest</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-lime-500" />
                    <span>{animatedValues.agriculture.toFixed(1)}% Agri</span>
                  </div>
                </div>
              </Card>

              {/* Vegetation Details - Compact */}
              <Card className="p-3 bg-green-500/5 border-green-500/20">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Gauge className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Density</span>
                    </div>
                    <div className="text-base font-bold">
                      {animatedValues.density.toFixed(1)}%
                    </div>
                    <Progress
                      value={animatedValues.density}
                      className="h-1.5 mt-1.5"
                    />
                  </div>
                  <div>
                    <div className="font-medium mb-1.5">Types</div>
                    <div className="flex flex-wrap gap-1">
                      {data.vegetation.types.slice(0, 2).map((type, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5 h-5"
                        >
                          {type.substring(0, 8)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Water & Urban - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {data.waterBodies.totalArea > 0 && (
                  <Card className="p-3 bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold">Water</span>
                    </div>
                    <div className="text-base font-bold text-blue-500">
                      {data.waterBodies.totalArea.toFixed(1)}%
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[10px] px-1.5 py-0.5 h-5"
                    >
                      {data.waterBodies.quality}
                    </Badge>
                  </Card>
                )}

                {data.urban.builtUpArea > 0 && (
                  <Card className="p-3 bg-gray-500/5 border-gray-500/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-semibold">Urban</span>
                    </div>
                    <div className="text-base font-bold text-gray-500">
                      {data.urban.builtUpArea.toFixed(1)}%
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[10px] px-1.5 py-0.5 h-5"
                    >
                      {data.urban.development}
                    </Badge>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="environment" className="mt-3 space-y-3">
              {/* Environmental Conditions - Grid Layout */}
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-primary" />
                  Environment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Temperature Gauge */}
                  <div className="text-center p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <Thermometer className="w-5 h-5 mx-auto mb-1.5 text-red-500" />
                    <div className="text-xl font-bold text-red-500">
                      {data.environmental.temperature}°
                    </div>
                    <div className="text-xs text-muted-foreground">Temp</div>
                  </div>

                  {/* Humidity Gauge */}
                  <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <Droplets className="w-5 h-5 mx-auto mb-1.5 text-blue-500" />
                    <div className="text-xl font-bold text-blue-500">
                      {data.environmental.humidity}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Humidity
                    </div>
                  </div>

                  {/* Air Quality */}
                  <div className="text-center p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <Wind className="w-5 h-5 mx-auto mb-1.5 text-cyan-500" />
                    <div className="text-sm font-bold text-cyan-500">
                      {data.environmental.airQuality}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Air Quality
                    </div>
                  </div>

                  {/* Cloud Cover */}
                  <div className="text-center p-3 rounded-lg bg-gray-500/5 border border-gray-500/20">
                    <Cloud className="w-5 h-5 mx-auto mb-1.5 text-gray-500" />
                    <div className="text-xl font-bold text-gray-500">
                      {data.environmental.cloudCover}%
                    </div>
                    <div className="text-xs text-muted-foreground">Cloud</div>
                  </div>
                </div>
              </Card>

              {/* Notable Features - Compact */}
              {data.features.length > 0 && (
                <Card className="p-3 bg-card/50 backdrop-blur-sm border-border">
                  <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Features ({data.features.length})
                  </h3>
                  <div className="space-y-2">
                    {data.features.slice(0, 3).map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                      >
                        {feature.severity && (
                          <AlertTriangle
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              feature.severity === "High"
                                ? "text-red-500"
                                : feature.severity === "Medium"
                                ? "text-yellow-500"
                                : "text-blue-500"
                            }`}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {feature.type}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                    {data.features.length > 3 && (
                      <div className="text-xs text-center text-muted-foreground">
                        +{data.features.length - 3} more
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="mt-3 space-y-3">
              {/* Key Insights - Compact */}
              <Card className="p-3 bg-primary/5 border-primary/20">
                <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Insights
                </h3>
                <ul className="space-y-2">
                  {data.insights.slice(0, 4).map((insight, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="line-clamp-2">{insight}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Recommendations - Compact */}
              <Card className="p-3 bg-green-500/5 border-green-500/20">
                <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Actions
                </h3>
                <ul className="space-y-2">
                  {data.recommendations.slice(0, 4).map((rec, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">
                        ✓
                      </span>
                      <span className="line-clamp-2">{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Summary Stats */}
              <Card className="p-3 bg-card/50 backdrop-blur-sm border-border">
                <h3 className="text-sm font-semibold mb-2.5">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span>Top Cover:</span>
                    <span className="font-bold">
                      {(() => {
                        const max = Math.max(...Object.values(data.landCover));
                        const type = Object.entries(data.landCover).find(
                          ([_, v]) => v === max
                        )?.[0];
                        return type?.charAt(0).toUpperCase() + type?.slice(1);
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span>Analyzed:</span>
                    <span className="font-bold">
                      {data.features.length} items
                    </span>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AnalysisDashboard;
