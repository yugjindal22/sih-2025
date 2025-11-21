// Copied from prototype - Vision Pipeline Visualizer feature

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import VisionPipeline from "@/features/vision-pipeline-visualizer/components/VisionPipeline";

export default function VisionPipelineVisualizerPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4">Vision Pipeline Visualizer</h1>
                    <p className="text-muted-foreground mb-8">
                        Explore the multimodal vision processing pipeline architecture
                    </p>

                    <VisionPipeline isActive={true} />
                </div>
            </div>
        </div>
    );
}
