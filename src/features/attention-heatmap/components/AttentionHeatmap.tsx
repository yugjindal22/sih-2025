import { useEffect, useState } from "react";

interface AttentionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

interface AttentionHeatmapProps {
  imageUrl: string;
  isActive: boolean;
}

const AttentionHeatmap = ({ imageUrl, isActive }: AttentionHeatmapProps) => {
  const [regions, setRegions] = useState<AttentionRegion[]>([]);

  useEffect(() => {
    if (isActive) {
      // Clear existing regions first
      setRegions([]);

      // Generate realistic attention regions based on image analysis patterns
      // In production, this would come from the model's attention weights
      const generatedRegions: AttentionRegion[] = [
        { x: 20, y: 15, width: 30, height: 25, intensity: 0.8 },
        { x: 55, y: 35, width: 25, height: 30, intensity: 0.6 },
        { x: 10, y: 60, width: 35, height: 20, intensity: 0.7 },
        { x: 65, y: 70, width: 20, height: 15, intensity: 0.5 },
      ];

      // Store timeout IDs for cleanup
      const timeouts: NodeJS.Timeout[] = [];

      // Animate regions appearing one by one
      generatedRegions.forEach((region, index) => {
        const timeout = setTimeout(() => {
          setRegions((prev) => [...prev, region]);
        }, index * 300);
        timeouts.push(timeout);
      });

      // Cleanup function to cancel pending timeouts
      return () => {
        timeouts.forEach((timeout) => clearTimeout(timeout));
      };
    } else {
      setRegions([]);
    }
  }, [isActive]);

  if (!isActive || regions.length === 0) {
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
