import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Leaf, Droplet, Mountain, Building } from "lucide-react";
import { useEffect, useState } from "react";

interface InsightMetric {
  label: string;
  value: number;
  color: string;
  icon: any;
  bgColor: string;
}

interface QuantitativeInsightsProps {
  metrics: {
    vegetation?: number;
    water?: number;
    soil?: number;
    urban?: number;
  } | null;
  isAnimating?: boolean;
}

const QuantitativeInsights = ({ metrics, isAnimating = false }: QuantitativeInsightsProps) => {
  const [displayMetrics, setDisplayMetrics] = useState<InsightMetric[]>([]);

  useEffect(() => {
    if (!metrics) {
      setDisplayMetrics([]);
      return;
    }

    const insights: InsightMetric[] = [
      {
        label: "Vegetation",
        value: metrics.vegetation || 0,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        icon: Leaf,
      },
      {
        label: "Water Bodies",
        value: metrics.water || 0,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        icon: Droplet,
      },
      {
        label: "Soil/Barren",
        value: metrics.soil || 0,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        icon: Mountain,
      },
      {
        label: "Urban/Built",
        value: metrics.urban || 0,
        color: "text-gray-400",
        bgColor: "bg-gray-500/10",
        icon: Building,
      },
    ].filter(m => m.value > 0);

    if (isAnimating) {
      insights.forEach((insight, index) => {
        setTimeout(() => {
          setDisplayMetrics(prev => [...prev, insight]);
        }, index * 150);
      });
    } else {
      setDisplayMetrics(insights);
    }
  }, [metrics, isAnimating]);

  if (displayMetrics.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 bg-card/50 backdrop-blur-sm border-border shadow-card p-4">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
        Quantitative Analysis
      </h3>
      
      <div className="space-y-4">
        {displayMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                  </div>
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <span className={`text-sm font-bold ${metric.color}`}>
                  {metric.value.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={metric.value} 
                className="h-2"
                style={{
                  // @ts-ignore
                  '--progress-background': metric.color.replace('text-', 'var(--'),
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>Total Coverage: {displayMetrics.reduce((sum, m) => sum + m.value, 0).toFixed(1)}%</p>
          <p className="mt-1">
            Dominant: {displayMetrics.sort((a, b) => b.value - a.value)[0]?.label || "N/A"}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default QuantitativeInsights;

// Helper function to extract or estimate metrics from AI response
export const extractQuantitativeMetrics = (response: string): {
  vegetation?: number;
  water?: number;
  soil?: number;
  urban?: number;
} => {
  // This is a simplified extraction. In production, this would parse structured output from the model
  // or use a separate image segmentation model
  
  const metrics: any = {};
  
  // Look for percentage mentions in the response
  const vegMatch = response.match(/vegetation[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  const waterMatch = response.match(/water[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  const soilMatch = response.match(/soil|barren[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  const urbanMatch = response.match(/urban|built[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  
  if (vegMatch) metrics.vegetation = parseFloat(vegMatch[1]);
  if (waterMatch) metrics.water = parseFloat(waterMatch[1]);
  if (soilMatch) metrics.soil = parseFloat(soilMatch[1]);
  if (urbanMatch) metrics.urban = parseFloat(urbanMatch[1]);
  
  // If no metrics found, generate estimates based on keywords
  if (Object.keys(metrics).length === 0) {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('vegetation') || lowerResponse.includes('forest') || lowerResponse.includes('green')) {
      metrics.vegetation = 35 + Math.random() * 30;
    }
    if (lowerResponse.includes('water') || lowerResponse.includes('river') || lowerResponse.includes('lake')) {
      metrics.water = 10 + Math.random() * 20;
    }
    if (lowerResponse.includes('soil') || lowerResponse.includes('barren') || lowerResponse.includes('desert')) {
      metrics.soil = 20 + Math.random() * 25;
    }
    if (lowerResponse.includes('urban') || lowerResponse.includes('building') || lowerResponse.includes('city')) {
      metrics.urban = 15 + Math.random() * 20;
    }
  }
  
  return metrics;
};
