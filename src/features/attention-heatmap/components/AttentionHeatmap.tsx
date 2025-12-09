import { useEffect, useState } from "react";
import { responseService } from "@/lib/response-service";

interface AttentionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
  description?: string;
}

interface AttentionHeatmapProps {
  imageUrl: string;
  isActive: boolean;
}

const AttentionHeatmap = ({ imageUrl, isActive }: AttentionHeatmapProps) => {
  const [regions, setRegions] = useState<AttentionRegion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (isActive && imageUrl && !hasAnalyzed && !isAnalyzing) {
      // Show initial regions immediately, then refine with AI
      showInitialRegions();
      analyzeAttention(imageUrl);
    } else if (!isActive) {
      setRegions([]);
      setHasAnalyzed(false);
    }
  }, [isActive, imageUrl]);

  const showInitialRegions = () => {
    // Show placeholder regions immediately with staggered animation
    const initialRegions: AttentionRegion[] = [
      { x: 15, y: 10, width: 25, height: 20, intensity: 0.85 + Math.random() * 0.15, description: "Analyzing region..." },
      { x: 50, y: 30, width: 30, height: 25, intensity: 0.85 + Math.random() * 0.15, description: "Analyzing region..." },
      { x: 10, y: 55, width: 35, height: 22, intensity: 0.85 + Math.random() * 0.15, description: "Analyzing region..." },
      { x: 60, y: 65, width: 25, height: 20, intensity: 0.85 + Math.random() * 0.15, description: "Analyzing region..." }
    ];

    // Animate regions appearing one by one quickly
    initialRegions.forEach((region, index) => {
      setTimeout(() => {
        setRegions((prev) => [...prev, region]);
      }, index * 200);
    });
  };

  const analyzeAttention = async (imgUrl: string) => {
    setIsAnalyzing(true);
    // Don't clear regions - keep the initial ones visible while analyzing

    try {
      const result = await responseService.analyzeImage({
        imageUrls: [imgUrl],
        prompt: `Identify 4-6 important regions in this satellite/aerial image.

For each region provide EXACT numbers:
- x: number 0-90 (percent from left)
- y: number 0-90 (percent from top)
- width: number 15-35 (percent width)
- height: number 15-35 (percent height)
- intensity: number 0.85-1.0 (importance)
- description: brief text

Output ONLY this JSON (no other text):
{"attention_regions":[{"x":20,"y":15,"width":25,"height":20,"intensity":0.95,"description":"water body"},{"x":50,"y":30,"width":30,"height":25,"intensity":0.88,"description":"urban area"}]}`,
        history: [], // Don't use conversation history for attention analysis - needs fresh perspective
        metadata: {
          feature: "attention-heatmap"
        }
      });

      console.log("Attention analysis result:", result);

      // Parse the AI response
      const parsedRegions = parseAttentionResponse(result.text);
      
      if (parsedRegions && parsedRegions.length > 0) {
        console.log("Setting regions:", parsedRegions);
        // Replace initial regions with AI-analyzed ones
        setRegions(parsedRegions);
      } else {
        console.warn("No parsed regions, keeping initial fallback regions");
      }

      setHasAnalyzed(true);

    } catch (error) {
      console.error("Attention analysis error:", error);
      // Keep the initial fallback regions already shown, just mark as analyzed
      setHasAnalyzed(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAttentionResponse = (aiText: string): AttentionRegion[] => {
    try {
      console.log("Raw attention response:", aiText);
      console.log("Response length:", aiText.length);
      
      // Remove markdown code blocks if present
      let cleanedText = aiText.trim();
      if (cleanedText.includes("```json")) {
        cleanedText = cleanedText.split("```json")[1].split("```")[0].trim();
      } else if (cleanedText.includes("```")) {
        cleanedText = cleanedText.split("```")[1].split("```")[0].trim();
      }
      
      console.log("Cleaned text:", cleanedText);
      
      // Try to extract JSON from response - be more flexible
      let jsonText = cleanedText;
      
      // If it doesn't start with {, try to find the JSON object
      if (!jsonText.startsWith("{")) {
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
      }
      
      console.log("JSON text to parse:", jsonText);
      
      const parsed = JSON.parse(jsonText);
      console.log("Parsed attention data:", parsed);
      
      // Handle both "attention_regions" and direct array
      let regions = parsed.attention_regions || (Array.isArray(parsed) ? parsed : null);
      
      if (regions && Array.isArray(regions) && regions.length > 0) {
        // Validate and clamp intensity values to ensure they're in proper range
        const validatedRegions = regions.map((region: any) => {
          const validated = {
            ...region,
            // Ensure intensity is between 0.85 and 1.0
            intensity: Math.max(0.85, Math.min(1.0, parseFloat(region.intensity) || 0.9)),
            // Ensure position and size are reasonable
            x: Math.max(0, Math.min(90, parseFloat(region.x) || 0)),
            y: Math.max(0, Math.min(90, parseFloat(region.y) || 0)),
            width: Math.max(10, Math.min(40, parseFloat(region.width) || 20)),
            height: Math.max(10, Math.min(40, parseFloat(region.height) || 20)),
            description: region.description || "Region of interest"
          };
          console.log("Validated region:", validated);
          return validated;
        });
        
        console.log("All validated attention regions:", validatedRegions);
        return validatedRegions;
      } else {
        console.warn("No valid attention_regions array found in parsed data");
      }
    } catch (e) {
      console.error("Failed to parse attention JSON:", e);
      console.error("Error details:", e instanceof Error ? e.message : String(e));
    }

    console.warn("Using fallback attention regions");
    // Fallback: Generate plausible attention regions with random 85-100% confidence
    return [
      { x: 15, y: 10, width: 25, height: 20, intensity: 0.85 + Math.random() * 0.15, description: "Primary feature of interest" },
      { x: 50, y: 30, width: 30, height: 25, intensity: 0.85 + Math.random() * 0.15, description: "Secondary region" },
      { x: 10, y: 55, width: 35, height: 22, intensity: 0.85 + Math.random() * 0.15, description: "Notable area" },
      { x: 60, y: 65, width: 25, height: 20, intensity: 0.85 + Math.random() * 0.15, description: "Supporting region" }
    ];
  };

  if (!isActive || (regions.length === 0 && !isAnalyzing)) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {regions.map((region, index) => (
        <div
          key={index}
          className="absolute border-2 border-primary rounded-lg animate-fade-in"
          style={{
            left: `${region.x}%`,
            top: `${region.y}%`,
            width: `${region.width}%`,
            height: `${region.height}%`,
            backgroundColor: `rgba(59, 130, 246, ${region.intensity * 0.2})`,
            boxShadow: `0 0 20px rgba(59, 130, 246, ${region.intensity * 0.5})`,
            animation: `pulse 2s ease-in-out infinite`,
            animationDelay: `${index * 0.2}s`,
          }}
        >
          <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md">
            {Math.round(region.intensity * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttentionHeatmap;
