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

        // Check if JSON appears to be truncated (doesn't end with proper closing)
        const trimmedText = rawText.trim();
        const isTruncated = !trimmedText.endsWith('}') || 
            (trimmedText.match(/{/g) || []).length > (trimmedText.match(/}/g) || []).length;

        const sanitizationPrompt = isTruncated 
            ? `You are a JSON repair and completion assistant. The following JSON response was truncated before completion. Your task is to:
1. Complete the truncated JSON with realistic, detailed content that matches the style and context of what was already generated
2. Ensure ALL required fields are present and filled with meaningful detailed content
3. Return ONLY the complete, valid JSON

Required JSON structure (ensure ALL fields are present with detailed content):
{
  "summary": "4-5 sentence summary",
  "confidence": number,
  "landCover": {"vegetation": number, "water": number, "urban": number, "bareSoil": number, "forest": number, "agriculture": number},
  "vegetation": {"health": string, "density": number, "types": array},
  "waterBodies": {"totalArea": number, "quality": string, "sources": array},
  "urban": {"builtUpArea": number, "development": string, "infrastructure": array},
  "environmental": {"temperature": null, "humidity": null, "airQuality": string, "cloudCover": null},
  "features": [{"type": string, "description": "detailed 2-3 sentences", "severity": string}, ...at least 3 features],
  "insights": ["detailed insight 1", "detailed insight 2", ...at least 8-10 detailed insights],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

IMPORTANT: 
- Complete any truncated descriptions with detailed content
- Add missing fields based on context from existing content
- Each insight should be 2-3 detailed sentences
- Each feature description should be 2-3 detailed sentences
- Provide at least 8-10 insights based on the image analysis context

Truncated JSON to complete:
${rawText}

Return the COMPLETE JSON only:`
            : `You are a JSON sanitizer. The following text contains a JSON response but may have extra tokens, markdown formatting, or other artifacts. Extract ONLY the valid JSON object and return it as clean, parseable JSON. Do not add any explanation, just return the clean JSON.

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
            
            console.log("Sanitized/Completed JSON from Gemini:", cleaned.substring(0, 500) + "...");
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
        const { imageUrls, prompt, metadata, history } = input;
        const skipSanitization = options?.skipSanitization || false;

        if (!this.baseUrl) {
            throw new Error("Local OSS URL not configured. Set NEXT_PUBLIC_LOCAL_OSS_URL environment variable.");
        }

        // Extract base64 data for all images (remove data:image/jpeg;base64, prefix if present)
        const base64Images = imageUrls.map(imageUrl => {
            let base64 = imageUrl;
            
            // Handle data URL format (data:image/jpeg;base64,...)
            if (base64.includes(',')) {
                base64 = base64.split(',')[1];
            }
            
            // Handle HTTP URLs by skipping them (backend should handle URL fetching)
            if (base64.startsWith('http://') || base64.startsWith('https://')) {
                return base64; // Return URL as-is for backend to fetch
            }
            
            // Validate base64 length (must be multiple of 4)
            const trimmed = base64.trim();
            if (trimmed.length === 0 || trimmed.length % 4 !== 0) {
                console.warn("Invalid base64 string detected, length:", trimmed.length);
                return ""; // Return empty string for invalid base64
            }
            
            return trimmed;
        }).filter(img => img.length > 0); // Remove empty strings

        const payload: any = {
            prompt,
            max_tokens: 8192,
            temperature: 0.3
        };

        // Only add images if there are any
        if (base64Images.length > 0) {
            payload.images = base64Images;
        }

        // Add conversation history for context (if provided)
        payload.history = history || [];

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

        let finalText = responseText;
        
        if (skipSanitization) {
            // Skip Gemini sanitization for raw responses (e.g., VQA evaluation)
            console.log("Skipping sanitization - returning raw response");
            finalText = responseText.trim();
        } else {
            // Sanitize with Gemini for structured analysis
            console.log("Sanitizing response with Gemini...");
            const sanitizedText = await this.sanitizeWithGemini(responseText);
            finalText = sanitizedText;
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
        }

        return {
            text: finalText,
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
