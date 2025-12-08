"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { 
  Image, 
  Grid3x3, 
  Layers, 
  Cpu, 
  Brain, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Zap,
  Target,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PipelineStage {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  details: string[];
  technicalSpecs?: {
    label: string;
    value: string;
  }[];
  subStages?: {
    name: string;
    description: string;
    expandable?: boolean;
    expandedDetails?: string[];
  }[];
}

const pipelineStages: PipelineStage[] = [
  {
    id: "preprocessing",
    title: "Dynamic High Resolution",
    subtitle: "Pre-processing & Tile Generation",
    icon: <Grid3x3 className="w-6 h-6" />,
    color: "text-blue-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    details: [
      "Preserves aspect ratio instead of squashing to fixed size",
      "Splits into 448×448 tiles with maximum budget allocation",
      "Creates thumbnail (448×448) for global structure",
      "Tiles provide high-res details, thumbnail gives layout context"
    ],
    technicalSpecs: [
      { label: "Tile Size", value: "448×448" },
      { label: "Max Tiles", value: "n_max budget" },
      { label: "Thumbnail", value: "Global context" }
    ]
  },
  {
    id: "vision-encoder",
    title: "InternViT-300M",
    subtitle: "Vision Encoder & Embedding",
    icon: <Image className="w-6 h-6" />,
    color: "text-purple-500",
    bgGradient: "from-purple-500/10 to-pink-500/10",
    details: [
      "Breaks images into patches",
      "Converts patches into vector embeddings (token embedding)",
      "Each patch flattened and passed through linear layer",
      "Formula: output = input × weights + bias"
    ],
    technicalSpecs: [
      { label: "Model Size", value: "300M parameters" },
      { label: "Output", value: "1024 tokens/tile" },
      { label: "Method", value: "Linear projection" }
    ]
  },
  {
    id: "mlp-projector",
    title: "MLP Projector",
    subtitle: "Token Compression & Dimension Alignment",
    icon: <Layers className="w-6 h-6" />,
    color: "text-green-500",
    bgGradient: "from-green-500/10 to-emerald-500/10",
    details: [
      "Compresses 1024 tokens → 256 tokens (4x faster)",
      "Aligns dimensions to LLM embedding size (2880)",
      "Leaves more space for conversation history and response"
    ],
    subStages: [
      {
        name: "Stage A: Pixel Shuffle",
        description: "Merges 2×2 grid (4 tokens) into 1 token. Reduces 1024 → 256 tokens.",
        expandable: true,
        expandedDetails: [
          "Takes 2×2 spatial grid of tokens (4 tokens total)",
          "Merges them into a single token with concatenated features",
          "Reduces spatial resolution but increases channel depth",
          "Result: 1024 tokens → 256 tokens (4x compression)",
          "Enables faster processing in subsequent layers"
        ]
      },
      {
        name: "Stage B: 2-Layer MLP",
        description: "Linear → GELU → Linear. Projects 4096 channels → 2880 (LLM size).",
        expandable: true,
        expandedDetails: [
          "First Linear Layer: Projects from 4096 to intermediate dimension",
          "GELU Activation: Gaussian Error Linear Unit for non-linearity",
          "Smoothly suppresses negative noise (unlike ReLU)",
          "Second Linear Layer: Projects to final LLM embedding size (2880)",
          "Output perfectly aligned with GPT-OSS-20B input requirements"
        ]
      }
    ],
    technicalSpecs: [
      { label: "Compression", value: "1024 → 256 tokens" },
      { label: "Output Dim", value: "2880 channels" },
      { label: "Speedup", value: "4x faster" }
    ]
  },
  {
    id: "llm",
    title: "GPT-OSS-20B",
    subtitle: "Language Model Reasoning",
    icon: <Brain className="w-6 h-6" />,
    color: "text-orange-500",
    bgGradient: "from-orange-500/10 to-red-500/10",
    details: [
      "Processes 256 visual tokens + text prompt",
      "Uses o200k_harmony tokenizer",
      "Performs multimodal reasoning",
      "Generates coherent responses with image understanding"
    ],
    technicalSpecs: [
      { label: "Model Size", value: "20B parameters" },
      { label: "Tokenizer", value: "o200k_harmony" },
      { label: "Input", value: "Visual + Text tokens" }
    ]
  },
  {
    id: "training",
    title: "Training Pipeline",
    subtitle: "3-Stage Learning Process",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "text-pink-500",
    bgGradient: "from-pink-500/10 to-rose-500/10",
    details: [
      "Continual Pre-Training (CPT): Learn image understanding",
      "Supervised Fine-Tuning (SFT): Follow instructions",
      "Reinforcement Learning (MPO + GSPO): Improve reasoning"
    ],
    subStages: [
      {
        name: "CPT: Multimodal Pre-Training",
        description: "Teaches GPT-OSS to understand images. Uses massive web data with text+images. Next-token prediction on billions of tokens.",
        expandable: true,
        expandedDetails: [
          "Started with pretrained GPT-OSS (text-only) + InternViT (vision-only)",
          "Added MLP projector to convert visual features into LLM tokens",
          "Trained entire model on massive mixed text+image datasets",
          "Data sources: web images, captions, OCR, alt-text, auto-generated captions",
          "Scale: Hundreds of billions of tokens",
          "Loss: Standard next-token prediction"
        ]
      },
      {
        name: "SFT: Instruction Following",
        description: "High-quality QA, captions, reasoning datasets. Learns to respond like an assistant.",
        expandable: true,
        expandedDetails: [
          "Uses curated, high-quality instruction datasets",
          "Includes: Image captioning, VQA, reasoning steps, charts, UI, OCR",
          "Teaches model to respond like helpful assistant",
          "Same next-token prediction loss, but on instruction-style data",
          "Significantly improves response quality and instruction following"
        ]
      },
      {
        name: "RL: MPO (Offline) + GSPO (Online)",
        description: "MPO: Learn from ranked answers. GSPO: Generate & score own answers, improve based on rewards.",
        expandable: true,
        expandedDetails: [
          "MPO (Offline RL): Warm-up phase with pre-collected data",
          "Dataset of prompts with multiple ranked answers",
          "Model learns to prefer better answers and imitate high-quality outputs",
          "GSPO (Online RL): Real-time learning from self-generated answers",
          "Model generates multiple answers, reward model scores them",
          "Updates policy to make higher-reward answers more likely"
        ]
      }
    ],
    technicalSpecs: [
      { label: "CPT Data", value: "100B+ tokens" },
      { label: "Loss Function", value: "Next-token prediction" },
      { label: "RL Stages", value: "MPO → GSPO" }
    ]
  }
];

