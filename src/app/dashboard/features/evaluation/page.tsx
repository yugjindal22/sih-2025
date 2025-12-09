"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { localPipelineAdapter } from "@/lib/adapters/localPipelineAdapter";
import vqaData from "../../../../../vqa.json";
import capData from "../../../../../cap.json";
import { Loader2, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";

interface VQAQuestion {
  image_id: string;
  question: string;
  ground_truth: string;
  dataset: string;
  question_id: number;
  type: string;
}

interface CaptionQuestion {
  image_id: string;
  ground_truth: string;
  question: string;
  dataset: string;
  question_id: number;
  type: string;
}

// Available images in vrs_bench_data folder
const AVAILABLE_IMAGES = [
  "P0003_0002.png",
  "P0003_0004.png",
  "00008_0000.png",
  "05865_0000.png",
  "05875_0000.png",
  "05935_0000.png",
  "05951_0000.png",
  "06092_0000.png",
  "06376_0000.png",
  "06757_0000.png",
];

// Map .png to .jpeg for the old P00 images only
const IMAGE_NAME_MAP: Record<string, string> = {
  "P0003_0002.png": "P0003_0002.jpeg",
  "P0003_0004.png": "P0003_0004.jpeg",
};

// Helper to get actual image path
const getImagePath = (imageId: string) => {
  const actualName = IMAGE_NAME_MAP[imageId] || imageId;
  return `/vrs_bench_data/${actualName}`;
};

export default function EvaluationPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<VQAQuestion | CaptionQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverResponse, setServerResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter questions for selected image
  const getQuestionsForImage = () => {
    if (!selectedImage) return { vqa: [], caption: [] };
    
    const vqa = (vqaData as VQAQuestion[]).filter(q => q.image_id === selectedImage);
    const caption = (capData as CaptionQuestion[]).filter(q => q.image_id === selectedImage);
    
    return { vqa, caption };
  };

  const questions = getQuestionsForImage();

  const handleImageSelect = (imageId: string) => {
    setSelectedImage(imageId);
    setSelectedQuestion(null);
    setServerResponse(null);
    setError(null);
  };

  const handleQuestionSelect = (question: VQAQuestion | CaptionQuestion) => {
    setSelectedQuestion(question);
    setServerResponse(null);
    setError(null);
  };

  const handleEvaluate = async () => {
    if (!selectedImage || !selectedQuestion) return;

    setIsLoading(true);
    setError(null);
    setServerResponse(null);

    try {
      // Convert image to base64
      const imageResponse = await fetch(getImagePath(selectedImage));
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to load image: ${imageResponse.statusText}`);
      }
      
      const blob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Send to server with VQA-optimized prompt
      const isVQA = selectedQuestion.type !== "caption";
      
      // For VQA: Use extremely minimal prompt to get direct answer only
      // For Caption: Use system prompt to enforce concise, direct responses
      let prompt = "";
      
      if (isVQA) {
        prompt = `SYSTEM: You must respond ONLY to what the user asks. Be direct and concise. Do not add explanations, elaborations, or extra details. Answer exactly what is requested, nothing more.\n\nQ: ${selectedQuestion.question}\nA:`;
      } else {
        // Captioning with strict system prompt
        prompt = `SYSTEM: You must respond ONLY to what the user asks. Be direct and concise. Do not add explanations, elaborations, or extra details. Answer exactly what is requested, nothing more.\n\nUSER: ${selectedQuestion.question}\n\nRESPONSE:`;
      }

      const result = await localPipelineAdapter.analyzeImage({
        imageUrls: [base64],
        prompt: prompt,
      }, {
        skipSanitization: true, // Get raw response from model without Gemini processing
      });

      // Extract clean answer for VQA questions
      let responseText = result.text.trim();
      
      if (isVQA) {
        // Remove any JSON formatting
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.answer) {
            responseText = parsed.answer;
          } else if (parsed.summary) {
            responseText = parsed.summary;
          } else if (typeof parsed === 'string') {
            responseText = parsed;
          }
        } catch {
          // Not JSON - extract first sentence or short answer
          // Remove markdown, code blocks, etc.
          responseText = responseText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .replace(/^[^a-zA-Z0-9]+/, '') // Remove leading non-alphanumeric
            .split('\n')[0] // Take first line
            .split('.')[0] // Take first sentence
            .trim();
        }
      }

      setServerResponse(responseText);
    } catch (err: any) {
      console.error("Evaluation error:", err);
      setError(err.message || "Failed to evaluate image");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">VQA/Caption Evaluation</h1>
        <p className="text-muted-foreground">
          Evaluate vision model responses against ground truth data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Select Image
            </CardTitle>
            <CardDescription>Choose an image from VRS benchmark dataset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {AVAILABLE_IMAGES.map((imageId) => (
              <Button
                key={imageId}
                variant={selectedImage === imageId ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleImageSelect(imageId)}
              >
                {imageId}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Question Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Question</CardTitle>
            <CardDescription>
              {selectedImage
                ? `${questions.vqa.length + questions.caption.length} questions available`
                : "Select an image first"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {!selectedImage ? (
                <div className="text-center text-muted-foreground py-8">
                  Please select an image to see available questions
                </div>
              ) : (
                <div className="space-y-4">
                  {/* VQA Questions */}
                  {questions.vqa.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        VQA Questions
                        <Badge variant="secondary">{questions.vqa.length}</Badge>
                      </h3>
                      <div className="space-y-2">
                        {questions.vqa.map((q) => (
                          <Card
                            key={`vqa-${q.question_id}`}
                            className={`cursor-pointer transition-colors ${
                              selectedQuestion === q ? "border-primary" : ""
                            }`}
                            onClick={() => handleQuestionSelect(q)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium">{q.question}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Type: {q.type}
                                  </p>
                                </div>
                                <Badge variant="outline">{q.dataset}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caption Questions */}
                  {questions.caption.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        Caption Questions
                        <Badge variant="secondary">{questions.caption.length}</Badge>
                      </h3>
                      <div className="space-y-2">
                        {questions.caption.map((q) => (
                          <Card
                            key={`cap-${q.question_id}`}
                            className={`cursor-pointer transition-colors ${
                              selectedQuestion === q ? "border-primary" : ""
                            }`}
                            onClick={() => handleQuestionSelect(q)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium">{q.question}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Type: {q.type}
                                  </p>
                                </div>
                                <Badge variant="outline">{q.dataset}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview and Evaluation Section - Always visible when image is selected */}
      {selectedImage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Image Preview</CardTitle>
              <CardDescription>
                {selectedQuestion ? `Q: ${selectedQuestion.question}` : "Select a question to evaluate"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img
                src={getImagePath(selectedImage)}
                alt={selectedImage}
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: "500px" }}
              />
            </CardContent>
          </Card>

          {/* Evaluation Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {serverResponse ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Evaluation Results
                  </>
                ) : (
                  "Waiting for Evaluation"
                )}
              </CardTitle>
              {selectedQuestion && (
                <CardDescription>
                  Type: {selectedQuestion.type} | Dataset: {selectedQuestion.dataset}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Evaluate Button */}
              {selectedQuestion && (
                <div className="flex justify-center pb-4">
                  <Button
                    size="lg"
                    onClick={handleEvaluate}
                    disabled={isLoading}
                    className="min-w-[200px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      "Evaluate"
                    )}
                  </Button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Results Comparison */}
              {serverResponse && selectedQuestion ? (
                <div className="space-y-4">
                  {/* Ground Truth */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Ground Truth</h3>
                      <Badge variant="secondary">Reference</Badge>
                    </div>
                    <Separator className="mb-3" />
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedQuestion.ground_truth}</p>
                    </div>
                  </div>

                  {/* Server Response */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Server Response</h3>
                      <Badge variant="default">Model Output</Badge>
                    </div>
                    <Separator className="mb-3" />
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="whitespace-pre-wrap">{serverResponse}</p>
                    </div>
                  </div>
                </div>
              ) : (
                !error && (
                  <div className="text-center text-muted-foreground py-8">
                    {selectedQuestion
                      ? "Click 'Evaluate' to get the model's response"
                      : "Select a question to begin evaluation"}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
