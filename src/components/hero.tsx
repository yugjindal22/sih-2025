"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Satellite, Zap, Globe2 } from "lucide-react";
import RotatingEarth from "@/components/RotatingEarth";
import InstallPWAButton from "@/components/install-pwa-button";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6 sm:space-y-8 text-left max-w-2xl">
            {/* ISRO Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 shadow-sm">
              <Satellite className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ISRO Earth Observation Platform
              </span>
            </div>

            {/* Main heading */}
            <div className="space-y-4 sm:space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Multimodal Earth
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Observation Analysis
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Advanced AI-powered platform combining vision encoders with large language models for comprehensive satellite imagery analysis and insights.
              </p>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                    Real-time Analysis
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Process satellite imagery instantly
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                  <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                    Change Detection
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Track temporal variations
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-2">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full text-base px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Launch Platform
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard/features/vision-pipeline-visualizer" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-base px-8 h-12 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  View Architecture
                </Button>
              </Link>
              <div className="w-full sm:w-auto">
                <InstallPWAButton />
              </div>
            </div>
          </div>

          {/* Right side - Rotating Earth */}
          <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[580px] flex items-center justify-center">
            <RotatingEarth />
          </div>
        </div>
      </div>
    </div>
  );
}
