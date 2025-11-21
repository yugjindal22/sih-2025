// Gemini Vision Adapter - Default adapter using Gemini API

import type {
    VisionAdapter,
    AnalysisInput,
    AnalysisOptions,
    AnalysisResult,
} from "./visionAdapter";

export class GeminiAdapter implements VisionAdapter {
    name = "Gemini";
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey =
            apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    }

    async analyzeImage(
        input: AnalysisInput,
        options?: AnalysisOptions
    ): Promise<AnalysisResult> {
        const { imageUrl, prompt, metadata } = input;
        const model = options?.model || "gemini-2.5-flash";

        // Convert image to base64
        const base64Image = imageUrl.split(",")[1];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: base64Image,
                                    },
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response from Gemini";

        return {
            text,
            metadata: {
                model,
                ...metadata,
            },
        };
    }
}

// Export singleton instance
export const geminiAdapter = new GeminiAdapter();
