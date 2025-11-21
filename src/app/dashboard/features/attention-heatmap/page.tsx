// Copied from prototype - Attention Heatmap feature

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AttentionHeatmapPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-4">Attention Heatmap</h1>
                    <p className="text-muted-foreground mb-8">
                        Visualize model attention patterns in satellite imagery
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This feature displays attention heatmaps during analysis in the Chat Analysis feature.
                        The heatmap shows which areas of the image the AI model is focusing on during processing.
                    </p>
                </div>
            </div>
        </div>
    );
}
