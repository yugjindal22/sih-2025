import { useState, useRef, useEffect } from "react";
import { X, Check, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    }
  };

  const handleClear = () => {
    setCurrentROI(null);
    setStartPos(null);
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
        <img src={imageUrl} alt="ROI Selection" className="w-full h-auto rounded-lg shadow-2xl" />
        
        {currentROI && (
          <div
            className="absolute border-2 border-cyan-400 bg-cyan-400/20 backdrop-blur-sm"
            style={{
              left: `${currentROI.x}%`,
              top: `${currentROI.y}%`,
              width: `${currentROI.width}%`,
              height: `${currentROI.height}%`,
              boxShadow: '0 0 30px rgba(34, 211, 238, 0.6)',
            }}
          >
            <div className="absolute -top-10 left-0 bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap font-mono shadow-lg">
              <Crosshair className="w-3 h-3 inline mr-1" />
              {currentROI.width.toFixed(1)}% × {currentROI.height.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
      
      {currentROI && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 animate-pulse"
            onClick={() => {
              onROISelect(currentROI, imageUrl);
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
