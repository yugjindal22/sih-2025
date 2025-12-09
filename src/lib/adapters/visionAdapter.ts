// Vision Adapter Interface for multimodal analysis

export interface AnalysisInput {
    imageUrls: string[]; // Changed to array to support multiple images
    prompt: string;
    metadata?: Record<string, any>;
    history?: Array<{role: string, content: string}>; // Conversation history for context
}

export interface AnalysisOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    skipSanitization?: boolean; // Skip Gemini post-processing for raw responses
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
