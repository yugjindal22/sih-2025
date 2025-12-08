import {
    ArrowLeftRight,
    Crosshair,
    MessageSquare,
    Network,
    BarChart3,
    Eye,
    TrendingUp,
    Brain,
    Clock,
    Layers,
    CloudOff,
    type LucideIcon,
} from "lucide-react";

export interface FeatureModule {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    implemented: boolean;
    route: string;
    fromPrototype: boolean;
}

export const features: FeatureModule[] = [
    {
        id: "compare-mode",
        title: "Temporal Comparison",
        description: "AI-powered change detection and temporal analysis for multi-date satellite imagery",
        icon: ArrowLeftRight,
        implemented: true,
        route: "/dashboard/features/compare-mode",
        fromPrototype: true,
    },
    {
        id: "roi-analysis",
        title: "Region of Interest",
        description: "Focused analysis on specific geographic areas with precision targeting",
        icon: Crosshair,
        implemented: true,
        route: "/dashboard/features/roi-analysis",
        fromPrototype: true,
    },
    {
        id: "chat-analysis",
        title: "Interactive Analysis",
        description: "Conversational interface for Earth Observation data exploration and querying",
        icon: MessageSquare,
        implemented: true,
        route: "/dashboard/features/chat-analysis",
        fromPrototype: true,
    },
    {
        id: "vision-pipeline-visualizer",
        title: "Pipeline Architecture",
        description: "Visualize the multimodal vision processing pipeline and data flow",
        icon: Network,
        implemented: true,
        route: "/dashboard/features/vision-pipeline-visualizer",
        fromPrototype: true,
    },
    {
        id: "analysis-dashboard",
        title: "Metrics Dashboard",
        description: "Comprehensive analytics with land cover, vegetation, and environmental metrics",
        icon: BarChart3,
        implemented: true,
        route: "/dashboard/features/analysis-dashboard",
        fromPrototype: true,
    },
    {
        id: "attention-heatmap",
        title: "Attention Visualization",
        description: "Model attention patterns and focus areas in satellite imagery analysis",
        icon: Eye,
        implemented: true,
        route: "/dashboard/features/attention-heatmap",
        fromPrototype: true,
    },
    {
        id: "quantitative-insights",
        title: "Quantitative Metrics",
        description: "Extract and visualize numerical data from Earth Observation analysis",
        icon: TrendingUp,
        implemented: true,
        route: "/dashboard/features/quantitative-insights",
        fromPrototype: true,
    },
    {
        id: "reasoning-trace",
        title: "Explainable AI",
        description: "Step-by-step visualization of AI reasoning for transparent decision-making",
        icon: Brain,
        implemented: true,
        route: "/dashboard/features/reasoning-trace",
        fromPrototype: true,
    },
    {
        id: "temporal-fusion",
        title: "Temporal Fusion",
        description: "Multi-temporal data fusion for time-series analysis and trend detection",
        icon: Clock,
        implemented: true,
        route: "/dashboard/features/temporal-fusion",
        fromPrototype: false,
    },
    {
        id: "cloud-masking",
        title: "Cloud Masking",
        description: "Automated cloud detection and removal from satellite imagery",
        icon: CloudOff,
        implemented: true,
        route: "/dashboard/features/cloud-masking",
        fromPrototype: false,
    },
    {
        id: "multi-sensor-fusion",
        title: "Multi-Sensor Fusion",
        description: "Integrate data from multiple satellite sensors for enhanced analysis",
        icon: Layers,
        implemented: false,
        route: "/dashboard/features/multi-sensor-fusion",
        fromPrototype: false,
    },
];

export function getFeatureById(id: string): FeatureModule | undefined {
    return features.find((feature) => feature.id === id);
}

export function getImplementedFeatures(): FeatureModule[] {
    return features.filter((feature) => feature.implemented);
}

export function getPlaceholderFeatures(): FeatureModule[] {
    return features.filter((feature) => !feature.implemented);
}
