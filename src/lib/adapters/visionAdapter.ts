// Vision Adapter Interface for multimodal analysis

export interface AnalysisInput {
    imageUrl: string;
    prompt: string;
    metadata?: Record<string, any>;
}

export interface AnalysisOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
}

export interface AnalysisResult {
    text: string;
    confidence?: number;
    metadata?: Record<string, any>;
}

export interface VisionAdapter {
    name: string;
    analyzeImage(
        input: AnalysisInput,
        options?: AnalysisOptions
    ): Promise<AnalysisResult>;
}
