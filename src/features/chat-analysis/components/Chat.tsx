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
  Sparkles,
  CheckCircle2,
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
import CompareMode from "@/features/compare-mode/components/CompareMode";
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
import { responseService } from "@/lib/response-service";

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const metadataInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 0);
  };

  useEffect(() => {
    // Only auto-scroll when processing completes (new assistant message)
    if (!isProcessing && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [isProcessing, messages]);

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
        // Reset input value to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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
      } finally {
        // Reset input value
        if (metadataInputRef.current) {
          metadataInputRef.current.value = "";
        }
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
    // Store current uploaded image to check later if we should clear it
    const currentUploadedImage = uploadedImage;
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
      }

      enhancedPrompt += `

=== ANALYSIS REQUIREMENTS ===

Provide a THOROUGH, HIGHLY DETAILED analysis of this Earth Observation image.

CRITICAL RULES - DO NOT VIOLATE:
1. Analyze ONLY what is visually present in the image
2. Do NOT guess geographic location, country, coordinates, temperature, humidity, or environmental data
3. Do NOT hallucinate data that is not visible
4. Include EVERY important visual element: patterns, relationships, spatial layout, colors, textures, anomalies, features
5. If something cannot be determined visually, state "Not inferable from image" or use null
6. Provide reasoning when meaningful (why something is significant, what it indicates)
7. For environmental data: only use if explicitly in metadata, otherwise null

Your analysis MUST be rich in detail and include:

✓ HIGH-LEVEL SUMMARY: What the image generally shows
✓ KEY VISUAL FEATURES: Detailed list of all important objects, patterns, regions with specific descriptions
✓ SPATIAL RELATIONSHIPS: How elements are arranged relative to each other
✓ NOTABLE OBSERVATIONS: Anything unusual, prominent, or meaningful with explanations
✓ POSSIBLE INTERPRETATIONS: What observed features might imply (only if supported by visible evidence)
✓ DETAILED INSIGHTS: Rich, comprehensive observations about land cover distribution, vegetation patterns, water features, urban development
✓ LIMITATIONS: What cannot be inferred from the image

Write in a clear, structured, professional tone. Be comprehensive and thorough.

IMPORTANT: Please provide your response in the following JSON format:
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
    "temperature": null,
    "humidity": null,
    "airQuality": "Not detectable from image",
    "cloudCover": null
  },
  "features": [
    {
      "type": "Notable Feature",
      "description": "Description",
      "severity": "Medium"
    }
  ],
  "insights": [
    "Detailed insight about spatial patterns and relationships observed",
    "Comprehensive observation about land cover distribution with specific percentages and reasoning",
    "Thorough analysis of notable features, anomalies, or significant visual elements",
    "In-depth interpretation of vegetation health, density patterns, and visible characteristics",
    "Detailed assessment of urban development patterns, infrastructure layout, and spatial organization"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}

Provide ONLY valid JSON. No markdown, no code blocks, just pure JSON.`;

      parts.push({
        text: enhancedPrompt,
      });

      // Use the response service for dynamic model selection
      const analysisResult = await responseService.analyzeImage({
        imageUrls: [imageUrl],
        prompt: enhancedPrompt,
        metadata: {
          satellite: metadata?.satellite,
          sensor: metadata?.sensor,
          date: metadata?.date,
          location: metadata?.location,
        }
      });

      const aiResponse = analysisResult.text;

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
          analysisData: analysisData || undefined,
        },
      ]);
      
      // Clear uploaded image after successful response
      if (currentUploadedImage === uploadedImage) {
        setUploadedImage(null);
        setUploadedImageName("");
      }
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
    // Don't clear uploaded image yet - keep it visible during processing
    const currentUploadedImage = uploadedImage;
    const currentUploadedImageName = uploadedImageName;
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
      }

      enhancedPrompt += `\n\n=== ANALYSIS REQUIREMENTS ===\n\nProvide a THOROUGH, HIGHLY DETAILED analysis of this Earth Observation image.\n\nCRITICAL RULES - DO NOT VIOLATE:\n1. Analyze ONLY what is visually present in the image\n2. Do NOT guess geographic location, country, coordinates, temperature, humidity, or environmental data\n3. Do NOT hallucinate data that is not visible\n4. Include EVERY important visual element: patterns, relationships, spatial layout, colors, textures, anomalies, features\n5. If something cannot be determined visually, state "Not inferable from image" or use null\n6. Provide reasoning when meaningful (why something is significant, what it indicates)\n7. For environmental data: only use if explicitly in metadata, otherwise null\n\nYour analysis MUST be rich in detail and include:\n\n✓ HIGH-LEVEL SUMMARY: What the image generally shows\n✓ KEY VISUAL FEATURES: Detailed list of all important objects, patterns, regions with specific descriptions\n✓ SPATIAL RELATIONSHIPS: How elements are arranged relative to each other\n✓ NOTABLE OBSERVATIONS: Anything unusual, prominent, or meaningful with explanations\n✓ POSSIBLE INTERPRETATIONS: What observed features might imply (only if supported by visible evidence)\n✓ DETAILED INSIGHTS: Rich, comprehensive observations about land cover distribution, vegetation patterns, water features, urban development\n✓ LIMITATIONS: What cannot be inferred from the image\n\nWrite in a clear, structured, professional tone. Be comprehensive and thorough.\n\nIMPORTANT: Please provide your response in the following JSON format:
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
    "temperature": null,
    "humidity": null,
    "airQuality": "Not detectable from image",
    "cloudCover": null
  },
  "features": [
    {
      "type": "Notable Feature",
      "description": "Description",
      "severity": "Medium"
    }
  ],
  "insights": [
    "Detailed insight about spatial patterns and relationships observed",
    "Comprehensive observation about land cover distribution with specific percentages and reasoning",
    "Thorough analysis of notable features, anomalies, or significant visual elements",
    "In-depth interpretation of vegetation health, density patterns, and visible characteristics",
    "Detailed assessment of urban development patterns, infrastructure layout, and spatial organization"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}

IMPORTANT: 
Provide ONLY valid JSON. No markdown, no code blocks,no newline characters, no escpae sequences, just pure JSON in plain text. JSON MODE ON`;

      parts.push({
        text: enhancedPrompt,
      });

      // Use the response service for dynamic model selection
      const analysisResult = await responseService.analyzeImage({
        imageUrls: uploadedImage ? [uploadedImage] : [],
        prompt: enhancedPrompt,
        metadata: {
          satellite: metadata?.satellite,
          sensor: metadata?.sensor,
          date: metadata?.date,
          location: metadata?.location,
        }
      });

      const analysisResponse = analysisResult.text;

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
        if (analysisData) {
          displayText = analysisData.summary;
        }
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
      // Image is now cleared in the success path, not in finally
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
        <div className="relative h-screen bg-background overflow-hidden flex flex-col">
          {/* Grid Pattern Overlay - Theme Aware */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

          {/* Gradient Overlays for Color - Theme Aware */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div
              className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 dark:bg-accent/10 rounded-full blur-[120px] animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative z-10 flex flex-col h-full max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 flex-shrink-0">
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
                      ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
                      : "border-border hover:bg-muted"
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
                      ? "bg-accent/20 border-accent/40 text-accent hover:bg-accent/30"
                      : "border-border hover:bg-muted"
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
              <Card className="mb-4 p-4 bg-accent/5 border-accent/20 animate-fade-in backdrop-blur-sm flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2 text-foreground">
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
                  <div className="text-sm text-muted-foreground">
                    {compareImages.length === 1
                      ? "Upload 2nd image →"
                      : "Ready to compare!"}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCompareImages([])}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
              {/* Left: Architecture & Metadata */}
              <div className="hidden lg:flex lg:col-span-2 flex-col gap-4 overflow-y-auto pr-1">
                <ArchitectureViz isProcessing={isProcessing} />
                {metadata && <MetadataPanel metadata={metadata} />}
              </div>

              {/* Center: Chat */}
              <div className="lg:col-span-5 col-span-12 flex flex-col min-h-0">
                <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border flex flex-col shadow-sm overflow-hidden relative">
                  {/* Messages - Scrollable */}
                  <div 
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-scroll overflow-x-hidden p-4 space-y-4 scroll-smooth min-h-0"
                  >
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-12">
                        <div className="bg-muted/50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-foreground">
                          Upload an Earth Observation image
                        </p>
                        <p className="text-sm mt-2">
                          Supported formats: JPG, PNG, WebP
                        </p>
                        <p className="text-xs mt-3 opacity-70">
                          Optional: Upload .meta or .txt file for metadata
                        </p>
                      </div>
                    )}

                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                          } animate-fade-in`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-card-foreground"
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
                                  <span className="font-medium flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Detailed analysis available in the dashboard
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // For text responses, show full markdown
                              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed">
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
                        <div className="bg-muted border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Analyzing satellite imagery...
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Scroll to Bottom Button */}
                  {showScrollButton && (
                    <Button
                      onClick={scrollToBottom}
                      size="icon"
                      className="absolute bottom-20 right-6 rounded-full shadow-lg z-20 bg-primary hover:bg-primary/90"
                      title="Scroll to bottom"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 15-6 6-6-6"/>
                        <path d="M12 3v18"/>
                      </svg>
                    </Button>
                  )}

                  {/* Input - Fixed at bottom */}
                  <div className="relative z-10 border-t border-border p-4 bg-card backdrop-blur-md flex-shrink-0">
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
                        className="h-10 w-10 shrink-0"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => metadataInputRef.current?.click()}
                        disabled={isProcessing}
                        title="Upload Metadata"
                        className="h-10 w-10 shrink-0"
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
                        className="h-10 bg-background/50"
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
                            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground h-10 px-4"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 shadow-sm"
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
              </div>

              {/* Right: Analysis Dashboard */}
              <div className="hidden lg:flex lg:col-span-5 flex-col min-h-0 overflow-hidden gap-4">
                {/* Vision Pipeline */}
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
                  <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-card/50 backdrop-blur-sm border-border shadow-sm">
                    <div className="text-center w-full max-w-md">
                      <div className="bg-primary/10 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                      <p className="text-xl text-foreground font-semibold mb-2">
                        Analyzing Image...
                      </p>
                      <p className="text-sm text-muted-foreground mb-8">
                        Processing Earth Observation data
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Analysis Progress</span>
                          <span>{analysisProgress}%</span>
                        </div>
                        <Progress value={analysisProgress} className="h-2" />
                      </div>
                      <div className="mt-8 text-xs text-muted-foreground space-y-2 text-left bg-muted/50 p-4 rounded-lg">
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> Extracting visual features
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> Analyzing land cover patterns
                        </p>
                        <p className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Calculating quantitative metrics
                        </p>
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
                  <Card className="flex-1 flex items-center justify-center p-8 bg-card/50 backdrop-blur-sm border-border shadow-sm border-dashed">
                    <div className="text-muted-foreground text-center">
                      <div className="bg-muted rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Eye className="w-10 h-10 opacity-50" />
                      </div>
                      <p className="text-lg font-medium text-foreground">
                        Analysis Dashboard
                      </p>
                      <p className="text-sm mt-2 max-w-xs mx-auto">
                        Upload an image and ask a question to see detailed analytics here
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Mobile Dashboard */}
              <div className="lg:hidden col-span-12 mt-4 space-y-4">
                {isProcessing && (
                  <div className="flex-shrink-0">
                    <VisionPipeline
                      isActive={isProcessing}
                      isComplete={isPipelineComplete}
                    />
                  </div>
                )}

                {isProcessing && !currentAnalysisData && (
                  <Card className="flex flex-col items-center justify-center p-6 bg-card border-border shadow-sm">
                    <div className="text-center w-full">
                      <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
                      <p className="text-base text-foreground font-semibold mb-2">
                        Analyzing Image...
                      </p>
                      <Progress value={analysisProgress} className="h-2" />
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
