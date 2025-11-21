"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Satellite, Zap, Globe2 } from "lucide-react";
import RotatingEarth from "@/components/RotatingEarth";

export default function Hero() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left side - Text content */}
                    <div className="space-y-8">
                        {/* ISRO Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                            <Satellite className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                ISRO Earth Observation Platform
                            </span>
                        </div>

                        {/* Main heading */}
                        <div className="space-y-4">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
                                Multimodal Earth
                                <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                    Observation Analysis
                                </span>
                            </h1>
                            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
                                Advanced AI-powered platform combining vision encoders with large language models for comprehensive satellite imagery analysis and insights.
                            </p>
                        </div>

                        {/* Features list */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Real-time Analysis</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Process satellite imagery instantly</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                                    <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Change Detection</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Track temporal variations</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/dashboard">
                                <Button size="lg" className="text-base px-8 bg-blue-600 hover:bg-blue-700 text-white">
                                    Launch Platform
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/dashboard/features/vision-pipeline-visualizer">
                                <Button size="lg" variant="outline" className="text-base px-8 border-slate-300 dark:border-slate-700">
                                    View Architecture
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right side - Rotating Earth */}
                    <div className="relative h-[500px] lg:h-[600px]">
                        <RotatingEarth />
                    </div>
                </div>
            </div>
        </div>
    );
}
