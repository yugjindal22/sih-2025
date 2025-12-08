// Central Response Service for dynamic vision analysis
// Provides a unified interface for all response generation across the application

import type {
    VisionAdapter,
    AnalysisInput,
    AnalysisOptions,
    AnalysisResult,
} from "./adapters/visionAdapter";
import { geminiAdapter } from "./adapters/geminiAdapter";
import { localPipelineAdapter } from "./adapters/localPipelineAdapter";

export type VisionModelType = "gemini" | "local-oss";

export interface ResponseServiceConfig {
    defaultModel: VisionModelType;
    geminiApiKey?: string;
    localOssUrl?: string;
}

class ResponseService {
    private config: ResponseServiceConfig;
    private adapters: Record<VisionModelType, VisionAdapter>;

    constructor(config?: Partial<ResponseServiceConfig>) {
        this.config = {
            defaultModel: (process.env.NEXT_PUBLIC_VISION_MODEL as VisionModelType) || "gemini",
            geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            localOssUrl: process.env.NEXT_PUBLIC_LOCAL_OSS_URL,
            ...config,
        };

        // Try to load from localStorage if available (client-side)
        if (typeof window !== 'undefined') {
            const savedModel = localStorage.getItem("vision_model") as VisionModelType;
            const savedGeminiKey = localStorage.getItem("gemini_api_key");
            const savedOssUrl = localStorage.getItem("local_oss_url");

            if (savedModel) this.config.defaultModel = savedModel;
            if (savedGeminiKey) this.config.geminiApiKey = savedGeminiKey;
            if (savedOssUrl) this.config.localOssUrl = savedOssUrl;
        }

        // Initialize adapters with config
        this.adapters = {
            gemini: new (geminiAdapter.constructor as any)(this.config.geminiApiKey),
            "local-oss": new (localPipelineAdapter.constructor as any)(this.config.localOssUrl),
        };
    }

    /**
     * Get the current active adapter based on configuration
     */
    private getActiveAdapter(): VisionAdapter {
        return this.adapters[this.config.defaultModel];
    }

    /**
     * Analyze an image using the configured vision model
     */
    async analyzeImage(
        input: AnalysisInput,
        options?: AnalysisOptions & { model?: VisionModelType }
    ): Promise<AnalysisResult> {
        // Allow overriding the model per request
        const modelToUse = options?.model || this.config.defaultModel;
        const adapter = this.adapters[modelToUse];

        if (!adapter) {
            throw new Error(`Unknown vision model: ${modelToUse}`);
        }

        // Remove model from options before passing to adapter
        const { model, ...adapterOptions } = options || {};

        return adapter.analyzeImage(input, adapterOptions);
    }

    /**
     * Switch the default model dynamically
     */
    setDefaultModel(model: VisionModelType): void {
        if (!this.adapters[model]) {
            throw new Error(`Unknown vision model: ${model}`);
        }
        this.config.defaultModel = model;
    }

    /**
     * Get information about available models
     */
    getAvailableModels(): Array<{ type: VisionModelType; name: string; description: string }> {
        return [
            {
                type: "gemini",
                name: "Google Gemini",
                description: "Cloud-based multimodal model by Google"
            },
            {
                type: "local-oss",
                name: "Local OSS Pipeline",
                description: "Self-hosted multimodal model (InternVL2-2B)"
            }
        ];
    }

    /**
     * Get current configuration (without sensitive data)
     */
    getConfig(): Omit<ResponseServiceConfig, 'geminiApiKey'> {
        return {
            defaultModel: this.config.defaultModel,
            localOssUrl: this.config.localOssUrl,
        };
    }

    /**
     * Update configuration
     */
    updateConfig(updates: Partial<ResponseServiceConfig>): void {
        this.config = { ...this.config, ...updates };

        // Save to localStorage if available (client-side)
        if (typeof window !== 'undefined') {
            if (updates.defaultModel) localStorage.setItem("vision_model", updates.defaultModel);
            if (updates.geminiApiKey) localStorage.setItem("gemini_api_key", updates.geminiApiKey);
            if (updates.localOssUrl) localStorage.setItem("local_oss_url", updates.localOssUrl);
        }

        // Reinitialize adapters with new config
        this.adapters = {
            gemini: new (geminiAdapter.constructor as any)(this.config.geminiApiKey),
            "local-oss": new (localPipelineAdapter.constructor as any)(this.config.localOssUrl),
        };
    }
}

// Export singleton instance
export const responseService = new ResponseService();

// Export types and utilities
export type { AnalysisInput, AnalysisOptions, AnalysisResult };