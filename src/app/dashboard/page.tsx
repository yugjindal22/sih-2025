"use client";

import { features } from "@/lib/feature-config";
import FeatureCard from "@/components/feature-card";
import { Layers } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                                Analysis Modules
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Select a module to begin Earth Observation analysis
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
                    {features.map((feature) => (
                        <FeatureCard key={feature.id} feature={feature} />
                    ))}
                </div>
            </div>
        </div>
    );
}
