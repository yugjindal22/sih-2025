"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  UploadCloud,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import type { ComponentType } from "react";

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

export default function SatelliteTileViewer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Systems Online. Upload Sentinel-2 Data to begin geospatial analysis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingDemo, setDownloadingDemo] = useState(false);

  // Map State
  const [position, setPosition] = useState<any>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<any>(null);
  const [viewBounds, setViewBounds] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setInput("");
    // Message sending disabled - map interaction only
  };

  if (!isClient) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* MAP CONTAINER */}
      <div className="relative flex-1 flex flex-col">
        <MapView
          overlayImage={overlayImage}
          overlayBounds={overlayBounds}
          position={position}
          setPosition={setPosition}
          setViewBounds={setViewBounds}
        />

        {/* Floating UI */}
        <div className="absolute top-6 left-6 z-[400] flex flex-col gap-3">
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
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Sentinel-2 Tile
          </Button>

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

      {/* CHAT SIDEBAR */}
      <div className="w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Analysis Panel
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 bg-slate-50 dark:bg-slate-950">
          {/* Demo Locations Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Demo Locations
            </h3>
            <div className="space-y-2">
              {demoLocations.map((location, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleDemoLocation(location)}
                  disabled={downloadingDemo}
                  className="w-full justify-start bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 h-auto py-3"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {location.coords.lat.toFixed(2)},{" "}
                        {location.coords.lng.toFixed(2)}
                      </div>
                    </div>
                    {downloadingDemo && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg border ${
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
                  <span>{msg.text}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400 p-2">
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                Processing data...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Analyze current view..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Ask questions about the current viewport
          </p>
        </div>
      </div>
    </div>
  );
}
