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

export default function SatelliteTileViewer() {
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const BACKEND_API = "http://localhost:5001";

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
      // Convert percentage-based ROI to pixel coordinates
      // For now, we'll send the percentage-based coordinates
      const response = await axios.post(`${BACKEND_API}/api/analyze-roi`, {
        roi: {
          x: roi.x,
          y: roi.y,
          width: roi.width,
          height: roi.height,
        },
        image_url: imageUrl || currentImageUrl,
      });

      if (response.data) {
        const analysis = response.data.analysis || {};

        // If analysis has the raw text field, try to parse it as JSON
        if (
          analysis.text &&
          typeof analysis.text === "string" &&
          analysis.text.trim().startsWith("{")
        ) {
          try {
            const parsedData = JSON.parse(analysis.text);
            Object.assign(analysis, parsedData);
            delete analysis.text; // Remove raw text since we parsed it
          } catch (e) {
            console.log("Could not parse text field as JSON, keeping as is");
          }
        }

        // Check if we got meaningful structured data
        const hasStructuredData =
          analysis &&
          (analysis.landCover ||
            analysis.vegetation ||
            analysis.waterBodies ||
            analysis.urban ||
            analysis.environmental);

        // Parse the AI response and structure it
        const structuredAnalysis: AnalysisData = {
          ...analysis,
          summary:
            analysis.summary || response.data.text || "AI analysis completed",
          confidence: analysis.confidence || (hasStructuredData ? 85 : 80),
          // Only keep text field if we don't have structured data
          text: hasStructuredData
            ? undefined
            : response.data.text || analysis.text || "",
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
      }
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
      // Send to interactive chat API with vision backend
      const response = await axios.post(`${BACKEND_API}/api/interactive-chat`, {
        message: userMessage,
        image_url: currentImageUrl,
        chat_history: chatHistory,
      });

      if (response.data && response.data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: response.data.response,
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
            content: response.data.response,
          },
        ]);
      }
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
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* MAP CONTAINER */}
      <div className="relative flex-1 flex flex-col h-[50vh] lg:h-screen">
        <MapView
          overlayImage={overlayImage}
          overlayBounds={overlayBounds}
          position={position}
          setPosition={setPosition}
          setViewBounds={setViewBounds}
        />

        {/* ROI Selector Overlay */}
        {roiMode && overlayImage && (
          <ROISelector
            imageUrl={overlayImage}
            isActive={roiMode}
            onROISelect={(roi) => {
              handleROISelect(roi, currentImageUrl || undefined);
              setRoiMode(false);
            }}
          />
        )}

        {/* Analysis Dashboard */}
        {analysisData && (
          <div className="absolute top-20 lg:top-24 right-2 lg:right-6 z-[500] max-w-md w-[calc(100vw-1rem)] sm:w-auto">
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAnalysisData(null)}
                className="absolute -top-2 -right-2 z-10 h-6 w-6 p-0 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-950 shadow-lg"
              >
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              </Button>
              <AnalysisDashboard data={analysisData} />
            </div>
          </div>
        )}

        {/* ROI Selector Overlay */}
        {roiMode && overlayImage && (
          <div className="absolute inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                    <Crosshair className="w-6 h-6 text-white" />
                  </div>
                  <div>
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
                  className="gap-2"
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
          <div className="absolute top-0 right-0 bottom-0 w-full lg:w-96 z-[450] bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex items-center justify-between z-10">
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
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAnalysisData(null);
                  setAnalyzingROI(false);
                }}
                className="text-white hover:bg-white/20"
                disabled={analyzingROI}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              {analyzingROI ? (
                <div className="space-y-4">
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
          </div>
        )}

        {/* Floating UI Controls */}
        <div className="absolute top-2 left-2 lg:top-6 lg:left-6 z-[400] flex flex-col gap-2 lg:gap-3 max-w-[calc(100vw-16rem)] sm:max-w-[calc(100vw-20rem)] lg:max-w-none">
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-slate-200 dark:border-slate-700 shadow-xl">
            <CardContent className="p-2 lg:p-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1.5 lg:p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xs lg:text-sm text-slate-900 dark:text-white">
                    Satellite Tile Viewer
                  </h1>
                  <p className="text-[10px] lg:text-xs text-slate-600 dark:text-slate-400">
                    GEO Analysis Interface
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg gap-2 text-xs lg:text-sm h-8 lg:h-10"
          >
            <UploadCloud className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Upload Sentinel-2 Tile</span>
            <span className="sm:hidden">Upload</span>
          </Button>

          {/* ROI Mode Toggle */}
          {overlayImage && (
            <Button
              onClick={() => {
                setRoiMode(!roiMode);
                setAnalysisData(null);
              }}
              disabled={analyzingROI}
              className={`shadow-lg gap-2 text-xs lg:text-sm h-8 lg:h-10 ${
                roiMode
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              } text-white`}
            >
              {analyzingROI ? (
                <>
                  <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                  <span className="sm:hidden">Wait...</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">
                    {roiMode ? "Exit ROI Mode" : "🎯 ROI Analysis"}
                  </span>
                  <span className="sm:hidden">{roiMode ? "Exit" : "ROI"}</span>
                </>
              )}
            </Button>
          )}

          {position && (
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardContent className="p-2 lg:p-3">
                <div className="flex items-center gap-2 text-[10px] lg:text-xs">
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

      {/* CHAT SIDEBAR */}
      <div className="w-full lg:w-96 h-[50vh] lg:h-screen bg-white dark:bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-[300]">
        <div className="p-3 lg:p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
              </div>
              <div>
                <span className="text-sm lg:text-base font-bold text-slate-900 dark:text-slate-100 block">
                  Control Panel
                </span>
                <span className="text-[10px] lg:text-xs text-slate-600 dark:text-slate-400">
                  Search, Download & Analyze
                </span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-950">
          <div className="p-2 sm:p-3 lg:p-4 space-y-3 sm:space-y-4 lg:space-y-5 pb-6">
            {/* Search & Download Section */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md">
                  <Satellite className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" />
                </div>
                <h3 className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Search Satellite Data
                </h3>
              </div>
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
                <CardContent className="p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-2.5 lg:space-y-3">
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label
                      htmlFor="location"
                      className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Location Name
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., New Delhi"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="h-8 sm:h-9 lg:h-10 text-[11px] sm:text-xs lg:text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:gap-2.5">
                    <div className="space-y-1 sm:space-y-1.5">
                      <Label
                        htmlFor="startDate"
                        className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 sm:h-9 lg:h-10 text-[11px] sm:text-xs lg:text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-1.5">
                      <Label
                        htmlFor="endDate"
                        className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 sm:h-9 lg:h-10 text-[11px] sm:text-xs lg:text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearchAndDownload}
                    disabled={
                      searching || !searchLocation || !startDate || !endDate
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-8 sm:h-9 lg:h-10 text-[11px] sm:text-xs lg:text-sm font-medium shadow-md"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1.5 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">
                          Searching Satellites...
                        </span>
                        <span className="sm:hidden">Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">
                          Search & Download
                        </span>
                        <span className="sm:hidden">Search</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-800" />

            {/* Downloaded Files Section */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="p-1 sm:p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md">
                    <FileArchive className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" />
                  </div>
                  <h3 className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Downloaded Files
                  </h3>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[9px] sm:text-[10px] lg:text-xs px-1.5 sm:px-2"
                >
                  {downloadedFiles.length}
                </Badge>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={fetchDownloadedFiles}
                disabled={loadingFiles}
                className="w-full h-7 sm:h-8 text-[10px] sm:text-[11px] lg:text-xs border-slate-300 dark:border-slate-700"
              >
                {loadingFiles ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 animate-spin" />
                    <span className="hidden sm:inline">Refreshing...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Refresh File List</span>
                    <span className="sm:hidden">Refresh</span>
                  </>
                )}
              </Button>

              {loadingFiles ? (
                <div className="flex items-center justify-center py-6 sm:py-8 lg:py-12">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 animate-spin text-blue-500" />
                </div>
              ) : downloadedFiles.length === 0 ? (
                <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border-dashed">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <FileArchive className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mx-auto mb-1.5 sm:mb-2 text-slate-400" />
                    <p className="text-[11px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mb-0.5 sm:mb-1">
                      No files downloaded yet
                    </p>
                    <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 dark:text-slate-500">
                      Search and download data above
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {downloadedFiles.map((file, idx) => (
                    <Card
                      key={idx}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all"
                    >
                      <CardContent className="p-2 sm:p-2.5 lg:p-3">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            <FileArchive className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-900 dark:text-slate-100 truncate leading-tight">
                                {file.filename}
                              </p>
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] lg:text-xs text-slate-500 dark:text-slate-400">
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
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-7 sm:h-8 text-[10px] sm:text-xs font-medium shadow-sm"
                          >
                            {processingFile === file.path ? (
                              <>
                                <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 animate-spin" />
                                <span className="hidden sm:inline">
                                  Processing...
                                </span>
                                <span className="sm:hidden">Loading...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                                <span className="hidden sm:inline">
                                  Load on Map
                                </span>
                                <span className="sm:hidden">Load</span>
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

            {/* Demo Locations Section */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-md">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" />
                </div>
                <h3 className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Quick Locations
                </h3>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                {demoLocations.map((location, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleDemoLocation(location)}
                    disabled={downloadingDemo}
                    className="w-full justify-start bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 h-auto py-2 sm:py-2.5 lg:py-3 shadow-sm transition-all"
                    variant="outline"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 w-full">
                      <div className="p-1 sm:p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex-shrink-0">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-[10px] sm:text-xs lg:text-sm truncate">
                          {location.name}
                        </div>
                        <div className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {location.coords.lat.toFixed(2)},{" "}
                          {location.coords.lng.toFixed(2)}
                        </div>
                      </div>
                      {downloadingDemo && (
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 animate-spin text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-800" />

            {/* Activity Log Section */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" />
                </div>
                <h3 className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Activity Log
                </h3>
              </div>
              <div className="space-y-2 sm:space-y-2.5">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[90%] p-2 sm:p-2.5 lg:p-3 rounded-lg border text-[10px] sm:text-xs lg:text-sm shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 text-white"
                          : msg.role === "error"
                          ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900 text-red-700 dark:text-red-200 flex items-start gap-1.5 sm:gap-2"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-1.5 sm:gap-2"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                      )}
                      {msg.role === "error" && (
                        <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mt-0.5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="leading-relaxed break-words">
                        {msg.text}
                      </span>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-1.5 sm:gap-2 items-center justify-center text-[9px] sm:text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 p-2 sm:p-2.5 lg:p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 animate-spin text-blue-500" />
                    <span className="hidden sm:inline">
                      Processing satellite data...
                    </span>
                    <span className="sm:hidden">Processing...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-2 sm:p-3 lg:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
          {currentImageUrl && (
            <div className="mb-2 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-300 dark:border-purple-700 rounded-lg">
              <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-purple-700 dark:text-purple-300 font-medium truncate">
                AI Vision Active
              </span>
            </div>
          )}
          <div className="flex gap-1.5 sm:gap-2">
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
              className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-8 sm:h-9 lg:h-10 text-[11px] sm:text-xs lg:text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={
                !currentImageUrl || loading || analyzingROI || !input.trim()
              }
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 shadow-md flex-shrink-0 disabled:opacity-50"
            >
              {loading || analyzingROI ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 animate-spin" />
              ) : (
                <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
              )}
            </Button>
          </div>
          <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2 text-center">
            {analyzingROI ? (
              <span className="text-orange-500 font-medium animate-pulse">
                ⏳ ROI analysis in progress...
              </span>
            ) : currentImageUrl ? (
              <span className="hidden sm:inline">
                ✨ AI-powered analysis of your satellite imagery
              </span>
            ) : (
              <span className="hidden sm:inline">
                💬 Upload satellite data to enable AI chat
              </span>
            )}
            <span className="sm:hidden">
              {analyzingROI
                ? "⏳ Analyzing..."
                : currentImageUrl
                ? "✨ AI Ready"
                : "Upload first"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
