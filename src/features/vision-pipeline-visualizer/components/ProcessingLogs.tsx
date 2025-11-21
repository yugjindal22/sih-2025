import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const logs = [
  { message: "Extracting vision embeddings from the input image...", delay: 0 },
  { message: "Processing visual features in the GeoVision encoder...", delay: 500 },
  { message: "Aligning multimodal tokens via projection layer...", delay: 1000 },
  { message: "Routing through the GeoVision reasoning backbone...", delay: 1500 },
  { message: "Generating textual reasoning and analysis...", delay: 2000 },
  { message: "Synthesizing final response...", delay: 2500 },
];

const ProcessingLogs = () => {
  const [completedLogs, setCompletedLogs] = useState<number[]>([]);
  const [currentLog, setCurrentLog] = useState<number>(-1);

  useEffect(() => {
    logs.forEach((log, index) => {
      setTimeout(() => {
        setCurrentLog(index);
        if (index < logs.length - 1) {
          setTimeout(() => {
            setCompletedLogs((prev) => [...prev, index]);
          }, 400);
        }
      }, log.delay);
    });

    return () => {
      setCompletedLogs([]);
      setCurrentLog(-1);
    };
  }, []);

  return (
    <Card className="mt-4 bg-card/50 backdrop-blur-sm border-border shadow-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Processing Logs</h3>
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 text-sm transition-opacity ${
              index <= currentLog ? "opacity-100 animate-fade-in" : "opacity-0"
            }`}
          >
            {index <= currentLog ? (
              completedLogs.includes(index) ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-primary animate-spin mt-0.5 flex-shrink-0" />
              )
            ) : null}
            <span className={index <= currentLog ? "text-foreground" : "text-muted-foreground"}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ProcessingLogs;
