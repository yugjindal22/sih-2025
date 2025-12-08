"use client";

import { useState } from "react";
import CloudMasking from "@/features/cloud-masking/components/CloudMasking";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, ArrowLeft, CloudOff, Info, Server, Settings, FileArchive, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cloudMaskService } from "@/lib/cloud-mask-service";

export default function CloudMaskingPage() {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendUrl, setBackendUrl] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("cloud_mask_backend_url") || "http://localhost:8000"
      : "http://localhost:8000"
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<{
    available: boolean;
    message?: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type - must be .zip
      if (!file.name.endsWith('.zip')) {
        toast.error("Please upload a .zip file");
        return;
      }

      // Validate SAFE format naming
      const safePattern = /S2[AB]_MSIL2A_\d{8}T\d{6}_N\d{4}_R\d{3}_T\w+\.SAFE\.zip/;
      if (!safePattern.test(file.name)) {
        toast.error("Invalid SAFE format", {
          description: "Expected: S2A_MSIL2A_YYYYMMDDTHHMMSS_NXXXX_RXXX_TXXXXX.SAFE.zip",
        });
        return;
      }

      // Check file size (max 500MB for SAFE files)
      if (file.size > 500 * 1024 * 1024) {
        toast.error("File size must be less than 500MB");
        return;
      }

      setUploadedFile(file);
      setIsProcessing(true);
      toast.success("SAFE file uploaded successfully!");
    }
  };

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await cloudMaskService.checkServiceHealth();
      setServiceStatus(health);
      
      if (health.available) {
        toast.success("Backend service is available!", {
          description: health.message,
        });
      } else {
        toast.error("Backend service is not available", {
          description: health.message,
        });
      }
    } catch (error) {
      toast.error("Failed to check service health");
      setServiceStatus({
        available: false,
        message: "Cannot connect to service",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSaveSettings = () => {
    cloudMaskService.updateConfig({ backendUrl });
    toast.success("Settings saved!");
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {isProcessing && uploadedFile ? (
        <CloudMasking
          safeFile={uploadedFile}
          onClose={() => {
            setIsProcessing(false);
            setUploadedFile(null);
          }}
        />
      ) : (
        <div className="container mx-auto px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                <CloudOff className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Cloud Masking - Sentinel-2</h1>
              <p className="text-muted-foreground mb-4">
                Automated cloud detection and removal using s2cloudless
              </p>
              <div className="flex gap-2 justify-center">
                <Badge variant="outline" className="text-xs">
                  Sentinel-2 L2A SAFE Format
                </Badge>
                <Badge variant="outline" className="text-xs">
                  s2cloudless Model
                </Badge>
              </div>
            </div>

            {/* Settings Card */}
            {showSettings && (
              <Card className="p-6 mb-6 border-primary">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Backend Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure the backend API endpoint URL
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Backend URL
                    </label>
                    <input
                      type="url"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="http://localhost:8000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: http://localhost:8000
                    </p>
                  </div>

                  <Button onClick={handleSaveSettings} className="w-full">
                    Save Configuration
                  </Button>
                </div>
              </Card>
            )}

            {/* Service Status Card */}
            {serviceStatus && (
              <Card className="p-4 mb-6 border-primary/50">
                <div className="flex items-center gap-3">
                  {serviceStatus.available ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {serviceStatus.available ? "Service Online" : "Service Offline"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {serviceStatus.message}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Upload Card */}
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <FileArchive className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Upload Sentinel-2 SAFE File</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                  Upload a Sentinel-2 L2A SAFE format .zip file for cloud masking
                </p>

                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Select SAFE File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <p className="text-xs text-muted-foreground mt-4">
                  Max file size: 500MB
                </p>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleCheckHealth}
                disabled={isCheckingHealth}
              >
                <Server className="w-4 h-4 mr-2" />
                {isCheckingHealth ? "Checking..." : "Check Service"}
              </Button>
            </div>

            {/* Info Section */}
            <Card className="mt-8 p-6 bg-card/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3">
                    SAFE Format Requirements
                  </h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">File Naming:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        S2A_MSIL2A_20240714T082601_N0509_R021_T36LYH.SAFE.zip
                      </code>
                    </div>

                    <div>
                      <p className="font-medium text-foreground mb-1">Required Structure:</p>
                      <pre className="text-xs bg-muted p-3 rounded leading-relaxed">
{`.SAFE/
  └── GRANULE/
        └── <GRANULE_ID>/
              └── IMG_DATA/
                      └── R10m/*.jp2   (B02, B03, B04, B08)`}
                      </pre>
                    </div>

                    <div>
                      <p className="font-medium text-foreground mb-1">Outputs Generated:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Clean RGB:</strong> Cloud-removed true color composite</li>
                        <li><strong>Cloud Mask:</strong> Binary mask (255=cloud, 0=clear)</li>
                        <li><strong>Cloud Probability:</strong> Likelihood heatmap (0-1)</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-foreground mb-1">Processing Pipeline:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Extract SAFE zip file</li>
                        <li>Load B02, B03, B04, B08 bands (10m resolution)</li>
                        <li>Normalize reflectance values</li>
                        <li>Run s2cloudless cloud probability model</li>
                        <li>Apply threshold to generate binary mask</li>
                        <li>Create cloud-removed RGB composite</li>
                        <li>Convert outputs to Base64 PNG format</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* API Documentation Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                For backend implementation, see{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  src/features/cloud-masking/README.md
                </code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
