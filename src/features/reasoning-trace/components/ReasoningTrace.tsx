import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Brain, Eye, Lightbulb, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ReasoningStep {
  title: string;
  content: string;
  icon: any;
  color: string;
}

interface ReasoningTraceProps {
  steps: ReasoningStep[];
}

const ReasoningTrace = ({ steps }: ReasoningTraceProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (steps.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 bg-card/50 backdrop-blur-sm border-border shadow-card overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Reasoning Trace</h3>
            <span className="text-xs text-muted-foreground">({steps.length} steps)</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} 
          />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={`p-2 rounded-lg bg-muted ${step.color} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-1">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ReasoningTrace;

// Helper function to generate reasoning steps from AI response
export const generateReasoningSteps = (response: string): ReasoningStep[] => {
  // This is a simplified version. In production, you'd parse the actual reasoning trace from the model
  const steps: ReasoningStep[] = [
    {
      title: "Visual Feature Detection",
      content: "Identified key spectral signatures and spatial patterns in the satellite imagery. Detected vegetation indices, water bodies, and urban areas based on reflectance values.",
      icon: Eye,
      color: "text-blue-400",
    },
    {
      title: "Contextual Analysis",
      content: "Analyzed spatial relationships and context. Examined texture, shape, and distribution patterns to understand land cover types and their interactions.",
      icon: Brain,
      color: "text-purple-400",
    },
    {
      title: "Domain Knowledge Application",
      content: "Applied Earth Observation domain expertise to interpret spectral bands and temporal changes. Considered seasonal patterns and geographical context.",
      icon: Lightbulb,
      color: "text-yellow-400",
    },
    {
      title: "Conclusion Synthesis",
      content: "Integrated visual analysis with domain knowledge to generate comprehensive insights about land cover classification, environmental conditions, and potential changes.",
      icon: CheckCircle,
      color: "text-green-400",
    },
  ];

  return steps;
};
