"use client";

import { useState, useRef, useEffect } from 'react';
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
  MapPin
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import type { ComponentType } from 'react';

interface MapViewProps {
  overlayImage: string | null;
  overlayBounds: any;
  position: any;
  setPosition: (pos: any) => void;
  setViewBounds: (bounds: any) => void;
}

// Import the full MapView component dynamically
const MapView = dynamic<MapViewProps>(
  () => import('@/features/satellite-tile-viewer/components/MapView'),
  { ssr: false }
);

interface Message {
  role: 'ai' | 'user' | 'error';
  text: string;
}

export default function SatelliteTileViewer() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Systems Online. Upload Sentinel-2 Data to begin geospatial analysis." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
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
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessages(prev => [...prev, { 
      role: 'ai', 
      text: `Ingesting ${file.name}... Calculating Geospatial Bounds.` 
    }]);

    // Simulate backend processing (replace with actual API call)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Data aligned. Coordinate System: UTM → WGS84 conversion complete." 
      }]);
      
      // Mock overlay (replace with actual backend response)
      // setOverlayImage(mockImageUrl);
      // setOverlayBounds(mockBounds);
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Tile overlay ready. You can now analyze the current viewport." 
      }]);
    }, 2000);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI analysis (replace with actual API call)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `Analyzed viewport: ${input}. Detected urban areas, vegetation indices, and water bodies in the current view.` 
      }]);
      setLoading(false);
    }, 1500);
  };

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      
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
          <Card className="bg-slate-900/90 backdrop-blur border-slate-700 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-500" />
                <h1 className="font-bold text-sm text-orange-500">
                  Satellite Tile Viewer
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">GEO-Chat Interface</p>
            </CardContent>
          </Card>
          
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-blue-600 hover:bg-blue-500 shadow-lg gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Sentinel-2 Tile
          </Button>

          {position && (
            <Card className="bg-slate-900/90 backdrop-blur border-slate-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-green-500" />
                  <span className="text-slate-300">
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
      <div className="w-96 bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-300 tracking-widest">
              GEO-CHAT
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 font-mono text-sm">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-lg border ${
                  msg.role === 'user' 
                    ? 'bg-blue-950/50 border-blue-900 text-blue-100' 
                    : msg.role === 'error' 
                    ? 'bg-red-950/30 border-red-900 text-red-200 flex items-start gap-2' 
                    : 'bg-slate-900 border-slate-700 text-slate-300 flex items-start gap-2'
                }`}>
                  {msg.role === 'ai' && <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />}
                  {msg.role === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-slate-500 p-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing Viewport...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Analyze current view..."
              className="flex-1 bg-slate-950 border-slate-700 text-slate-100"
            />
            <Button 
              onClick={handleSendMessage} 
              size="icon"
              className="bg-blue-600 hover:bg-blue-500"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Ask questions about the current viewport
          </p>
        </div>
      </div>
    </div>
  );
}
