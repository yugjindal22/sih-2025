import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  FileText,
  Crosshair,
  ArrowLeftRight,
  Eye,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import ArchitectureViz from "./ArchitectureViz";
import ProcessingLogs from "./ProcessingLogs";
import MetadataPanel from "./MetadataPanel";
import AttentionHeatmap from "./AttentionHeatmap";
import VisionPipeline from "./VisionPipeline";
import ReasoningTrace, { generateReasoningSteps } from "./ReasoningTrace";
import QuantitativeInsights, {
  extractQuantitativeMetrics,
} from "./QuantitativeInsights";
import ROISelector from "./ROISelector";
import CompareMode from "./CompareMode";
import AnalysisDashboard, { type AnalysisData } from "./AnalysisDashboard";
import MessageImage from "./MessageImage";
import ImagePreview from "./ImagePreview";
import CompareImageItem from "./CompareImageItem";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parseMetadataFile,
  extractMetadataFromFilename,
  generateDefaultMetadata,
  readMetadataFile,
  EO_SYSTEM_PROMPT,
  type SatelliteMetadata,
} from "@/lib/metadata-utils";
import { parseAnalysisFromText } from "@/lib/analysis-utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  metadata?: any;
  reasoningSteps?: any[];
  quantitativeMetrics?: any;
  analysisData?: AnalysisData;
}

interface ChatProps {
  onBack: () => void;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const Chat = ({ onBack }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [metadata, setMetadata] = useState<SatelliteMetadata | null>(null);
  const [showAttentionHeatmap, setShowAttentionHeatmap] = useState(false);
  const [currentReasoningSteps, setCurrentReasoningSteps] = useState<any[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [currentAnalysisData, setCurrentAnalysisData] =
    useState<AnalysisData | null>(null);
  const [roiMode, setRoiMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareImages, setCompareImages] = useState<
    { url: string; label: string; date?: string }[]
  >([]);
  const [isPipelineComplete, setIsPipelineComplete] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const metadataInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only scroll to bottom when not processing (i.e., when a response is complete)
    if (!isProcessing && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isProcessing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setUploadedImageName(file.name);

        // Extract metadata from filename
        const filenameMetadata = extractMetadataFromFilename(file.name);
        if (Object.keys(filenameMetadata).length > 0) {
          setMetadata((prev) => ({
            ...generateDefaultMetadata(),
            ...filenameMetadata,
            ...prev,
          }));
        } else {
          setMetadata(generateDefaultMetadata());
        }

        toast.success("Image uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMetadataUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".meta") && !file.name.endsWith(".txt")) {
        toast.error("Please upload a .meta or .txt file");
        return;
      }

      try {
        const parsedMetadata = await readMetadataFile(file);
        setMetadata((prev) => ({ ...prev, ...parsedMetadata }));
        toast.success("Metadata loaded successfully");
      } catch (error) {
        toast.error("Failed to parse metadata file");
      }
    }
  };

  // Function to crop image based on ROI coordinates
  const cropImageToROI = async (imageUrl: string, roi: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        // Create canvas for cropping
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Calculate actual pixel coordinates from percentages
        const cropX = (roi.x / 100) * img.width;
        const cropY = (roi.y / 100) * img.height;
        const cropWidth = (roi.width / 100) * img.width;
        const cropHeight = (roi.height / 100) * img.height;

        // Set canvas size to cropped dimensions
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw the cropped portion
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,  // Source rectangle
          0, 0, cropWidth, cropHeight           // Destination rectangle
        );

        // Convert to base64
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

    // Get the image to analyze - either from uploadedImage or from the message
    const imageToAnalyze = imageUrl || uploadedImage;

    if (!imageToAnalyze) {
      toast.error("No image available to analyze");
      return;
    }

    toast.info(
      `Cropping ROI: ${roi.width.toFixed(1)}% × ${roi.height.toFixed(1)}%`
    );

    try {
      // Crop the image to the selected ROI
      const croppedImage = await cropImageToROI(imageToAnalyze, roi);
      
      toast.success("Analyzing selected region...");
      setRoiMode(false);

      // Create a prompt specifically for the ROI
      const roiPrompt = `Analyze this specific region of interest (ROI) from an Earth Observation image. 
This is a cropped section representing ${roi.width.toFixed(1)}% × ${roi.height.toFixed(1)}% of the original image area.
Provide detailed insights about:
1. Land cover types in this specific area
2. Vegetation health and density
3. Any notable features or anomalies
4. Changes or patterns visible in this region`;

      // Send the cropped image to the AI (skip heatmap for ROI)
      await sendMessageWithImage(roiPrompt, croppedImage, false);
    } catch (error) {
      console.error("Error cropping ROI:", error);
      toast.error("Failed to crop the selected region");
    }
  };

