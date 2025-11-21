"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type FeatureModule } from "@/lib/feature-config";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
    feature: FeatureModule;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
    const Icon = feature.icon;

    return (
        <Link href={feature.implemented ? feature.route : "#"}>
            <Card
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-200 dark:border-slate-800 ${feature.implemented
                        ? "cursor-pointer hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-700"
                        : "cursor-not-allowed opacity-50"
                    }`}
            >
                <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className={`p-3 rounded-xl ${feature.implemented
                                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-slate-900 dark:text-white">{feature.title}</CardTitle>
                            </div>
                        </div>
                        {feature.implemented && (
                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                        )}
                    </div>
                </CardHeader>

                <CardContent className="relative">
                    <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {feature.description}
                    </CardDescription>

                    {!feature.implemented && (
                        <div className="mt-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                In Development
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
