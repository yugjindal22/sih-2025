import { type AnalysisData } from "@/features/chat-analysis/components/AnalysisDashboard";

export const generateMockAnalysisData = (): AnalysisData => {
  return {
    summary: "This satellite image shows a mixed landscape with moderate vegetation cover, significant urban development, and water bodies. The vegetation health is good with an NDVI of 0.68, indicating healthy plant growth.",
    confidence: 87.5,
    landCover: {
      vegetation: 35.2,
      water: 12.5,
      urban: 28.3,
      bareSoil: 15.0,
      forest: 5.0,
      agriculture: 4.0,
    },
    vegetation: {
      health: "Good",
      ndvi: 0.68,
      density: 72.5,
      types: ["Deciduous Trees", "Grassland", "Shrubs", "Agricultural Crops"],
    },
    waterBodies: {
      totalArea: 12.5,
      quality: "Clean",
      sources: ["River", "Pond", "Reservoir"],
    },
    urban: {
      builtUpArea: 28.3,
      development: "High",
      infrastructure: ["Roads", "Buildings", "Industrial Areas", "Residential"],
    },
    environmental: {
      temperature: 28,
      humidity: 65,
      airQuality: "Good",
      cloudCover: 20,
    },
    features: [
      {
        type: "Large Water Body",
        description: "Significant river system visible in the center of the image",
        severity: "Low",
      },
      {
        type: "Urban Expansion",
        description: "Rapid urban development detected in the northeast quadrant",
        severity: "Medium",
      },
      {
        type: "Vegetation Corridor",
        description: "Green corridor along the waterway indicating riparian vegetation",
        severity: "Low",
      },
    ],
    insights: [
      "Urban areas show high density development with clear infrastructure patterns",
      "Vegetation health is good but shows signs of seasonal variation",
      "Water bodies appear clean with low turbidity",
      "Agricultural areas are actively cultivated based on spectral signatures",
      "Forest cover is limited to specific regions, mostly along water bodies",
    ],
    recommendations: [
      "Monitor urban expansion to prevent encroachment on agricultural land",
      "Maintain riparian vegetation buffers along waterways",
      "Consider implementing green infrastructure in high-density urban areas",
      "Regular monitoring of water quality in major water bodies recommended",
    ],
    coordinates: {
      latitude: 28.6139,
      longitude: 77.2090,
      location: "New Delhi Region, India",
    },
  };
};

export const parseAnalysisFromText = (text: string): AnalysisData | null => {
  // Try to extract data from plain text response as fallback
  const mock = generateMockAnalysisData();

  // Extract percentages if mentioned
  const vegMatch = text.match(/vegetation[:\s]+(\d+\.?\d*)%/i);
  if (vegMatch) mock.landCover.vegetation = parseFloat(vegMatch[1]);

  const waterMatch = text.match(/water[:\s]+(\d+\.?\d*)%/i);
  if (waterMatch) mock.landCover.water = parseFloat(waterMatch[1]);

  const urbanMatch = text.match(/urban[:\s]+(\d+\.?\d*)%/i);
  if (urbanMatch) mock.landCover.urban = parseFloat(urbanMatch[1]);

  // Extract NDVI if mentioned
  const ndviMatch = text.match(/ndvi[:\s]+(\d+\.?\d*)/i);
  if (ndviMatch) mock.vegetation.ndvi = parseFloat(ndviMatch[1]);

  // Use first few sentences as summary
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    mock.summary = sentences.slice(0, 2).join(". ") + ".";
  }

  return mock;
};
