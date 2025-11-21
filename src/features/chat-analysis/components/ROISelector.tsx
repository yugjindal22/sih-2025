import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crop, X, Check } from "lucide-react";

interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ROISelectorProps {
  imageUrl: string;
  onROISelect: (roi: ROI | null, imageUrl?: string) => void;
  isActive: boolean;
}

const ROISelector = ({ imageUrl, onROISelect, isActive }: ROISelectorProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentROI, setCurrentROI] = useState<ROI | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      setCurrentROI(null);
      setIsSelecting(false);
      setStartPos(null);
    }
  }, [isActive]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsSelecting(true);
    setStartPos({ x, y });
    setCurrentROI(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !startPos || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const roi: ROI = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    };
    
    setCurrentROI(roi);
  };

  const handleMouseUp = () => {
    if (isSelecting && currentROI) {
      setIsSelecting(false);
      // Don't call onROISelect here - wait for button click
    }
  };

  const handleClear = () => {
    setCurrentROI(null);
    setStartPos(null);
    // Don't need to call onROISelect for clearing
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={imageRef}
        className="relative cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsSelecting(false)}
      >
        <img src={imageUrl} alt="ROI Selection" className="w-full h-auto rounded-lg" />
        
        {currentROI && (
          <div
            className="absolute border-2 border-primary bg-primary/10 backdrop-blur-sm"
            style={{
              left: `${currentROI.x}%`,
              top: `${currentROI.y}%`,
              width: `${currentROI.width}%`,
              height: `${currentROI.height}%`,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
            }}
          >
            <div className="absolute -top-8 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md whitespace-nowrap">
              {currentROI.width.toFixed(1)}% × {currentROI.height.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
      
      {currentROI && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
            className="h-8 px-3 shadow-lg"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            className="h-8 px-3 bg-green-600 hover:bg-green-700 shadow-lg animate-pulse"
            onClick={() => {
              onROISelect(currentROI, imageUrl);
              // Clear the ROI selection after analyzing
              setTimeout(() => {
                setCurrentROI(null);
                setStartPos(null);
              }, 500);
            }}
          >
            <Check className="w-3 h-3 mr-1" />
            Analyze ROI
          </Button>
        </div>
      )}
    </div>
  );
};

export default ROISelector;
