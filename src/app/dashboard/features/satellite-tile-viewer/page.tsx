"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import SatelliteTileViewer from "@/features/satellite-tile-viewer/components/SatelliteTileViewer";

export default function SatelliteTileViewerPage() {
    return (
        <div className="h-screen bg-background flex flex-col">
            <div className="container mx-auto px-4 py-4">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="flex-1 overflow-hidden">
                <SatelliteTileViewer />
            </div>
        </div>
    );
}
