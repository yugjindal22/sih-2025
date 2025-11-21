"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [adapter, setAdapter] = useState("gemini");
    const [apiKey, setApiKey] = useState("");

    const handleSave = () => {
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
                                        <RadioGroupItem value="local" id="local" disabled />
                                        <Label htmlFor="local" className="cursor-not-allowed opacity-50 text-slate-900 dark:text-white">
                                            <div>
                                                <div className="font-medium">Local Pipeline</div>
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    On-premise GPT-OSS with vision encoder (In Development)
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
                                    <CardTitle className="text-slate-900 dark:text-white">API Configuration</CardTitle>
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