interface VisionPipelineProps {
  isActive: boolean;
  isComplete?: boolean;
}

const VisionPipeline = ({
  isActive,
  isComplete = false,
}: VisionPipelineProps) => {
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [expandedSubStages, setExpandedSubStages] = useState<string[]>([]);
  const [animatedStage, setAnimatedStage] = useState<number>(-1);

  useEffect(() => {
    // Animate data flow through pipeline
    const interval = setInterval(() => {
      setAnimatedStage(prev => (prev + 1) % (pipelineStages.length + 1));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const toggleSubStage = (subStageId: string) => {
    setExpandedSubStages(prev => 
      prev.includes(subStageId) 
        ? prev.filter(id => id !== subStageId)
        : [...prev, subStageId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Vision Architecture Pipeline</CardTitle>
              <CardDescription className="text-base">
                InternViT-300M → MLP Projector → GPT-OSS-20B
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              4x Compression
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Target className="w-3 h-3" />
              Dynamic Resolution
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Award className="w-3 h-3" />
              20B Parameters
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Pipeline Flow */}
      <div className="relative">
        {/* Animated Data Flow Particles */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 -ml-0.5 overflow-hidden">
          <div className="relative h-full">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"
                style={{
                  left: '-0.25rem',
                  animation: `flowDown 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.6}s`,
                  opacity: 0
                }}
              />
            ))}
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-8">
          {pipelineStages.map((stage, index) => {
            const isExpanded = expandedStages.includes(stage.id);
            const isAnimating = animatedStage === index;
            
            return (
              <div key={stage.id} className="relative">
                {/* Data Flow Arrow */}
                {index < pipelineStages.length - 1 && (
                  <div className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 z-10">
                    <div className="flex flex-col items-center">
                      <div className={`transition-all duration-300 ${
                        isAnimating ? 'scale-125 text-primary' : 'text-muted-foreground'
                      }`}>
                        <ArrowDownRight className="w-6 h-6" />
                      </div>
                      {/* Data packet visualization */}
                      <div className={`mt-1 px-2 py-1 rounded text-xs font-mono bg-background border transition-all duration-300 ${
                        isAnimating ? 'border-primary text-primary shadow-lg shadow-primary/20' : 'border-muted-foreground/20 text-muted-foreground'
                      }`}>
                        {index === 0 && '448×448'}
                        {index === 1 && '1024 tokens'}
                        {index === 2 && 'Output'}
                        {index === 3 && 'Response'}
                      </div>
                    </div>
                  </div>
                )}

                <Card 
                  className={`relative overflow-hidden border-2 transition-all duration-300 ${
                    isAnimating 
                      ? 'border-primary shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'border-border hover:border-primary/50'
                  } ${isExpanded ? 'shadow-lg' : ''}`}
                >
                  {/* Animated gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${stage.bgGradient} transition-opacity duration-300 ${
                    isAnimating ? 'opacity-100' : 'opacity-50'
                  }`} />
                  
                  {/* Flowing data particles inside card */}
                  {isAnimating && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute w-2 h-2 bg-primary rounded-full animate-ping" style={{ top: '20%', left: '10%' }} />
                      <div className="absolute w-2 h-2 bg-primary rounded-full animate-ping" style={{ top: '60%', left: '30%', animationDelay: '0.2s' }} />
                      <div className="absolute w-2 h-2 bg-primary rounded-full animate-ping" style={{ top: '40%', right: '20%', animationDelay: '0.4s' }} />
                    </div>
                  )}
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Stage Icon with pulse animation */}
                        <div className="relative">
                          <div className={`p-4 rounded-xl bg-gradient-to-br ${stage.bgGradient} border-2 transition-all duration-300 ${
                            isAnimating 
                              ? `${stage.color.replace('text-', 'border-')} shadow-lg` 
                              : 'border-muted'
                          }`}>
                            <div className={`${stage.color} transition-transform duration-300 ${
                              isAnimating ? 'scale-110' : ''
                            }`}>
                              {stage.icon}
                            </div>
                          </div>
                          {/* Processing indicator */}
                          {isAnimating && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse">
                              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{stage.title}</CardTitle>
                            {isAnimating && (
                              <Badge variant="default" className="animate-pulse">
                                Processing
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {stage.subtitle}
                          </CardDescription>

                          {/* Technical Specs with data flow info */}
                          {stage.technicalSpecs && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {stage.technicalSpecs.map((spec, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className={`text-xs transition-all duration-300 ${
                                    isAnimating ? 'bg-primary/20 border-primary' : ''
                                  }`}
                                >
                                  <span className="font-semibold">{spec.label}:</span>
                                  <span className="ml-1">{spec.value}</span>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Expand Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStage(stage.id)}
                          className="mt-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <CardContent className="relative pt-0">
                      <div className="space-y-4">
                        {/* Key Details */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Key Features
                          </h4>
                          <ul className="space-y-2">
                            {stage.details.map((detail, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Sub-stages */}
                        {stage.subStages && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-yellow-500" />
                              Process Breakdown
                            </h4>
                            <div className="space-y-3">
                              {stage.subStages.map((subStage, idx) => {
                                const subStageId = `${stage.id}-substage-${idx}`;
                                const isSubStageExpanded = expandedSubStages.includes(subStageId);
                                
                                return (
                                  <div key={idx}>
                                    <div className="bg-muted/50 rounded-lg p-3 border">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-sm mb-1">{subStage.name}</h5>
                                          <p className="text-xs text-muted-foreground">{subStage.description}</p>
                                        </div>
                                        {subStage.expandable && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleSubStage(subStageId)}
                                            className="h-6 w-6 p-0"
                                          >
                                            {isSubStageExpanded ? (
                                              <ChevronUp className="w-3 h-3" />
                                            ) : (
                                              <ChevronDown className="w-3 h-3" />
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                      
                                      {/* Expanded details */}
                                      {isSubStageExpanded && subStage.expandedDetails && (
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                          <ul className="space-y-1.5">
                                            {subStage.expandedDetails.map((detail, dIdx) => (
                                              <li key={dIdx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                                <span className="text-primary mt-0.5">→</span>
                                                <span>{detail}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Arrow between Stage A and Stage B - only for MLP Projector */}
                                    {idx === 0 && stage.subStages && stage.subStages.length > 1 && stage.id === 'mlp-projector' && (
                                      <div className="flex items-center justify-center my-2">
                                        <div className="flex items-center gap-2">
                                          <ArrowDownRight className="w-5 h-5 text-primary" />
                                          <Badge variant="default" className="text-xs font-mono">
                                            256 tokens
                                          </Badge>
                                        </div>
                                      </div>
                                    )}
                                    {/* Arrow from Stage B to next stage (GPT-OSS) */}
                                    {idx === (stage.subStages?.length ?? 0) - 1 && stage.id === 'mlp-projector' && (
                                      <div className="flex items-center justify-center my-3 pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                          <ArrowDownRight className="w-5 h-5 text-primary" />
                                          <Badge variant="default" className="text-xs font-mono">
                                            2880-dim (Output)
                                          </Badge>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add keyframes for animation */}
      <style jsx>{`
        @keyframes flowDown {
          0% {
            top: -10%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 110%;
            opacity: 0;
          }
        }
      `}</style>

      {/* Summary Footer */}
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Pipeline Summary</h3>
              <p className="text-sm text-muted-foreground">
                Input image → Dynamic tiling (448×448) → InternViT encoder (1024 tokens) → 
                MLP compression (256 tokens) → GPT-OSS reasoning (2880-dim) → Output response.
                Trained through CPT (image understanding) → SFT (instruction following) → RL (reasoning improvement).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisionPipeline;
