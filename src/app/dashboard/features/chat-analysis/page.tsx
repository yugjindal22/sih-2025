"use client";

// Copied from prototype - Chat Analysis feature
import { useRouter } from "next/navigation";
import Chat from "@/features/chat-analysis/components/Chat";

export default function ChatAnalysisPage() {
    const router = useRouter();

    const handleBack = () => {
        router.push("/dashboard");
    };

    return <Chat onBack={handleBack} />;
}
