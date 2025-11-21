"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
    const { theme, setTheme } = useTheme();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-3 font-semibold">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 blur-md opacity-40" />
                        <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                            <Satellite className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                        GeoVision Observatory
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-300">
                            Platform
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-300">
                            Settings
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="w-9 h-9"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
