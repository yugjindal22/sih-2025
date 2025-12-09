"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  UploadCloud,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Download,
  Search,
  Calendar,
  FileArchive,
  Satellite,
  Crosshair,
  Sparkles,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import type { ComponentType } from "react";
import ROISelector from "./ROISelector";
import AnalysisDashboard, { type AnalysisData } from "./AnalysisDashboard";
import axios from "axios";
import { responseService } from "@/lib/response-service";

interface MapViewProps {
  overlayImage: string | null;
  overlayBounds: any;
  position: any;
  setPosition: (pos: any) => void;
  setViewBounds: (bounds: any) => void;
}

// Import the full MapView component dynamically
const MapView = dynamic<MapViewProps>(
  () => import("@/features/satellite-tile-viewer/components/MapView"),
  { ssr: false }
);

interface Message {
  role: "ai" | "user" | "error";
  text: string;
}

interface DownloadedFile {
  filename: string;
  path: string;
  size_mb: number;
  modified: string;
}

interface SatelliteTileViewerProps {
  onDashboardStateChange?: (isOpen: boolean) => void;
  onCloseAnalysisRef?: React.MutableRefObject<(() => void) | null>;
}

export default function SatelliteTileViewer({ 
  onDashboardStateChange,
  onCloseAnalysisRef 
}: SatelliteTileViewerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Systems Online. Search and download Sentinel-2 data or upload existing files.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingDemo, setDownloadingDemo] = useState(false);

  // Search & Download State
  const [searchLocation, setSearchLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searching, setSearching] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);

  // Map State
  const [position, setPosition] = useState<any>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<any>(null);
  const [viewBounds, setViewBounds] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // ROI & AI Analysis State
  const [roiMode, setRoiMode] = useState(false);
  const [analyzingROI, setAnalyzingROI] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: string; content: string; image?: string }>
  >([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const BACKEND_API = "http://localhost:5001";

  // Helper function to convert image URL to base64
  const convertImageUrlToBase64 = async (url: string): Promise<string> => {
    try {
      // If it's already a data URL, extract the base64 part
      if (url.startsWith('data:')) {
        return url.split(',')[1];
      }

      // Fetch the image from URL
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix to get just the base64 data
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image URL to base64:", error);
      throw error;
    }
  };

  // Notify parent when dashboard state changes
  useEffect(() => {
    const isDashboardOpen = !!analysisData && !analyzingROI;
    onDashboardStateChange?.(isDashboardOpen);
  }, [analysisData, analyzingROI, onDashboardStateChange]);

  // Expose close function to parent via ref
  useEffect(() => {
    if (onCloseAnalysisRef) {
      onCloseAnalysisRef.current = () => {
        setAnalysisData(null);
        setRoiMode(false);
      };
    }
  }, [onCloseAnalysisRef]);

  useEffect(() => {
    setIsClient(true);

    // Fix Leaflet default icon issue
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });
    }

    // Load downloaded files on mount
    fetchDownloadedFiles();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch list of downloaded files from backend
  const fetchDownloadedFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch("http://localhost:5001/api/list-downloads");
      if (response.ok) {
        const data = await response.json();
        setDownloadedFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching downloaded files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Search and download satellite data
  const handleSearchAndDownload = async () => {
    if (!searchLocation || !startDate || !endDate) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: "Please provide location, start date, and end date",
        },
      ]);
      return;
    }

    setSearching(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: `Searching for satellite data: ${searchLocation} (${startDate} to ${endDate})`,
      },
    ]);

    try {
      const response = await fetch(
        "http://localhost:5001/api/search-and-download",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: searchLocation,
            sdate: startDate,
            edate: endDate,
            satellites: [
              "Sentinel-2A_MSI_Level-2A",
              "Sentinel-2B_MSI_Level-2A",
            ],
            max_downloads: 3,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const downloaded = data.summary?.total_downloaded || 0;
        const existed = data.summary?.already_existed || 0;
        const failed = data.summary?.failed || 0;

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `Search Complete! Found ${data.products_found} products. Downloaded: ${downloaded}, Already existed: ${existed}, Failed: ${failed}`,
          },
        ]);

        // Refresh the downloaded files list
        await fetchDownloadedFiles();

        // If coordinates available, center map
        if (data.coordinates) {
          setPosition({
            lat: data.coordinates.lat,
            lng: data.coordinates.lon,
          });
        }
      } else {
        throw new Error(data.error || "Search failed");
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: `Search Error: ${error.message}`,
        },
      ]);
    } finally {
      setSearching(false);
    }
  };

  // Process a downloaded file
  const handleProcessDownloadedFile = async (filepath: string) => {
    setProcessingFile(filepath);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: `Processing file: ${
          filepath.split("\\").pop() || filepath.split("/").pop()
        }`,
      },
    ]);

    try {
      const response = await fetch("http://localhost:5001/api/process-zip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zip_path: filepath,
        }),
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Set the overlay image and bounds from the response
      if (data.bounds && data.processed_image_url) {
        const bounds = [
          [data.bounds[1], data.bounds[0]], // Southwest corner
          [data.bounds[3], data.bounds[2]], // Northeast corner
        ];

        // Center the map on the overlay
        const centerLat = (data.bounds[1] + data.bounds[3]) / 2;
        const centerLng = (data.bounds[0] + data.bounds[2]) / 2;
        setPosition({ lat: centerLat, lng: centerLng });

        // Set bounds and image
        setOverlayBounds(bounds);
        setOverlayImage(data.processed_image_url);
        setCurrentImageUrl(data.processed_image_url);

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "✨ Processing complete! Satellite imagery loaded. You can now use ROI Analysis or ask questions.",
          },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: `Processing Error: ${error.message}`,
        },
      ]);
    } finally {
      setProcessingFile(null);
    }
  };

  // Demo locations with hardcoded satellite imagery
  const demoLocations = [
    {
      name: "Mumbai, India",
      coords: { lat: 19.076, lng: 72.8777 },
      image:
        "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=800&fit=crop",
      bounds: [
        [18.876, 72.6777],
        [19.276, 73.0777],
      ],
    },
    {
      name: "Delhi, India",
      coords: { lat: 28.6139, lng: 77.209 },
      image:
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=800&fit=crop",
      bounds: [
        [28.4139, 77.009],
        [28.8139, 77.409],
      ],
    },
    {
      name: "Bangalore, India",
      coords: { lat: 12.9716, lng: 77.5946 },
      image:
        "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&h=800&fit=crop",
      bounds: [
        [12.7716, 77.3946],
        [13.1716, 77.7946],
      ],
    },
  ];

  const handleDemoLocation = async (location: (typeof demoLocations)[0]) => {
    setDownloadingDemo(true);

    // Simulate downloading and processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Set map position and overlay
    setPosition(location.coords);
    setOverlayBounds(location.bounds);
    setOverlayImage(location.image);

    setDownloadingDemo(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5001/api/process-zip", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Set the overlay image and bounds from the response
      if (data.bounds && data.processed_image_url) {
        const bounds = [
          [data.bounds[1], data.bounds[0]], // Southwest corner
          [data.bounds[3], data.bounds[2]], // Northeast corner
        ];

        // Center the map on the overlay
        const centerLat = (data.bounds[1] + data.bounds[3]) / 2;
        const centerLng = (data.bounds[0] + data.bounds[2]) / 2;
        setPosition({ lat: centerLat, lng: centerLng });

        // Set bounds and image together to avoid race condition
        setOverlayBounds(bounds);
        setOverlayImage(data.processed_image_url);
        setCurrentImageUrl(data.processed_image_url);

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "✨ File uploaded! You can now use ROI Analysis to analyze regions of interest.",
          },
        ]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: `Upload failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ROI Analysis Handler
  const handleROISelect = async (roi: any, imageUrl?: string) => {
    if (!roi) return;

    setAnalyzingROI(true);
    setAnalysisData(null); // Clear previous analysis
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: `🎯 Analyzing ROI: ${roi.width.toFixed(
          1
        )}% × ${roi.height.toFixed(1)}%`,
      },
      {
        role: "ai",
        text: "🔄 AI is analyzing the selected region... This may take 10-30 seconds.",
      },
    ]);

    try {
      // Enhanced prompt for detailed ROI analysis
      const roiPrompt = `Analyze this satellite/aerial image region in extreme detail.

REGION DIMENSIONS: ${roi.width.toFixed(1)}% × ${roi.height.toFixed(1)}% of the full image
LOCATION: x=${roi.x.toFixed(1)}%, y=${roi.y.toFixed(1)}%

Provide comprehensive Earth Observation analysis with:

1. LAND COVER DISTRIBUTION (percentages must add to 100):
   - Vegetation coverage %
   - Water bodies %
   - Urban/built-up areas %
   - Bare soil/exposed ground %
   - Forest coverage %
   - Agricultural land %

2. VEGETATION ANALYSIS:
   - Overall health status (Excellent/Good/Moderate/Poor/Critical)
   - Estimated NDVI value (0.0-1.0)
   - Density percentage (0-100%)
   - Types of vegetation observed (list 3-5 types)

3. WATER BODIES (if present):
   - Total area percentage
   - Water quality assessment
   - Sources (rivers, lakes, reservoirs, etc.)

4. URBAN DEVELOPMENT:
   - Built-up area percentage
   - Development level (High/Medium/Low)
   - Infrastructure types (roads, buildings, industrial, etc.)

5. ENVIRONMENTAL CONDITIONS:
   - Air quality indicators (if detectable)
   - Temperature indicators: set to null
   - Humidity indicators: set to null
   - Cloud cover: set to null

6. NOTABLE FEATURES (identify 5-8 features):
   - Type of feature
   - Detailed 2-3 sentence description including location, appearance, size, color, texture, significance
   - Severity level (High/Medium/Low/Info)

7. DETAILED INSIGHTS (provide 10-15 comprehensive insights):
   - Land use patterns and spatial distribution
   - Vegetation characteristics and health indicators
   - Water resource observations
   - Urban development patterns
   - Environmental conditions
   - Terrain and soil conditions
   - Boundaries and transitions between land cover types
   - Patterns, anomalies, or unusual features
   - Spatial relationships and clustering
   - Color and texture analysis
   - Overall landscape condition

8. RECOMMENDATIONS (provide 5-7 actionable recommendations)

Return ONLY valid JSON in this exact structure:
{
  "summary": "Comprehensive 5-7 sentence summary describing the region's key characteristics, dominant features, land use, environmental conditions, and notable observations",
  "confidence": ${85 + Math.floor(Math.random() * 9)},
  "landCover": {
    "vegetation": 0,
    "water": 0,
    "urban": 0,
    "bareSoil": 0,
    "forest": 0,
    "agriculture": 0
  },
  "vegetation": {
    "health": "Good",
    "ndvi": 0.65,
    "density": 70,
    "types": ["type1", "type2", "type3"]
  },
  "waterBodies": {
    "totalArea": 0,
    "quality": "description",
    "sources": ["source1", "source2"]
  },
  "urban": {
    "builtUpArea": 0,
    "development": "Medium",
    "infrastructure": ["roads", "buildings"]
  },
  "environmental": {
    "temperature": null,
    "humidity": null,
    "airQuality": "Not detectable from imagery",
    "cloudCover": null
  },
  "features": [
    {"type": "Feature Name", "description": "Detailed 2-3 sentence description", "severity": "Medium"}
  ],
  "insights": [
    "Detailed insight 1 with 2-3 sentences",
    "Detailed insight 2 with 2-3 sentences"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

CRITICAL: Output ONLY the JSON. No markdown, no explanations. Every field must contain detailed, meaningful data based on actual observations from the image.`;

      // Convert image URL to base64 for the local LLM
      const imageToAnalyze = imageUrl || currentImageUrl || "";
      let base64Image = "";
      
      if (imageToAnalyze.startsWith('data:')) {
        // Already a data URL, just use it
        base64Image = imageToAnalyze;
      } else if (imageToAnalyze.startsWith('http')) {
        // HTTP URL - convert to base64 data URL
        const base64Data = await convertImageUrlToBase64(imageToAnalyze);
        base64Image = `data:image/jpeg;base64,${base64Data}`;
      }

      // Use responseService to call local LLM directly
      const analysisResult = await responseService.analyzeImage({
        imageUrls: [base64Image],
        prompt: roiPrompt,
        metadata: {}
      });

      const aiResponse = analysisResult.text;

      // Parse JSON response
      let parsedData: any = null;
      
      // Remove markdown code blocks if present
      let jsonText = aiResponse.trim();
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim();
      }
      
      // Try to parse as JSON
      if (jsonText.startsWith("{") || jsonText.startsWith("[")) {
        try {
          parsedData = JSON.parse(jsonText);
          console.log("Successfully parsed JSON from ROI analysis:", parsedData);
        } catch (e) {
          console.log("Could not parse ROI response as JSON:", e);
        }
      }

      // Check if we got meaningful structured data
      const hasStructuredData = parsedData && (
        parsedData.landCover ||
        parsedData.vegetation ||
        parsedData.waterBodies ||
        parsedData.urban ||
        parsedData.environmental ||
        parsedData.features ||
        parsedData.insights
      );

      // Parse the AI response and structure it
      const structuredAnalysis: AnalysisData = hasStructuredData ? {
        ...parsedData,
        summary: parsedData.summary || "ROI analysis completed",
        confidence: parsedData.confidence || (85 + Math.floor(Math.random() * 9)),
      } : {
        text: aiResponse,
        summary: "ROI analysis completed",
        confidence: 80,
      };

      setAnalysisData(structuredAnalysis);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `✅ ROI Analysis Complete! ${
            structuredAnalysis.summary || "Check the dashboard for details."
          }`,
        },
      ]);

      // Add to chat history for context
      setChatHistory((prev) => [
        ...prev,
        {
          role: "user",
          content: `Analyze this region of interest (${roi.width.toFixed(
            1
          )}% × ${roi.height.toFixed(1)}%)`,
          image: imageUrl || currentImageUrl || undefined,
        },
        {
          role: "assistant",
          content: structuredAnalysis.summary || "Analysis complete",
        },
      ]);
    } catch (error: any) {
      console.error("ROI Analysis error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: `❌ Analysis Error: ${
            error.response?.data?.error || error.message
          }`,
        },
      ]);
    } finally {
      setAnalyzingROI(false);
      setRoiMode(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    try {
      // Build conversation history (last 6 messages)
      const history = chatHistory.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Convert image URL to base64 if available
      let imageUrlsToSend: string[] = [];
      if (currentImageUrl) {
        if (currentImageUrl.startsWith('data:')) {
          imageUrlsToSend = [currentImageUrl];
        } else if (currentImageUrl.startsWith('http')) {
          const base64Data = await convertImageUrlToBase64(currentImageUrl);
          imageUrlsToSend = [`data:image/jpeg;base64,${base64Data}`];
        }
      }

      // Use responseService to call local LLM directly
      const analysisResult = await responseService.analyzeImage({
        imageUrls: imageUrlsToSend,
        prompt: userMessage,
        history: history,
        metadata: {}
      });

      const aiResponse = analysisResult.text;

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: aiResponse,
        },
      ]);

      // Update chat history
      setChatHistory((prev) => [
        ...prev,
        {
          role: "user",
          content: userMessage,
          image: currentImageUrl || undefined,
        },
        {
          role: "assistant",
          content: aiResponse,
        },
      ]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: `Chat Error: ${error.response?.data?.error || error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden p-4 gap-4">
      {/* MAP CONTAINER - Fixed size with padding */}
      <div className="relative flex-1 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-700">
        <MapView
          overlayImage={overlayImage}
          overlayBounds={overlayBounds}
          position={position}
          setPosition={setPosition}
          setViewBounds={setViewBounds}
        />

        {/* ROI Selector Overlay */}
        {roiMode && overlayImage && (
          <div className="absolute inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex-shrink-0">
                    <Crosshair className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-white">
                      ROI Analysis Mode
                    </h2>
                    <p className="text-sm text-cyan-200">
                      Click and drag to select a region of interest
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setRoiMode(false)}
                  className="gap-2 flex-shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
              <ROISelector
                imageUrl={overlayImage}
                onROISelect={handleROISelect}
                isActive={roiMode}
              />
            </div>
          </div>
        )}

        {/* Analysis Dashboard Overlay */}
        {(analysisData || analyzingROI) && !roiMode && (
          <div className="absolute inset-0 z-[450] bg-slate-950/95 dark:bg-slate-950/98 backdrop-blur-xl overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex items-center justify-between z-10 shadow-lg">
              <div className="flex items-center gap-3">
                {analyzingROI ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
                <h2 className="text-lg font-bold text-white">
                  {analyzingROI ? "Analyzing ROI..." : "AI Analysis Results"}
                </h2>
              </div>
              <Button
                size="default"
                variant="secondary"
                onClick={() => {
                  setAnalysisData(null);
                  setAnalyzingROI(false);
                }}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 gap-2"
                disabled={analyzingROI}
              >
                <XCircle className="w-4 h-4" />
                Close
              </Button>
            </div>
            {analyzingROI ? (
              <div className="p-6 space-y-4">
                <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        AI Processing Your Request
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Analyzing satellite imagery with advanced vision AI...
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                        This typically takes 10-30 seconds
                      </p>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white/50 dark:bg-slate-800/50">
                  <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    What's happening?
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Fetching satellite image data</li>
                    <li>• Processing selected region</li>
                    <li>• Running AI vision analysis</li>
                    <li>• Generating insights and metrics</li>
                  </ul>
                </Card>
              </div>
            ) : analysisData ? (
              <AnalysisDashboard data={analysisData} />
            ) : null}
          </div>
        )}

        {/* Floating UI Controls */}
        <div className="absolute top-20 left-4 z-[400] flex flex-col gap-3 max-w-xs">
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-slate-200 dark:border-slate-700 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-sm text-slate-900 dark:text-white">
                    Satellite Tile Viewer
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    GEO Analysis Interface
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg gap-2 text-sm h-10"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Sentinel-2 Tile
          </Button>

          {/* ROI Mode Toggle */}
          {overlayImage && (
            <Button
              onClick={() => {
                setRoiMode(!roiMode);
                setAnalysisData(null);
              }}
              disabled={analyzingROI}
              className={`shadow-lg gap-2 text-sm h-10 ${
                roiMode
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              } text-white`}
            >
              {analyzingROI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4" />
                  {roiMode ? "Exit ROI Mode" : "🎯 ROI Analysis"}
                </>
              )}
            </Button>
          )}

          {position && (
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-mono">
                    {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".zip,.tif,.tiff"
          onChange={handleFileSelect}
        />
      </div>

      {/* CHAT SIDEBAR - Expandable with toggle */}
      <div className={`${sidebarExpanded ? 'w-[600px]' : 'w-96'} flex-shrink-0 bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 block">
                  Control Panel
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Search, Download & Analyze
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="h-8 w-8 p-0"
              title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-950">
          <div className="p-4 space-y-5 pb-6">
            {/* Search & Download Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-sm">
                  <Satellite className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Search Satellite Data
                </h3>
              </div>
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="location"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Location Name
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., New Delhi, India"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="h-10 text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="startDate"
                        className="text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-10 text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="endDate"
                        className="text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-10 text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearchAndDownload}
                    disabled={
                      searching || !searchLocation || !startDate || !endDate
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-10 text-sm font-medium shadow-md"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Searching Satellites...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        <span>Search & Download</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-800" />

            {/* Downloaded Files Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm">
                    <FileArchive className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Downloaded Files
                  </h3>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {downloadedFiles.length}
                </Badge>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={fetchDownloadedFiles}
                disabled={loadingFiles}
                className="w-full h-8 text-xs border-slate-300 dark:border-slate-700"
              >
                {loadingFiles ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 mr-1.5" />
                    <span>Refresh File List</span>
                  </>
                )}
              </Button>

              {loadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : downloadedFiles.length === 0 ? (
                <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border-dashed">
                  <CardContent className="p-6 text-center">
                    <FileArchive className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">
                      No files downloaded yet
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Search and download data above
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {downloadedFiles.map((file, idx) => (
                    <Card
                      key={idx}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all overflow-hidden"
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <FileArchive className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight break-all">
                                {file.filename}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-medium">
                                  {file.size_mb.toFixed(2)} MB
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">
                                  •
                                </span>
                                <span className="font-mono">
                                  {new Date(file.modified).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleProcessDownloadedFile(file.path)
                            }
                            disabled={processingFile === file.path}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-8 text-xs font-medium shadow-sm"
                          >
                            {processingFile === file.path ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1.5" />
                                <span>Load on Map</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-800" />

            {/* Activity Log Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Activity Log
                </h3>
              </div>
              <div className="space-y-2.5">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-3 rounded-lg border text-sm shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 text-white"
                          : msg.role === "error"
                          ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900 text-red-700 dark:text-red-200 flex items-start gap-2"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                      )}
                      {msg.role === "error" && (
                        <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="leading-relaxed break-words">
                        {msg.text}
                      </span>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 items-center justify-center text-xs text-slate-500 dark:text-slate-400 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span>Processing satellite data...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
          {currentImageUrl && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-300 dark:border-purple-700 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 animate-pulse" />
              <span className="text-xs text-purple-700 dark:text-purple-300 font-medium truncate">
                AI Vision Active
              </span>
            </div>
          )}
          {analysisData && !analyzingROI && (
            <Button
              onClick={() => {
                // Analysis data exists, just need to show it (it's already in state)
                // The dashboard checks for analysisData state
              }}
              className="w-full mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-9 text-sm font-medium shadow-md gap-2"
            >
              <Sparkles className="w-4 h-4" />
              View ROI Dashboard
            </Button>
          )}
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !loading &&
                !analyzingROI &&
                handleSendMessage()
              }
              placeholder={
                analyzingROI
                  ? "Analyzing region..."
                  : currentImageUrl
                  ? "Ask AI about imagery..."
                  : "Upload image first..."
              }
              disabled={!currentImageUrl || loading || analyzingROI}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-10 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={
                !currentImageUrl || loading || analyzingROI || !input.trim()
              }
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-10 w-10 shadow-md flex-shrink-0 disabled:opacity-50"
            >
              {loading || analyzingROI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            {analyzingROI ? (
              <span className="text-orange-500 font-medium animate-pulse">
                ⏳ ROI analysis in progress...
              </span>
            ) : currentImageUrl ? (
              <span>✨ AI-powered analysis of your satellite imagery</span>
            ) : (
              <span>💬 Upload satellite data to enable AI chat</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
