import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

const HeatmapClient = dynamic(
  () => import("./HeatmapClient"),
  { ssr: false }
);

export default function HeatmapPage() {
  return (
    <div className="h-screen flex flex-col relative bg-muted/20">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-background/80 backdrop-blur-md border rounded-xl px-4 py-3 shadow-sm flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-sm">Campus Issue Heatmap</h1>
            <p className="text-xs text-muted-foreground">
              Real reported locations
            </p>
          </div>
        </div>

        <Button
          className="pointer-events-auto"
          variant="outline"
        >
          <MapPin className="w-4 h-4 mr-2" />
          My Location
        </Button>
      </div>

      <HeatmapClient />
    </div>
  );
}
