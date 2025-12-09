import React, { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  ImageOverlay,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Send,
  UploadCloud,
  Loader2,
  Globe,
  Crosshair,
  Sparkles,
  BarChart3,
  MessageSquare,
  X,
} from "lucide-react";
import axios from "axios";
import ROISelector from "./components/ROISelector";
import AnalysisDashboard, { type AnalysisData } from "./components/AnalysisDashboard";

// Fix Leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API_URL = "http://127.0.0.1:5001/api";

// --- HELPER COMPONENTS ---
const MapUpdater = ({
  bounds,
}: {
  bounds: L.LatLngBoundsExpression | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

const LocationMarker = ({
  setPosition,
  setBounds,
}: {
  setPosition: any;
  setBounds: any;
}) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
    moveend() {
      setBounds(map.getBounds());
    },
  });
  return null;
};

interface Message {
  role: "ai" | "user" | "error";
  text: string;
  analysisData?: AnalysisData;
  image?: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "🛰️ Systems Online. Upload Sentinel-2 Data to begin advanced analysis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Map State
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [viewBounds, setViewBounds] = useState<any>(null);

  // ROI & Analysis State
  const [roiMode, setRoiMode] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: "Invalid file format. Please upload a .zip file containing Sentinel-2 data.",
        },
      ]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: `📦 Ingesting ${file.name} (${fileSizeMB}MB)... Extracting and calculating geospatial bounds.`,
      },
    ]);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_URL}/process-zip`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = res.data.processed_image_url;
      setOverlayImage(imageUrl);

      if (res.data.bounds && res.data.bounds.length === 4) {
        const [lonMin, latMin, lonMax, latMax] = res.data.bounds;
        setOverlayBounds([[latMin, lonMin], [latMax, lonMax]]);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "✅ Data aligned. Coordinate System: UTM → WGS84 conversion complete. Overlay applied to map. You can now interact with the image!",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "✅ Data processed. Image overlay applied to map.",
          },
        ]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Upload failed";
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: `❌ Ingestion Failed: ${errorMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cropImageToROI = async (imageUrl: string, roi: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        const cropX = (roi.x / 100) * img.width;
        const cropY = (roi.y / 100) * img.height;
        const cropWidth = (roi.width / 100) * img.width;
        const cropHeight = (roi.height / 100) * img.height;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.95);
        resolve(croppedImageUrl);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for cropping"));
      };

      img.src = imageUrl;
    });
  };

  const handleROISelect = async (roi: any, imageUrl?: string) => {
    if (!roi) return;

    const imageToAnalyze = imageUrl || overlayImage;
    if (!imageToAnalyze) {
      setMessages((prev) => [...prev, { role: "error", text: "No image available to analyze" }]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: `🎯 Analyzing ROI: ${roi.width.toFixed(1)}% × ${roi.height.toFixed(1)}%`,
      },
    ]);

    try {
      const croppedImage = await cropImageToROI(imageToAnalyze, roi);
      setRoiMode(false);
      setLoading(true);

      const roiPrompt = `Analyze this specific region of interest (ROI) from an Earth Observation image. 
This is a cropped section representing ${roi.width.toFixed(1)}% × ${roi.height.toFixed(1)}% of the original image area.
Provide detailed insights about:
1. Land cover types in this specific area
2. Vegetation health and density
3. Any notable features or anomalies
4. Changes or patterns visible in this region`;

      await sendMessageWithImage(roiPrompt, croppedImage);
    } catch (error) {
      console.error("Error cropping ROI:", error);
      setMessages((prev) => [...prev, { role: "error", text: "Failed to crop the selected region" }]);
    }
  };

  const sendMessageWithImage = async (promptText: string, imageBase64: string) => {
    try {
      // Remove data URL prefix
      const base64Data = imageBase64.split(',')[1] || imageBase64;

      const response = await axios.post(`${API_URL}/analyze-roi`, {
        prompt: promptText,
        image: base64Data,
        metadata: {},
      });

      const { text, analysis } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: text || "Analysis complete.",
          analysisData: analysis,
        },
      ]);

      if (analysis) {
        setCurrentAnalysis(analysis);
        setShowDashboard(true);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: `Analysis failed: ${error.response?.data?.error || error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/interactive-chat`, {
        message: input,
        images: overlayImage ? [overlayImage.split(',')[1] || overlayImage] : [],
        history: messages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        metadata: {},
      });

      const { text, analysis } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: text || "Response received.",
          analysisData: analysis,
        },
      ]);

      if (analysis) {
        setCurrentAnalysis(analysis);
        setShowDashboard(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: "Analysis Error." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* MAP CONTAINER */}
      <div className="relative flex-1 flex flex-col">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          className="h-full w-full z-0"
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />

          <MapUpdater bounds={overlayBounds} />

          {overlayImage && overlayBounds && !roiMode && (
            <ImageOverlay
              url={overlayImage}
              bounds={overlayBounds}
              opacity={0.8}
            />
          )}

          <LocationMarker setPosition={setPosition} setBounds={setViewBounds} />
          {position && <Marker position={position} />}
        </MapContainer>

        {/* ROI Selector Overlay */}
        {roiMode && overlayImage && (
          <div className="absolute inset-0 z-[1000] bg-black/80 flex items-center justify-center p-8">
            <div className="max-w-5xl w-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Crosshair className="w-5 h-5" />
                  Select Region of Interest
                </h2>
                <button
                  onClick={() => setRoiMode(false)}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
              <ROISelector
                imageUrl={overlayImage}
                onROISelect={handleROISelect}
                isActive={roiMode}
              />
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute top-6 left-6 z-[400] flex flex-col gap-2">
          <div className="bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-700 shadow-xl">
            <h1 className="font-bold text-sm text-orange-500 flex items-center gap-2">
              <Globe className="w-4 h-4" /> BHOONIDHI AI
            </h1>
            <p className="text-[10px] text-slate-400">Advanced ROI Analysis</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className={`${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500"
            } text-white p-3 rounded-lg shadow-lg text-xs font-bold flex gap-2 items-center transition-all`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> UPLOAD ZIP
              </>
            )}
          </button>

          {overlayImage && !loading && (
            <button
              onClick={() => setRoiMode(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-lg shadow-lg text-xs font-bold flex gap-2 items-center transition-all"
            >
              <Crosshair className="w-4 h-4" /> SELECT ROI
            </button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".zip,application/zip,application/x-zip,application/x-zip-compressed"
          onChange={handleFileSelect}
        />
      </div>

      {/* CHAT SIDEBAR */}
      <div className="w-96 bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl z-[500]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 tracking-wide">INTERACTIVE CHAT</span>
          </div>
          {currentAnalysis && (
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors p-1.5 hover:bg-slate-700/50 rounded"
              title="View Analysis Dashboard"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg border shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-950/50 border-blue-900/50 text-blue-100"
                    : msg.role === "error"
                    ? "bg-red-950/30 border-red-900/50 text-red-200"
                    : "bg-slate-900/70 border-slate-700/50 text-slate-300"
                }`}
              >
                <div className="text-xs leading-relaxed">{msg.text}</div>
                {msg.analysisData && (
                  <button
                    onClick={() => {
                      setCurrentAnalysis(msg.analysisData!);
                      setShowDashboard(true);
                    }}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:bg-slate-800/50 px-2 py-1 rounded transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    View Full Analysis
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center justify-center text-xs text-slate-400 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Analyzing with Vision AI...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSendMessage()}
              placeholder="Ask about the satellite imagery..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed p-2.5 rounded-md text-white transition-all shadow-lg hover:shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 text-center">
            Powered by Vision Backend • InternVL2
          </div>
        </div>
      </div>

      {/* ANALYSIS DASHBOARD OVERLAY */}
      {showDashboard && currentAnalysis && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-start justify-center p-8 overflow-y-auto">
          <div className="max-w-5xl w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Analysis Dashboard
              </h2>
              <button
                onClick={() => setShowDashboard(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AnalysisDashboard data={currentAnalysis} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
