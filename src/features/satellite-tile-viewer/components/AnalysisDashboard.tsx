import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TreeDeciduous, Droplet, Building2, MapPin, Cloud, Thermometer, Sparkles } from "lucide-react";

export interface AnalysisData {
  summary?: string;
  text?: string; // Full AI response text
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
    if (h?.includes("excellent") || h?.includes("good")) return "text-green-500";
    if (h?.includes("moderate") || h?.includes("fair")) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity?: string) => {
    const s = severity?.toLowerCase();
    if (s?.includes("high") || s?.includes("severe")) return "border-red-500 bg-red-500/10";
    if (s?.includes("medium") || s?.includes("moderate")) return "border-yellow-500 bg-yellow-500/10";
    return "border-blue-500 bg-blue-500/10";
  };

  // If only text is available, show it in a nice format
  if (!data.landCover && !data.vegetation && !data.waterBodies && !data.urban && data.text) {
    return (
      <div className="space-y-4 max-w-4xl">
        {/* Confidence Score */}
        {data.confidence && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Analysis Confidence</span>
              <span className="text-lg font-bold text-primary">{data.confidence.toFixed(1)}%</span>
            </div>
            <Progress value={data.confidence} className="h-2" />
          </Card>
        )}
        
        {/* AI Response Text */}
        <Card className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-base mb-2">AI Analysis Response</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {data.text}
              </div>
            </div>
          </div>
        </Card>

        {/* Insights if available */}
        {data.insights && data.insights.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Key Insights
            </h3>
            <ul className="space-y-2">
              {data.insights.map((insight, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Confidence Score */}
      {data.confidence && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Analysis Confidence</span>
            <span className="text-lg font-bold text-primary">{data.confidence.toFixed(1)}%</span>
          </div>
          <Progress value={data.confidence} className="h-2" />
        </Card>
      )}

      {/* Land Cover Distribution */}
      {data.landCover && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Land Cover Distribution
          </h3>
          <div className="space-y-2">
            {Object.entries(data.landCover).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs w-24 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <Progress value={value} className="flex-1 h-2" />
                <span className="text-xs font-mono w-12 text-right">{value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Vegetation Health */}
      {data.vegetation && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TreeDeciduous className="w-4 h-4 text-green-500" />
            Vegetation Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {data.vegetation.health && (
              <div>
                <span className="text-xs text-muted-foreground">Health Status</span>
                <p className={`text-sm font-semibold ${getHealthColor(data.vegetation.health)}`}>
                  {data.vegetation.health}
                </p>
              </div>
            )}
            {data.vegetation.ndvi !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">NDVI</span>
                <p className="text-sm font-semibold text-green-500">{data.vegetation.ndvi.toFixed(2)}</p>
              </div>
            )}
            {data.vegetation.density !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">Density</span>
                <p className="text-sm font-semibold">{data.vegetation.density.toFixed(1)}%</p>
              </div>
            )}
            {data.vegetation.types && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">Types</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.vegetation.types.map((type, idx) => (
                    <span key={idx} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Water Bodies */}
      {data.waterBodies && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Droplet className="w-4 h-4 text-blue-500" />
            Water Bodies Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {data.waterBodies.totalArea !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">Total Area</span>
                <p className="text-sm font-semibold text-blue-500">{data.waterBodies.totalArea.toFixed(1)}%</p>
              </div>
            )}
            {data.waterBodies.quality && (
              <div>
                <span className="text-xs text-muted-foreground">Quality</span>
                <p className="text-sm font-semibold">{data.waterBodies.quality}</p>
              </div>
            )}
            {data.waterBodies.sources && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">Sources</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.waterBodies.sources.map((source, idx) => (
                    <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Urban Development */}
      {data.urban && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" />
            Urban Development
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {data.urban.builtUpArea !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">Built-up Area</span>
                <p className="text-sm font-semibold text-orange-500">{data.urban.builtUpArea.toFixed(1)}%</p>
              </div>
            )}
            {data.urban.development && (
              <div>
                <span className="text-xs text-muted-foreground">Development Level</span>
                <p className="text-sm font-semibold">{data.urban.development}</p>
              </div>
            )}
            {data.urban.infrastructure && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">Infrastructure</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.urban.infrastructure.map((infra, idx) => (
                    <span key={idx} className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                      {infra}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Environmental Conditions */}
      {data.environmental && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-purple-500" />
            Environmental Conditions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {data.environmental.temperature !== undefined && (
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-red-500" />
                <div>
                  <span className="text-xs text-muted-foreground">Temperature</span>
                  <p className="text-sm font-semibold">{data.environmental.temperature}°C</p>
                </div>
              </div>
            )}
            {data.environmental.humidity !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">Humidity</span>
                <p className="text-sm font-semibold">{data.environmental.humidity}%</p>
              </div>
            )}
            {data.environmental.airQuality && (
              <div>
                <span className="text-xs text-muted-foreground">Air Quality</span>
                <p className="text-sm font-semibold">{data.environmental.airQuality}</p>
              </div>
            )}
            {data.environmental.cloudCover !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">Cloud Cover</span>
                <p className="text-sm font-semibold">{data.environmental.cloudCover}%</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Notable Features */}
      {data.features && data.features.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Notable Features</h3>
          <div className="space-y-2">
            {data.features.map((feature, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(feature.severity)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{feature.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                  {feature.severity && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary">
                      {feature.severity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Key Insights</h3>
          <ul className="space-y-2">
            {data.insights.map((insight, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Location */}
      {data.coordinates && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Location
          </h3>
          <div className="space-y-2">
            {data.coordinates.location && (
              <p className="text-sm">{data.coordinates.location}</p>
            )}
            {(data.coordinates.latitude !== undefined && data.coordinates.longitude !== undefined) && (
              <p className="text-xs font-mono text-muted-foreground">
                {data.coordinates.latitude.toFixed(4)}°N, {data.coordinates.longitude.toFixed(4)}°E
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalysisDashboard;
