"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";
import SatelliteTileViewer from "@/features/satellite-tile-viewer/components/SatelliteTileViewer";
import { useState, useRef } from "react";

export default function SatelliteTileViewerPage() {
    const [showDashboard, setShowDashboard] = useState(false);
    const closeAnalysisRef = useRef<(() => void) | null>(null);

    const handleCloseDashboard = () => {
        if (closeAnalysisRef.current) {
            closeAnalysisRef.current();
        }
    };

    return (
        <div className="h-screen bg-background flex flex-col">
            <div className="container mx-auto px-4 py-4 flex items-center gap-2">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
                {showDashboard && (
                    <Button 
                        variant="outline" 
                        className="mb-2 border-primary text-primary hover:bg-primary/10"
                        onClick={handleCloseDashboard}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Close Analysis
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                <SatelliteTileViewer 
                    onDashboardStateChange={setShowDashboard}
                    onCloseAnalysisRef={closeAnalysisRef}
                />
            </div>
        </div>
    );
}
