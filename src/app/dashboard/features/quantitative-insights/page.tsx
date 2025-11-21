// Copied from prototype - Quantitative Insights feature

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function QuantitativeInsightsPage() {
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
                    <h1 className="text-4xl font-bold mb-4">Quantitative Insights</h1>
                    <p className="text-muted-foreground mb-8">
                        Extract and visualize quantitative metrics from analysis
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This feature extracts quantitative metrics from AI analysis results.
                        Use Chat Analysis to generate insights with numerical data, percentages, and measurements.
                    </p>
                </div>
            </div>
        </div>
    );
}
