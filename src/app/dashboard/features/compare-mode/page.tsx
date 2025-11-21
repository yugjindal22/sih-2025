"use client";

// Copied from prototype - CompareMode feature
import { useState } from "react";
import CompareMode from "@/features/compare-mode/components/CompareMode";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CompareModePage() {
    const router = useRouter();
    const [compareImages, setCompareImages] = useState<
        { url: string; label: string; date?: string }[]
    >([]);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedImageName, setUploadedImageName] = useState<string>("");
    const [compareMode, setCompareMode] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setUploadedImage(imageUrl);
                setUploadedImageName(file.name);

                if (compareImages.length === 0) {
                    setCompareImages([{ url: imageUrl, label: file.name }]);
                    setUploadedImage(null);
                    toast.success("First image added. Upload a second image to compare.");
                } else if (compareImages.length === 1) {
                    setCompareImages((prev) => [...prev, { url: imageUrl, label: file.name }]);
                    setUploadedImage(null);
                    setCompareMode(true);
                    toast.success("Compare mode activated!");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-background">
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
                <div className="container mx-auto px-4 py-12">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard")}
                        className="mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-4xl font-bold mb-4">Compare Mode</h1>
                        <p className="text-muted-foreground mb-8">
                            Upload two satellite images to perform AI-powered change detection analysis
                        </p>

                        <div className="space-y-4">
                            <div className="p-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    {compareImages.length === 0
                                        ? "Upload first image"
                                        : "Upload second image"}
                                </p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload">
                                    <Button asChild>
                                        <span>Choose Image</span>
                                    </Button>
                                </label>
                            </div>

                            {compareImages.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    {compareImages.length} of 2 images uploaded
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
