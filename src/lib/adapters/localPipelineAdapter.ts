// Local Pipeline Adapter - Implementation for multimodal OSS backend

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
    VisionAdapter,
    AnalysisInput,
    AnalysisOptions,
    AnalysisResult,
} from "./visionAdapter";

export class LocalPipelineAdapter implements VisionAdapter {
    name = "Local GPT-OSS Pipeline";
    private baseUrl: string;
    private geminiClient: GoogleGenerativeAI;

    constructor(baseUrl?: string, geminiApiKey?: string) {
        // Ensure baseUrl doesn't end with /chat since we add it in the fetch call
        let url = baseUrl || process.env.NEXT_PUBLIC_LOCAL_OSS_URL || "";
        if (url.endsWith('/chat')) {
            url = url.slice(0, -5); // Remove '/chat' from the end
        }
        this.baseUrl = url;
        
        const apiKey = geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
        this.geminiClient = new GoogleGenerativeAI(apiKey);
    }

    private async sanitizeWithGemini(rawText: string): Promise<string> {
        if (!this.geminiClient) {
            console.warn("Gemini client not initialized for sanitization");
            return rawText;
        }

        const sanitizationPrompt = `You are a JSON sanitizer. The following text contains a JSON response but may have extra tokens, markdown formatting, or other artifacts. Extract ONLY the valid JSON object and return it as clean, parseable JSON. Do not add any explanation, just return the clean JSON.

Raw text:
${rawText}

Return only the clean JSON:`;

        try {
            const model = this.geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(sanitizationPrompt);
            const response = await result.response;
            const sanitizedText = response.text();
            
            // Remove any markdown code blocks if present
            let cleaned = sanitizedText.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.slice(7);
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.slice(3);
            }
            if (cleaned.endsWith('```')) {
                cleaned = cleaned.slice(0, -3);
            }
            
            console.log("Sanitized JSON from Gemini:", cleaned);
            return cleaned.trim();
        } catch (error) {
            console.error("Gemini sanitization failed with detailed error:", error);
            return rawText;
        }
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

        let response;
        try {
            response = await fetch(`${this.baseUrl}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(payload),
                // No timeout or keepalive - allow unlimited processing time
            });
        } catch (fetchError: any) {
            console.error("Fetch error details:", fetchError);
            throw new Error(`Failed to connect to Local OSS backend at ${this.baseUrl}/chat. Please check:\n1. Backend server is running\n2. URL is correct: ${this.baseUrl}\n3. CORS is enabled on backend\n4. Network connectivity\n\nError: ${fetchError.message}`);
        }

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

        console.log("Received payload from Local OSS backend:", data);

        let responseText = data.response;
        let parsedResponse: any = null;

        // Remove <|im_end|> if present
        if (responseText.endsWith('<|im_end|>')) {
            responseText = responseText.slice(0, -10);
        }

        // Always sanitize with Gemini first
        console.log("Sanitizing response with Gemini...");
        const sanitizedText = await this.sanitizeWithGemini(responseText);
        let finalText = sanitizedText;
        try {
            parsedResponse = JSON.parse(sanitizedText);
            // Return the sanitized JSON string so Chat.tsx can parse it consistently
            finalText = sanitizedText;
        } catch (e) {
            // Still failed, use as plain text
            console.warn("JSON parse failed even after sanitization:", e);
            parsedResponse = { summary: responseText };
            // Return plain text if JSON parsing fails
            finalText = responseText;
        }

        return {
            text: finalText,
            confidence: parsedResponse.confidence ? parsedResponse.confidence / 100 : 0.85,
            metadata: {
                model: data.model || parsedResponse.model || "OpenGVLab/InternVL2-2B",
                images_processed: data.images_processed || imageUrls.length,
                ...metadata,
            },
        };
    }
}

// Export singleton instance
export const localPipelineAdapter = new LocalPipelineAdapter();
