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

    private sanitizeResponse(raw: string): string {
        if (!raw || typeof raw !== 'string') return raw;

        // 1. Remove special tokens. 
        // We replace with "" (empty string) instead of " " to avoid breaking words,
        // but we normalize multiple spaces/newlines later.
        let text = raw
            .replace(/<\|im_end\|>/g, '')
            .replace(/<\|im_start\|>[^\n]*/g, '')
            .replace(/<\|[^|]*\|>/g, '')
            .trim();

        // 2. Repair common model hallucinations: Missing commas between fields.
        // This looks for "property": "value" followed by "nextProperty" without a comma.
        text = text.replace(/("(?:\\[^"]|[^"])*")\s*\n?\s*("(?:\\[^"]|[^"])*"\s*:)/g, '$1, $2');

        // 3. Extract JSON objects
        const jsonObjects = this.extractAllJsonObjects(text);

        if (jsonObjects.length === 0) return text;

        // 4. Handle the "Repetition" Quirk.
        // If the objects are identical or highly similar, we just want the first one.
        // If the model fragmented one object into pieces, we merge them.
        const merged: Record<string, any> = {};
        
        // We reverse the array and then assign so that the FIRST occurrence 
        // actually "wins" (as later assignments in a loop overwrite earlier ones).
        const uniqueObjects = jsonObjects.filter((obj, index, self) => 
            index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(obj))
        );

        for (const obj of uniqueObjects) {
            Object.assign(merged, obj);
        }

        return JSON.stringify(merged, null, 2);
    }

    private extractAllJsonObjects(text: string): Record<string, any>[] {
        const results: Record<string, any>[] = [];
        let pos = 0;

        // Normalize potential "JSON-like" noise (like backticks)
        const cleanText = text.replace(/```json|```/g, '');

        while (pos < cleanText.length) {
            const start = cleanText.indexOf('{', pos);
            if (start === -1) break;

            let depth = 0;
            let inString = false;
            let escape = false;
            let end = -1;

            for (let i = start; i < cleanText.length; i++) {
                const ch = cleanText[i];
                if (escape) { escape = false; continue; }
                if (ch === '\\' && inString) { escape = true; continue; }
                if (ch === '"') { inString = !inString; continue; }
                if (inString) continue;

                if (ch === '{') depth++;
                else if (ch === '}') {
                    depth--;
                    if (depth === 0) { end = i; break; }
                }
            }

            if (end === -1) break;

            const candidate = cleanText.substring(start, end + 1);
            try {
                // Remove trailing commas before parsing (common in LLM output)
                const fixedCandidate = candidate.replace(/,\s*([\]}])/g, '$1');
                const parsed = JSON.parse(fixedCandidate);
                results.push(parsed);
            } catch (e) {
                // If it fails, we move forward slightly to find the next potential '{'
            }
            pos = end + 1;
        }
        return results;
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
            images: base64Images,
            history: history || []
        };

        console.log(`\n========================================`);
        console.log(`🚀 OUTGOING REQUEST TO LOCAL OSS BACKEND`);
        console.log(`URL: ${this.baseUrl}/chat`);
        console.log(`Feature/Metadata:`, metadata);
        console.log(`Prompt Preview (${prompt.length} chars):`, prompt.substring(0, 500) + (prompt.length > 500 ? "...\n[TRUNCATED]" : ""));
        console.log(`Images: ${base64Images.length}`);
        console.log(`========================================\n`);

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
            // Skip sanitization for raw responses (e.g., VQA evaluation)
            console.log("Skipping sanitization - returning raw response");
            finalText = responseText.trim();
        } else {
            // Sanitize using custom logic
            console.log("Sanitizing response locally...");
            const sanitizedText = this.sanitizeResponse(responseText);
            finalText = sanitizedText;
            try {
                parsedResponse = JSON.parse(sanitizedText);
                // Return the sanitized JSON string so Chat.tsx can parse it consistently
                finalText = sanitizedText;
            } catch (e) {
                // Still failed, use as plain text
                console.warn("JSON parse failed even after local sanitization:", e);
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
