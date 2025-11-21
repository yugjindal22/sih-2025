import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PipelineStep {
  name: string;
  description: string;
  duration: number;
}

const steps: PipelineStep[] = [
  {
    name: "Image Preprocessing",
    description: "Normalizing and resizing input",
    duration: 4500,
  },
  {
    name: "Feature Extraction",
    description: "CLIP encoder processing",
    duration: 6000,
  },
  {
    name: "Adapter Projection",
    description: "Aligning to LLM space",
    duration: 5400,
  },
  {
    name: "GPT-OSS Inference",
    description: "Running reasoning model",
    duration: 9000,
  },
  {
    name: "Response Generation",
    description: "Synthesizing output",
    duration: 6000,
  },
];

interface VisionPipelineProps {
  isActive: boolean;
  isComplete?: boolean;
}

const VisionPipeline = ({
  isActive,
  isComplete = false,
}: VisionPipelineProps) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(-1);
      setProgress(0);
      setCompletedSteps([]);
      return;
    }

    // Start collapsed
    setIsOpen(false);

    let totalTime = 0;
    const timeouts: NodeJS.Timeout[] = [];

    steps.forEach((step, index) => {
      totalTime += step.duration;

      const timeout = setTimeout(() => {
        setCurrentStep(index);
        setProgress(((index + 1) / steps.length) * 100);

        if (index > 0) {
          setCompletedSteps((prev) => [...prev, index - 1]);
        }

        // Don't auto-complete the last step - wait for isComplete prop
        if (index === steps.length - 1) {
          // Keep spinning on last step until isComplete is true
        } else if (index === steps.length - 2) {
          // Complete second-to-last step normally
          setTimeout(() => {
            setCompletedSteps((prev) => [...prev, index]);
          }, step.duration - 200);
        }
      }, totalTime - step.duration);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isActive]);

  // When response is complete, mark the last step as done
  useEffect(() => {
    if (isComplete && currentStep === steps.length - 1) {
      setCompletedSteps((prev) => [...prev, steps.length - 1]);
    }
  }, [isComplete, currentStep]);

  if (!isActive) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mt-3 flex-shrink-0"
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border shadow-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">
                Vision Pipeline Progress
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({Math.round(progress)}%)
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(index);
                const isCurrent = currentStep === index;
                const isUpcoming = index > currentStep;

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-2 rounded-lg border transition-all ${
                      isCompleted
                        ? "bg-green-500/10 border-green-500/30"
                        : isCurrent
                        ? "bg-primary/10 border-primary/30 animate-glow-pulse"
                        : "bg-muted/20 border-border/30 opacity-50"
                    } ${!isUpcoming ? "animate-fade-in" : ""}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default VisionPipeline;
