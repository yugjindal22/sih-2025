"use client";

// Copied from prototype - Analysis Dashboard feature
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AnalysisDashboard from "@/features/analysis-dashboard/components/AnalysisDashboard";

export default function AnalysisDashboardPage() {
    // Mock analysis data for demonstration
    const mockAnalysisData = {
        summary: "Earth Observation analysis results",
        confidence: 85,
        landCover: {
            vegetation: 35,
            water: 15,
            urban: 25,
            bareSoil: 15,
            forest: 10,
        },
        vegetation: {
            health: "Good",
            ndvi: 0.65,
            density: 72,
            types: ["Forest", "Grassland"],
        },
        waterBodies: {
            totalArea: 15,
            quality: "Clean",
            sources: ["River", "Lake"],
        },
        urban: {
            builtUpArea: 25,
            development: "Medium",
            infrastructure: ["Roads", "Buildings"],
        },
        environmental: {
            temperature: 25,
            humidity: 60,
            airQuality: "Good",
            cloudCover: 20,
        },
        features: [],
        insights: ["Analysis complete"],
        recommendations: ["Continue monitoring"],
        coordinates: {
            latitude: 0,
            longitude: 0,
            location: "Sample Location",
        },
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                        Metrics Dashboard
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Comprehensive analytics dashboard for Earth Observation analysis
                    </p>

                    <AnalysisDashboard data={mockAnalysisData} />
                </div>
            </div>
        </div>
    );
}
