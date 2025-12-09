import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TreeDeciduous,
  Droplet,
  Building2,
  MapPin,
  Sparkles,
  TrendingUp,
  Leaf,
  Mountain,
  Factory,
  Heart,
  Activity,
  Target,
} from "lucide-react";

export interface AnalysisData {
  summary?: string;
  text?: string;
  confidence?: number;
  landCover?: {
    vegetation?: number;
    water?: number;
    urban?: number;
    bareSoil?: number;
    forest?: number;
    agriculture?: number;
  };
  vegetation?: {
    health?: string;
    ndvi?: number;
    density?: number;
    types?: string[];
  };
  waterBodies?: {
    totalArea?: number;
    quality?: string;
    sources?: string[];
  };
  urban?: {
    builtUpArea?: number;
    development?: string;
    infrastructure?: string[];
  };
  environmental?: {
    temperature?: number;
    humidity?: number;
    airQuality?: string;
    cloudCover?: number;
  };
  features?: Array<{
    type: string;
    description: string;
    severity?: string;
  }>;
  insights?: string[];
  recommendations?: string[];
  coordinates?: {
    latitude?: number;
    longitude?: number;
    location?: string;
  };
}

interface AnalysisDashboardProps {
  data: AnalysisData;
}

const AnalysisDashboard = ({ data }: AnalysisDashboardProps) => {
  const getHealthColor = (health: string) => {
    const h = health?.toLowerCase();
    if (h?.includes("excellent") || h?.includes("good")) return "text-emerald-500";
    if (h?.includes("moderate") || h?.includes("fair")) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBgColor = (health: string) => {
    const h = health?.toLowerCase();
    if (h?.includes("excellent") || h?.includes("good")) return "bg-emerald-500/10 border-emerald-500";
    if (h?.includes("moderate") || h?.includes("fair")) return "bg-yellow-500/10 border-yellow-500";
    return "bg-red-500/10 border-red-500";
  };

  const getSeverityColor = (severity?: string) => {
    const s = severity?.toLowerCase();
    if (s?.includes("high") || s?.includes("severe") || s?.includes("critical"))
      return "border-red-500 bg-red-500/10";
    if (s?.includes("medium") || s?.includes("moderate"))
      return "border-orange-500 bg-orange-500/10";
    if (s?.includes("low")) return "border-blue-500 bg-blue-500/10";
    return "border-slate-500 bg-slate-500/10";
  };

  const getSeverityBadgeColor = (severity?: string) => {
    const s = severity?.toLowerCase();
    if (s?.includes("high") || s?.includes("severe") || s?.includes("critical"))
      return "bg-red-500/20 text-red-700 border-red-500";
    if (s?.includes("medium") || s?.includes("moderate"))
      return "bg-orange-500/20 text-orange-700 border-orange-500";
    if (s?.includes("low")) return "bg-blue-500/20 text-blue-700 border-blue-500";
    return "bg-slate-500/20 text-slate-700 border-slate-500";
  };

  const getDevelopmentColor = (dev: string) => {
    const d = dev?.toLowerCase();
    if (d?.includes("high")) return "text-red-500";
    if (d?.includes("medium")) return "text-orange-500";
    return "text-green-500";
  };

  if (!data.landCover && !data.vegetation && !data.waterBodies && !data.urban && data.text) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <Card className="border-primary/20 shadow-2xl bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  AI Analysis Response
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {data.text}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-[1600px] mx-auto">
          {data.summary && (
            <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ROI Analysis Summary
                    </h2>
                    <p className="text-base leading-relaxed text-foreground/90">{data.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.vegetation && (
              <Card className={`border-2 ${getHealthBgColor(data.vegetation.health || "Unknown")} shadow-lg hover:shadow-xl transition-shadow`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className={`${getHealthColor(data.vegetation.health || "Unknown")} border-current`}>
                      {data.vegetation.health || "Unknown"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Vegetation Health</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Density</span>
                        <span className="font-mono font-bold">{data.vegetation.density || 0}%</span>
                      </div>
                      <Progress value={data.vegetation.density || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.waterBodies && (
              <Card className="border-2 border-blue-500/30 bg-blue-500/5 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
                      <Droplet className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-500">
                      {data.waterBodies.totalArea || 0}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Water Coverage</h3>
                    <Progress value={data.waterBodies.totalArea || 0} className="h-2" />
                    {data.waterBodies.quality && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{data.waterBodies.quality}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.urban && (
              <Card className="border-2 border-orange-500/30 bg-orange-500/5 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-md">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className={`${getDevelopmentColor(data.urban.development || "Low")} border-current`}>
                      {data.urban.development || "Low"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Urban Area</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Built-up</span>
                        <span className="font-mono font-bold">{data.urban.builtUpArea || 0}%</span>
                      </div>
                      <Progress value={data.urban.builtUpArea || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.landCover && (
              <Card className="border-2 border-purple-500/30 bg-purple-500/5 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                      <Mountain className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-500">
                      Mixed
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Land Cover</h3>
                    <div className="space-y-1.5 text-xs">
                      {Object.entries(data.landCover)
                        .filter(([_, value]) => value > 0)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="capitalize text-muted-foreground">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className="font-mono font-bold text-foreground">{value.toFixed(0)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {data.landCover && (
            <Card className="border-primary/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Detailed Land Cover Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(data.landCover).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-sm font-mono font-bold text-primary">{value.toFixed(1)}%</span>
                      </div>
                      <Progress value={value} className="h-2.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.features && data.features.length > 0 && (
            <Card className="border-primary/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Notable Features Detected ({data.features.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {data.features.map((feature, i) => (
                    <Card
                      key={i}
                      className={`border-2 ${getSeverityColor(feature.severity)} hover:shadow-lg transition-shadow`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-base flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            {feature.type}
                          </h4>
                          {feature.severity && (
                            <Badge className={getSeverityBadgeColor(feature.severity)} variant="outline">
                              {feature.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {data.insights && data.insights.length > 0 && (
              <Card className="border-blue-500/20 shadow-xl bg-gradient-to-br from-blue-500/5 to-background">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Key Insights ({data.insights.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {data.insights.map((insight, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/90">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {data.recommendations && data.recommendations.length > 0 && (
              <Card className="border-emerald-500/20 shadow-xl bg-gradient-to-br from-emerald-500/5 to-background">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Recommendations ({data.recommendations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {data.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/90">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {data.vegetation?.types && data.vegetation.types.length > 0 && (
              <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TreeDeciduous className="w-4 h-4 text-emerald-600" />
                    Vegetation Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.vegetation.types.map((type, i) => (
                      <Badge key={i} variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.waterBodies?.sources && data.waterBodies.sources.length > 0 && (
              <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Droplet className="w-4 h-4 text-blue-600" />
                    Water Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.waterBodies.sources.map((source, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.urban?.infrastructure && data.urban.infrastructure.length > 0 && (
              <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Factory className="w-4 h-4 text-orange-600" />
                    Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.urban.infrastructure.map((infra, i) => (
                      <Badge key={i} variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-500/30">
                        {infra}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.environmental && (
              <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="w-4 h-4 text-pink-600" />
                    Environmental Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {data.environmental.airQuality && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Air Quality</span>
                        <span className="font-medium">{data.environmental.airQuality}</span>
                      </div>
                    )}
                    {data.environmental.temperature !== null && data.environmental.temperature !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature</span>
                        <span className="font-medium">{data.environmental.temperature}°C</span>
                      </div>
                    )}
                    {data.environmental.humidity !== null && data.environmental.humidity !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Humidity</span>
                        <span className="font-medium">{data.environmental.humidity}%</span>
                      </div>
                    )}
                    {data.environmental.cloudCover !== null && data.environmental.cloudCover !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cloud Cover</span>
                        <span className="font-medium">{data.environmental.cloudCover}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AnalysisDashboard;
