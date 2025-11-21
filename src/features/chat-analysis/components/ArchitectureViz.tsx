import { Card } from "@/components/ui/card";
import { Eye, Zap, Brain, Sparkles } from "lucide-react";

interface ArchitectureVizProps {
  isProcessing: boolean;
}

const modules = [
  {
    name: "Vision Encoder",
    description: "High-resolution visual feature extraction",
    icon: Eye,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    glowColor: "shadow-primary/20",
  },
  {
    name: "Alignment Adapter",
    description: "Projection layer for multimodal alignment",
    icon: Zap,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
    glowColor: "shadow-secondary/20",
  },
  {
    name: "Language Model",
    description: "GeoVision reasoning backbone",
    icon: Brain,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    glowColor: "shadow-accent/20",
  },
  {
    name: "Response Generator",
    description: "Natural language output generation",
    icon: Sparkles,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
    glowColor: "shadow-secondary/20",
  },
];

const ArchitectureViz = ({ isProcessing }: ArchitectureVizProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border shadow-card p-4">
      <h2 className="text-lg font-bold mb-1.5">Model Architecture</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Four-stage multimodal processing pipeline
      </p>

      <div className="space-y-3">
        {modules.map((module, index) => {
          const Icon = module.icon;
          const isActive = isProcessing;

          return (
            <div key={module.name}>
              <div
                className={`relative p-3 rounded-lg border transition-all ${
                  module.bgColor
                } ${module.borderColor} ${
                  isActive ? `shadow-lg ${module.glowColor} animate-glow-pulse` : ""
                }`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${module.bgColor} border ${module.borderColor}`}
                  >
                    <Icon className={`w-4 h-4 ${module.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xs">{module.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {module.description}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/60 animate-slide-in" />
                )}
              </div>

              {index < modules.length - 1 && (
                <div className="flex justify-center py-1.5">
                  <div
                    className={`w-0.5 h-5 bg-border ${
                      isActive ? "bg-primary animate-glow-pulse" : ""
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
        <h3 className="text-xs font-semibold mb-1.5">Model Info</h3>
        <div className="space-y-0.5 text-[10px] text-muted-foreground">
          <p>• Parameters: 20B</p>
          <p>• Context Length: 32K tokens</p>
          <p>• Vision Resolution: 448×448</p>
          <p>• License: Apache 2.0</p>
        </div>
      </div>
    </Card>
  );
};

export default ArchitectureViz;
