import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TemporalFusionPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-2xl mb-6">
                            <Clock className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">Temporal Fusion</h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                            Multi-temporal data fusion for time-series analysis
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 mb-8">
                            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                In Development
                            </span>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        This module is currently under development. It will enable advanced time-series
                        analysis by fusing data from multiple temporal observations to detect trends,
                        seasonal patterns, and long-term changes in Earth Observation data.
                    </p>

                    <Link href="/dashboard">
                        <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Platform
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
