// Local Pipeline Adapter - Stub for future GPT-OSS multimodal pipeline

import type {
    VisionAdapter,
    AnalysisInput,
    AnalysisOptions,
    AnalysisResult,
} from "./visionAdapter";

export class LocalPipelineAdapter implements VisionAdapter {
    name = "Local GPT-OSS Pipeline";

    async analyzeImage(
        input: AnalysisInput,
        options?: AnalysisOptions
    ): Promise<AnalysisResult> {
        // Stub implementation - will be connected to GPT-OSS multimodal pipeline
        throw new Error(
            "Local GPT-OSS Pipeline not yet implemented. This will connect to the multimodal GPT-OSS model with vision encoder alignment."
        );
    }
}

// Export singleton instance
export const localPipelineAdapter = new LocalPipelineAdapter();
