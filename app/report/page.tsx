import { ReportWizard } from "@/components/report/report-wizard"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ReportPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 md:p-12">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel and return to workspace
                </Link>
                <ReportWizard />
            </div>
        </div>
    )
}
