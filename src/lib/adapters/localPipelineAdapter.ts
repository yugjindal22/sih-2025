// Local Pipeline Adapter - Implementation for multimodal OSS backend

import type {
    VisionAdapter,
    AnalysisInput,
    AnalysisOptions,
    AnalysisResult,
} from "./visionAdapter";

export class LocalPipelineAdapter implements VisionAdapter {
    name = "Local GPT-OSS Pipeline";
    private baseUrl: string;

    constructor(baseUrl?: string) {
        // Ensure baseUrl doesn't end with /chat since we add it in the fetch call
        let url = baseUrl || process.env.NEXT_PUBLIC_LOCAL_OSS_URL || "";
        if (url.endsWith('/chat')) {
            url = url.slice(0, -5); // Remove '/chat' from the end
        }
        this.baseUrl = url;
    }

    async analyzeImage(
        input: AnalysisInput,
        options?: AnalysisOptions
    ): Promise<AnalysisResult> {
        const { imageUrls, prompt, metadata } = input;

        if (!this.baseUrl) {
            throw new Error("Local OSS URL not configured. Set NEXT_PUBLIC_LOCAL_OSS_URL environment variable.");
        }

        // Extract base64 data for all images (remove data:image/jpeg;base64, prefix if present)
        const base64Images = imageUrls.map(imageUrl => {
            let base64 = imageUrl;
            if (base64.includes(',')) {
                base64 = base64.split(',')[1];
            }
            return base64;
        });

        const payload: any = {
            prompt
        };

        // Only add images if there are any
        if (base64Images.length > 0) {
            payload.images = base64Images;
        }

        // Only add history if there are previous messages
        // For now, always send empty array as per spec
        payload.history = [];

        const response = await fetch(`${this.baseUrl}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // If we can't parse JSON, use the status text
                const text = await response.text().catch(() => "");
                if (text) {
                    errorMessage = text;
                }
            }
            throw new Error(`Local OSS API error: ${errorMessage}`);
        }

        const data = await response.json();

        return {
            text: data.response,
            confidence: 0.85, // Default confidence since not provided
            metadata: {
                model: data.model || "OpenGVLab/InternVL2-2B",
                images_processed: data.images_processed || imageUrls.length,
                ...metadata,
            },
        };
    }
}

// Export singleton instance
export const localPipelineAdapter = new LocalPipelineAdapter();
