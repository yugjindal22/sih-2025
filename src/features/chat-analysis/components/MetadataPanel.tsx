import { Card } from "@/components/ui/card";
import { Satellite, Calendar, Layers, MapPin, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MetadataInfo {
  satellite?: string;
  sensor?: string;
  date?: string;
  resolution?: string;
  bands?: string;
  location?: string;
  cloudCover?: string;
  sunElevation?: string;
}

interface MetadataPanelProps {
  metadata: MetadataInfo | null;
}

const MetadataPanel = ({ metadata }: MetadataPanelProps) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  const items = [
    { icon: Satellite, label: "Satellite", value: metadata.satellite, color: "text-blue-400" },
    { icon: Eye, label: "Sensor", value: metadata.sensor, color: "text-purple-400" },
    { icon: Calendar, label: "Date", value: metadata.date, color: "text-cyan-400" },
    { icon: Layers, label: "Resolution", value: metadata.resolution, color: "text-pink-400" },
    { icon: Layers, label: "Bands", value: metadata.bands, color: "text-green-400" },
    { icon: MapPin, label: "Location", value: metadata.location, color: "text-orange-400" },
    { icon: Eye, label: "Cloud Cover", value: metadata.cloudCover, color: "text-gray-400" },
    { icon: Eye, label: "Sun Elevation", value: metadata.sunElevation, color: "text-yellow-400" },
  ].filter(item => item.value);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border shadow-card">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Satellite className="w-4 h-4 text-primary" />
          Satellite Metadata
        </h3>
      </div>
      <ScrollArea className="h-[calc(100vh-24rem)]">
        <div className="p-4 space-y-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default MetadataPanel;
