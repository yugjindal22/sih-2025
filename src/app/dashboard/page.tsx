"use client";

import { features } from "@/lib/feature-config";
import FeatureCard from "@/components/feature-card";
import { Layers } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        {/* Header */}
        <div className="mb-10 sm:mb-12 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Analysis Modules
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Earth Observation Analysis Platform
              </p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-7xl">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </div>
  );
}