  const handleCompareMode = () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    if (compareImages.length === 0) {
      // Add first image
      setCompareImages([
        {
          url: uploadedImage,
          label: uploadedImageName || "Image 1",
          date: metadata?.date,
        },
      ]);
      setUploadedImage(null);
      setUploadedImageName("");
      toast.success("First image added. Upload a second image to compare.");
    } else if (compareImages.length === 1) {
      // Add second image and activate compare mode
      setCompareImages((prev) => [
        ...prev,
        {
          url: uploadedImage,
          label: uploadedImageName || "Image 2",
          date: metadata?.date,
        },
      ]);
      setUploadedImage(null);
      setUploadedImageName("");
      setCompareMode(true);
      toast.success("Compare mode activated!");
    } else {
      // Already have 2 images, activate compare mode
      setCompareMode(true);
    }
  };

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    // Remove the data URL prefix to get just the base64 data
    return imageUrl.split(",")[1];
  };

  const handleStopProcessing = () => {
    if (abortController) {
      abortController.abort();
      setIsProcessing(false);
      setIsPipelineComplete(false);
      toast.info("Processing stopped");
    }
  };

  const sendMessageWithImage = async (promptText: string, imageUrl: string, showHeatmap: boolean = true) => {
    const userMessage: Message = {
      role: "user",
      content: promptText,
      image: imageUrl,
      metadata: metadata,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setIsPipelineComplete(false);
    setShowLogs(false);
    setShowAttentionHeatmap(false);
    setAnalysisProgress(0);

    // Create abort controller
    const controller = new AbortController();
    setAbortController(controller);

    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) return prev; // Cap at 95% until complete
        return prev + 1;
      });
    }, 350); // Increment every 350ms

    // Show attention heatmap after a delay (skip for ROI analysis)
    if (showHeatmap) {
      setTimeout(() => {
        setShowAttentionHeatmap(true);
      }, 1500);
    }

    try {
      const parts: any[] = [];

      // Add system prompt for EO analysis
      parts.push({
        text: EO_SYSTEM_PROMPT,
      });

      const base64Image = await convertImageToBase64(imageUrl);
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      });

      // Enhanced prompt with metadata context
      let enhancedPrompt = promptText;

      if (metadata && Object.keys(metadata).length > 0) {
        enhancedPrompt += `\n\nImage Metadata:\n`;
        if (metadata.satellite)
          enhancedPrompt += `- Satellite: ${metadata.satellite}\n`;
        if (metadata.sensor) enhancedPrompt += `- Sensor: ${metadata.sensor}\n`;
        if (metadata.date) enhancedPrompt += `- Date: ${metadata.date}\n`;
        if (metadata.resolution)
          enhancedPrompt += `- Resolution: ${metadata.resolution}\n`;
        if (metadata.location)
          enhancedPrompt += `- Location: ${metadata.location} (Please use this location in the coordinates.location field of your JSON response)\n`;
      }

      enhancedPrompt += `\n\nIMPORTANT: Please provide your response in the following JSON format:
{
  "summary": "Brief 2-3 sentence summary for the chat window",
  "confidence": 85.5,
  "landCover": {
    "vegetation": 35.2,
    "water": 12.5,
    "urban": 28.3,
    "bareSoil": 15.0,
    "forest": 5.0,
    "agriculture": 4.0
  },
  "vegetation": {
    "health": "Good",
    "ndvi": 0.65,
    "density": 72.5,
    "types": ["Deciduous Trees", "Grassland", "Shrubs"]
  },
  "waterBodies": {
    "totalArea": 12.5,
    "quality": "Clean",
    "sources": ["River", "Pond"]
  },
  "urban": {
    "builtUpArea": 28.3,
    "development": "High",
    "infrastructure": ["Roads", "Buildings", "Industrial"]
  },
  "environmental": {
    "temperature": 28,
    "humidity": 65,
    "airQuality": "Good",
    "cloudCover": 20
  },
  "features": [
    {
      "type": "Notable Feature",
      "description": "Description",
      "severity": "Medium"
    }
  ],
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "coordinates": {
    "latitude": 0.0,
    "longitude": 0.0,
    "location": "Location Name"
  }
}

Provide ONLY valid JSON. No markdown, no code blocks, just pure JSON.`;

      parts.push({
        text: enhancedPrompt,
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: parts,
              },
            ],
          }),
          signal: controller.signal, // Add abort signal
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from Gemini API");
      }

      const data = await response.json();
      const aiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't analyze the image.";

      // Mark pipeline as complete since we got the response
      setIsPipelineComplete(true);

      // Parse JSON response
      let analysisData: AnalysisData | null = null;
      let displayText = aiResponse;

      try {
        // Try to extract JSON from response (handle if wrapped in markdown code blocks)
        let jsonText = aiResponse;
        if (jsonText.includes("```json")) {
          jsonText = jsonText.split("```json")[1].split("```")[0].trim();
        } else if (jsonText.includes("```")) {
          jsonText = jsonText.split("```")[1].split("```")[0].trim();
        }

        const parsed = JSON.parse(jsonText);
        analysisData = parsed;
        displayText = parsed.summary || aiResponse;
      } catch (e) {
        console.warn("Failed to parse JSON from AI response, using as text", e);
        displayText = aiResponse;
        // Try to extract analysis from text
        analysisData = parseAnalysisFromText(aiResponse);
      }

      // Generate reasoning steps and extract metrics
      const reasoningSteps = generateReasoningSteps(aiResponse);

      // Simulate processing delay - reduced for better UX (3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setCurrentReasoningSteps(reasoningSteps);
      setCurrentAnalysisData(analysisData);

      // Set progress to 100% when complete
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: displayText,
          reasoningSteps: reasoningSteps,
          analysisData: analysisData,
        },
      ]);
    } catch (error: any) {
      // Check if it was aborted
      if (error.name === "AbortError") {
        console.log("Request aborted by user");
        clearInterval(progressInterval);
        return; // Don't show error message for user-initiated abort
      }
      console.error("Error:", error);
      clearInterval(progressInterval);
      toast.error("Failed to process your request");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setIsPipelineComplete(false);
      setShowLogs(false);
      setAbortController(null);
      setAnalysisProgress(0);
      // Keep heatmap visible - don't auto-hide it
      // User can start a new query to hide it
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !uploadedImage) return;

    const userMessage: Message = {
      role: "user",
      content: input || "Analyze this Earth Observation image",
      image: uploadedImage || undefined,
      metadata: metadata,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setIsPipelineComplete(false);
    setShowLogs(false);
    setShowAttentionHeatmap(false);
    setAnalysisProgress(0);

    // Create abort controller
    const controller = new AbortController();
    setAbortController(controller);

    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) return prev; // Cap at 95% until complete
        return prev + 1;
      });
    }, 350); // Increment every 350ms

    // Show attention heatmap after a delay
    setTimeout(() => {
      setShowAttentionHeatmap(true);
    }, 1500);

    try {
      const parts: any[] = [];

      // Add system prompt for EO analysis
      parts.push({
        text: EO_SYSTEM_PROMPT,
      });

      if (uploadedImage) {
        const base64Image = await convertImageToBase64(uploadedImage);
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        });
      }

      // Enhanced prompt with metadata context
      let enhancedPrompt =
        input ||
        "Analyze this Earth Observation image. Provide insights about land cover, vegetation, water bodies, and any notable features.";

      if (metadata && Object.keys(metadata).length > 0) {
        enhancedPrompt += `\n\nImage Metadata:\n`;
        if (metadata.satellite)
          enhancedPrompt += `- Satellite: ${metadata.satellite}\n`;
        if (metadata.sensor) enhancedPrompt += `- Sensor: ${metadata.sensor}\n`;
        if (metadata.date) enhancedPrompt += `- Date: ${metadata.date}\n`;
        if (metadata.resolution)
          enhancedPrompt += `- Resolution: ${metadata.resolution}\n`;
        if (metadata.location)
          enhancedPrompt += `- Location: ${metadata.location} (Please use this location in the coordinates.location field of your JSON response)\n`;
      }

      enhancedPrompt += `\n\nIMPORTANT: Please provide your response in the following JSON format:
{
  "summary": "Brief 2-3 sentence summary for the chat window",
  "confidence": 85.5,
  "landCover": {
    "vegetation": 35.2,
    "water": 12.5,
    "urban": 28.3,
    "bareSoil": 15.0,
    "forest": 5.0,
    "agriculture": 4.0
  },
  "vegetation": {
    "health": "Good",
    "ndvi": 0.65,
    "density": 72.5,
    "types": ["Deciduous Trees", "Grassland", "Shrubs"]
  },
  "waterBodies": {
    "totalArea": 12.5,
    "quality": "Clean",
    "sources": ["River", "Pond"]
  },
  "urban": {
    "builtUpArea": 28.3,
    "development": "High",
    "infrastructure": ["Roads", "Buildings", "Industrial"]
  },
  "environmental": {
    "temperature": 28,
    "humidity": 65,
    "airQuality": "Good",
    "cloudCover": 20
  },
  "features": [
    {
      "type": "Notable Feature",
      "description": "Description",
      "severity": "Medium"
    }
  ],
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "coordinates": {
    "latitude": 0.0,
    "longitude": 0.0,
    "location": "Location Name"
  }
}

Provide ONLY valid JSON. No markdown, no code blocks, just pure JSON.`;

      parts.push({
        text: enhancedPrompt,
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: parts,
              },
            ],
          }),
          signal: controller.signal, // Add abort signal
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from the analysis service");
      }

      const data = await response.json();
      const analysisResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't analyze the image.";

      // Mark pipeline as complete since we got the response
      setIsPipelineComplete(true);

      // Parse JSON response
      let analysisData: AnalysisData | null = null;
      let displayText = analysisResponse;

      try {
        // Try to extract JSON from response (handle if wrapped in markdown code blocks)
        let jsonText = analysisResponse;
        if (analysisResponse.includes("```json")) {
          jsonText = analysisResponse
            .split("```json")[1]
            .split("```")[0]
            .trim();
        } else if (analysisResponse.includes("```")) {
          jsonText = analysisResponse.split("```")[1].split("```")[0].trim();
        }

        analysisData = JSON.parse(jsonText);
        displayText = analysisData.summary;
      } catch (e) {
        console.error(
          "Failed to parse JSON response, attempting text parsing:",
          e
        );
        // Try to extract structured data from text response
        analysisData = parseAnalysisFromText(analysisResponse);
        if (analysisData) {
          displayText = analysisData.summary;
        } else {
          // Fall back to original text response
          displayText = analysisResponse;
        }
      }

      // Generate reasoning steps and extract metrics (fallback if no JSON)
      const reasoningSteps = analysisData
        ? []
        : generateReasoningSteps(analysisResponse);
      const metrics = analysisData
        ? null
        : extractQuantitativeMetrics(analysisResponse);

      // Simulate processing delay - reduced for better UX (3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setCurrentReasoningSteps(reasoningSteps);
      setCurrentMetrics(metrics);
      setCurrentAnalysisData(analysisData);

      // Set progress to 100% when complete
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: displayText,
          reasoningSteps: reasoningSteps,
          quantitativeMetrics: metrics,
          analysisData: analysisData || undefined,
        },
      ]);
    } catch (error: any) {
      // Check if it was aborted
      if (error.name === "AbortError") {
        console.log("Request aborted by user");
        clearInterval(progressInterval);
        return; // Don't show error message for user-initiated abort
      }
      console.error("Error:", error);
      clearInterval(progressInterval);
      toast.error("Failed to process your request");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setIsPipelineComplete(false);
      setShowLogs(false);
      setAbortController(null);
      setAnalysisProgress(0);
      // Keep heatmap visible - don't auto-hide it
      // User can start a new query to hide it
      setUploadedImage(null);
      setUploadedImageName("");
    }
  };

  return (
    <>
      {compareMode && compareImages.length === 2 ? (
        <CompareMode
          image1={compareImages[0]}
          image2={compareImages[1]}
          onClose={() => {
            setCompareMode(false);
            setCompareImages([]);
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
          
          {/* Gradient Overlays for Color */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div
              className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px] animate-pulse"
              style={{ animationDelay: "2s" }}
            />
          </div>

          <div className="relative z-10 h-full flex flex-col max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 flex-shrink-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  VisionGPT-OSS
                </h1>
                <p className="text-sm text-muted-foreground">
                  Earth Observation Reasoning AI
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoiMode(!roiMode)}
                  className={
                    roiMode
                      ? "bg-primary/20 border-primary/40 text-primary-foreground hover:bg-primary/30"
                      : "border-primary/20 hover:bg-primary/10 hover:border-primary/30"
                  }
                >
                  <Crosshair className="w-4 h-4 mr-2" />
                  {roiMode ? "Exit ROI" : "ROI Select"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompareMode}
                  disabled={!uploadedImage && compareImages.length === 0}
                  className={
                    compareImages.length > 0
                      ? "bg-accent/20 border-accent/40 text-accent-foreground hover:bg-accent/30"
                      : "border-accent/20 hover:bg-accent/10 hover:border-accent/30"
                  }
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  {compareImages.length === 0
                    ? "Compare"
                    : compareImages.length === 1
                    ? "Add 2nd Image"
                    : "View Compare"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="border-border hover:bg-muted"
                >
                  Back to Home
                </Button>
              </div>
            </div>

            {/* Compare Images Staging Area */}
            {compareImages.length > 0 && (
              <Card className="mb-3 p-3 bg-accent/5 border-accent/30 animate-fade-in backdrop-blur-sm flex-shrink-0 shadow-lg shadow-accent/10">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2 text-white">
                      Compare Mode Staging
                    </h3>
                    <div className="flex gap-4">
                      {compareImages.map((img, idx) => (
                        <CompareImageItem
                          key={idx}
                          imageUrl={img.url}
                          label={img.label}
                          date={img.date}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {compareImages.length === 1
                      ? "Upload 2nd image →"
                      : "Ready to compare!"}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCompareImages([])}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden">
              {/* Left: Architecture & Metadata */}
              <div className="hidden lg:flex lg:col-span-2 flex-col gap-3 overflow-y-auto pr-1">
                <ArchitectureViz isProcessing={isProcessing} />
                {metadata && <MetadataPanel metadata={metadata} />}
              </div>

              {/* Center: Chat - Reduced from 6 to 5 columns */}
              <div className="lg:col-span-5 col-span-12 flex flex-col min-h-0 gap-3">
                <Card className="flex-1 bg-white/5 backdrop-blur-md border-white/10 overflow-hidden flex flex-col min-h-0 shadow-lg">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-base text-white">
                          Upload an Earth Observation image to begin
                        </p>
                        <p className="text-sm mt-2">
                          Supported formats: JPG, PNG, WebP
                        </p>
                        <p className="text-xs mt-3">
                          Optional: Upload .meta or .txt file for metadata
                        </p>
                      </div>
                    )}

                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        } animate-fade-in`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                            message.role === "user"
                              ? "bg-white text-black"
                              : "bg-white/10 border border-white/20 text-white"
                          }`}
                        >
                          {message.image && (
                            <MessageImage
                              imageUrl={message.image}
                              isRoiMode={roiMode}
                              showAttentionHeatmap={
                                showAttentionHeatmap &&
                                message.role === "user" &&
                                index ===
                                  messages
                                    .map((m, i) => (m.role === "user" ? i : -1))
                                    .filter((i) => i >= 0)
                                    .slice(-1)[0]
                              }
                              onROISelect={handleROISelect}
                            />
                          )}
                          {message.role === "assistant" ? (
                            message.analysisData ? (
                              // For JSON responses, show brief summary
                              <div className="space-y-2">
                                <p className="text-sm leading-relaxed">
                                  {message.content}
                                </p>
                                <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                                  <span className="font-medium">
                                    💡 Detailed analysis available in the
                                    dashboard →
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // For text responses, show full markdown
                              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-gray-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )
                          ) : (
                            <p className="whitespace-pre-wrap">
                              {message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {isProcessing && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="bg-primary/10 border border-primary/30 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg shadow-primary/10">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-foreground">
                            Analyzing...
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-white/10 p-3 bg-black/20 backdrop-blur-sm flex-shrink-0">
                    {uploadedImage && (
                      <ImagePreview
                        imageUrl={uploadedImage}
                        altText="Image to upload"
                        onRemove={() => {
                          setUploadedImage(null);
                          setUploadedImageName("");
                        }}
                      />
                    )}

                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        ref={metadataInputRef}
                        type="file"
                        accept=".meta,.txt"
                        onChange={handleMetadataUpload}
                        className="hidden"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        title="Upload Image"
                        className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/40 h-9 w-9"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => metadataInputRef.current?.click()}
                        disabled={isProcessing}
                        title="Upload Metadata"
                        className="border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/40 h-9 w-9"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && !isProcessing && sendMessage()
                        }
                        placeholder="Ask about the image..."
                        disabled={isProcessing}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 h-9"
                      />
                      <Button
                        onClick={
                          isProcessing ? handleStopProcessing : sendMessage
                        }
                        disabled={
                          !isProcessing && !input.trim() && !uploadedImage
                        }
                        className={
                          isProcessing
                            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground h-9"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground h-9 shadow-lg shadow-primary/20"
                        }
                        title={
                          isProcessing ? "Stop processing" : "Send message"
                        }
                      >
                        {isProcessing ? (
                          <Square className="h-4 w-4" fill="currentColor" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Reasoning Trace */}
                {currentReasoningSteps.length > 0 && (
                  <div className="flex-shrink-0">
                    <ReasoningTrace steps={currentReasoningSteps} />
                  </div>
                )}
              </div>

              {/* Right: Analysis Dashboard - Increased from 4 to 5 columns */}
              <div className="hidden lg:flex lg:col-span-5 flex-col min-h-0 overflow-hidden gap-3">
                {/* Vision Pipeline - Moved here from below prompt */}
                {isProcessing && (
                  <div className="flex-shrink-0">
                    <VisionPipeline
                      isActive={isProcessing}
                      isComplete={isPipelineComplete}
                    />
                  </div>
                )}

                {/* Analysis Dashboard or Loading State */}
                {isProcessing && !currentAnalysisData ? (
                  <Card className="flex-1 flex flex-col items-center justify-center p-6 bg-card/50 backdrop-blur-md border-primary/20 shadow-lg shadow-primary/10">
                    <div className="text-center w-full max-w-md">
                      <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                      <p className="text-lg text-foreground font-semibold mb-2">
                        Analyzing Image...
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Processing Earth Observation data
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Analysis Progress</span>
                          <span>{analysisProgress}%</span>
                        </div>
                        <Progress value={analysisProgress} className="h-2" />
                      </div>
                      <div className="mt-6 text-xs text-muted-foreground space-y-1">
                        <p>• Extracting features</p>
                        <p>• Analyzing land cover</p>
                        <p>• Calculating metrics</p>
                      </div>
                    </div>
                  </Card>
                ) : currentAnalysisData ? (
                  <AnalysisDashboard
                    data={currentAnalysisData}
                    isLoading={isProcessing}
                  />
                ) : currentMetrics ? (
                  <QuantitativeInsights
                    metrics={currentMetrics}
                    isAnimating={true}
                  />
                ) : (
                  <Card className="flex-1 flex items-center justify-center p-6 bg-card/50 backdrop-blur-md border-accent/20 shadow-lg shadow-accent/10">
                    <div className="text-muted-foreground text-center">
                      <Eye className="w-10 h-10 mx-auto mb-2 opacity-50 text-accent" />
                      <p className="text-sm text-foreground">
                        Analysis dashboard will appear here
                      </p>
                      <p className="text-xs mt-2">
                        Upload an image and ask a question to begin
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Mobile Dashboard - Shows below chat on small screens */}
              <div className="lg:hidden col-span-12 mt-4 space-y-3">
                {/* Vision Pipeline for mobile */}
                {isProcessing && (
                  <div className="flex-shrink-0">
                    <VisionPipeline
                      isActive={isProcessing}
                      isComplete={isPipelineComplete}
                    />
                  </div>
                )}

                {/* Loading state for mobile */}
                {isProcessing && !currentAnalysisData && (
                  <Card className="flex flex-col items-center justify-center p-6 bg-white/5 backdrop-blur-md border-white/10 shadow-lg">
                    <div className="text-center w-full">
                      <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
                      <p className="text-base text-white font-semibold mb-2">
                        Analyzing Image...
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        Processing data
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{analysisProgress}%</span>
                        </div>
                        <Progress value={analysisProgress} className="h-2" />
                      </div>
                    </div>
                  </Card>
                )}
                {currentAnalysisData && (
                  <AnalysisDashboard
                    data={currentAnalysisData}
                    isLoading={isProcessing}
                  />
                )}
                {currentMetrics && !currentAnalysisData && (
                  <QuantitativeInsights
                    metrics={currentMetrics}
                    isAnimating={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
