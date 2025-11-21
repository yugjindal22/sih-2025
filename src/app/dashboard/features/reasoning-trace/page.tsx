// Copied from prototype - Reasoning Trace feature

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReasoningTracePage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>

                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-4">Reasoning Trace</h1>
                    <p className="text-muted-foreground mb-8">
                        Step-by-step visualization of AI reasoning for explainable outputs
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This feature provides step-by-step visualization of the AI's reasoning process.
                        Use Chat Analysis to see how the model arrives at its conclusions with transparent, explainable steps.
                    </p>
                </div>
            </div>
        </div>
    );
}
