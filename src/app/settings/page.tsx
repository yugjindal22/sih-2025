"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { responseService } from "@/lib/response-service";

export default function SettingsPage() {
    const [adapter, setAdapter] = useState("gemini");
    const [apiKey, setApiKey] = useState("");
    const [localOssUrl, setLocalOssUrl] = useState("");

    useEffect(() => {
        const savedKey = localStorage.getItem("gemini_api_key");
        if (savedKey) setApiKey(savedKey);

        const savedUrl = localStorage.getItem("local_oss_url");
        if (savedUrl) setLocalOssUrl(savedUrl);

        const savedModel = localStorage.getItem("vision_model");
        if (savedModel) setAdapter(savedModel);

        // Get current model from responseService as fallback
        const currentConfig = responseService.getConfig();
        if (!savedModel) setAdapter(currentConfig.defaultModel);
    }, []);

    const handleSave = () => {
        if (adapter === "gemini" && !apiKey) {
            toast.error("Please enter a valid Gemini API key");
            return;
        }

        if (adapter === "local-oss" && !localOssUrl) {
            toast.error("Please enter a valid Local OSS URL");
            return;
        }

        // Save to localStorage
        if (apiKey) localStorage.setItem("gemini_api_key", apiKey);
        if (localOssUrl) localStorage.setItem("local_oss_url", localOssUrl);
        localStorage.setItem("vision_model", adapter);

        // Update responseService configuration
        responseService.updateConfig({
            defaultModel: adapter as "gemini" | "local-oss",
            geminiApiKey: apiKey,
            localOssUrl: localOssUrl,
        });

        toast.success("Settings saved successfully");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Platform
                    </Button>
                </Link>

                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
                                <SettingsIcon className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Configuration</h1>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                            Configure vision analysis backend and system preferences
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Vision Adapter Selection */}
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">Vision Analysis Backend</CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-400">
                                    Select the processing backend for multimodal image analysis
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={adapter} onValueChange={setAdapter}>
                                    <div className="flex items-center space-x-2 mb-4">
                                        <RadioGroupItem value="gemini" id="gemini" />
                                        <Label htmlFor="gemini" className="cursor-pointer text-slate-900 dark:text-white">
                                            <div>
                                                <div className="font-medium">Gemini API</div>
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    Google's multimodal model via cloud API
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="local-oss" id="local-oss" />
                                        <Label htmlFor="local-oss" className="cursor-pointer text-slate-900 dark:text-white">
                                            <div>
                                                <div className="font-medium">Local OSS Pipeline</div>
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    Self-hosted multimodal model (InternVL2-2B)
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* API Configuration */}
                        {adapter === "gemini" && (
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-900 dark:text-white">Gemini API Configuration</CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Configure your Gemini API credentials
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="api-key" className="text-slate-900 dark:text-white">API Key</Label>
                                        <Input
                                            id="api-key"
                                            type="password"
                                            placeholder="Enter your Gemini API key"
                                            value={apiKey}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                                            className="mt-2 border-slate-300 dark:border-slate-700"
                                        />
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                                            Obtain your API key from{" "}
                                            <a
                                                href="https://makersuite.google.com/app/apikey"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Google AI Studio
                                            </a>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {adapter === "local-oss" && (
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-900 dark:text-white">Local OSS Configuration</CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Configure your local multimodal model backend
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="oss-url" className="text-slate-900 dark:text-white">Backend URL</Label>
                                        <Input
                                            id="oss-url"
                                            type="url"
                                            placeholder="https://your-oss-backend.com"
                                            value={localOssUrl}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalOssUrl(e.target.value)}
                                            className="mt-2 border-slate-300 dark:border-slate-700"
                                        />
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                                            The URL of your deployed multimodal OSS model (e.g., InternVL2-2B)
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button onClick={handleSave} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                                Save Configuration
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
