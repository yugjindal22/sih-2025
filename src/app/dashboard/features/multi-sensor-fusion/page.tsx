import { Button } from "@/components/ui/button";
import { Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MultiSensorFusionPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <div className="inline-flex p-6 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 rounded-2xl mb-6">
                            <Layers className="w-16 h-16 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">Multi-Sensor Fusion</h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                            Integrate data from multiple satellite sensors for enhanced analysis
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 mb-8">
                            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                In Development
                            </span>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        This module is currently under development. It will enable fusion of data from
                        multiple satellite sensors (optical, SAR, thermal, etc.) to provide comprehensive
                        multi-spectral analysis and enhanced feature detection capabilities.
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
