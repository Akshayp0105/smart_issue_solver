"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Check, MapPin, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { auth, db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

const STEPS = [
  { id: "category", title: "What type of issue is this?", icon: Tag },
  { id: "location", title: "Where is the problem?", icon: MapPin },
  { id: "details", title: "Add some details.", icon: Camera },
  { id: "review", title: "Review Report", icon: Check },
]

const CATEGORIES = [
  "Maintenance",
  "Electrical",
  "Plumbing",
  "IT / Network",
  "Safety",
  "Other",
]

// ✅ NAMED EXPORT (IMPORTANT)
export function ReportWizard() {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)

  const [coords, setCoords] = React.useState<{
    latitude: number | null
    longitude: number | null
  }>({ latitude: null, longitude: null })

  const [formData, setFormData] = React.useState({
    category: "",
    location: "",
    description: "",
    imageBase64: null as string | null,
  })

  // 📍 GPS (SAFE, NON-BLOCKING)
  React.useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => {
        setCoords({ latitude: null, longitude: null })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const next = () =>
    setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1))
  const back = () =>
    setCurrentStep((p) => Math.max(p - 1, 0))

  async function submitReport() {
    setSubmitting(true)

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("User not authenticated")
      }

      await addDoc(collection(db!, "reports"), {
        category: formData.category,
        location: formData.location,
        description: formData.description,
        imageBase64: formData.imageBase64 ?? null,

        latitude: coords.latitude ?? null,
        longitude: coords.longitude ?? null,

        status: "pending",
        userId: user.uid,
        createdAt: serverTimestamp(),
      })

      // ✅ SAFE NAVIGATION
      window.location.assign("/dashboard")
    } catch (err) {
      console.error("Report submission failed:", err)
      alert("Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 md:py-16 px-6">
      {/* PROGRESS */}
      <div className="flex items-center gap-2 mb-12">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-colors duration-500",
              i <= currentStep ? "bg-primary" : "bg-muted"
            )}
            animate={{ flex: i === currentStep ? 2 : 1 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          <div className="space-y-8 min-h-[400px]">
            <h2 className="text-3xl font-medium">
              {STEPS[currentStep].title}
            </h2>

            {currentStep === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFormData({ ...formData, category: cat })
                      setTimeout(next, 200)
                    }}
                    className={cn(
                      "p-6 rounded-2xl border text-left transition-all",
                      formData.category === cat
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                  >
                    <span className="font-medium">{cat}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <Input
                placeholder="Enter location"
                className="h-16 text-lg rounded-2xl"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            )}

            {currentStep === 2 && (
              <>
                <Textarea
                  className="min-h-[160px]"
                  placeholder="Describe the issue"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                />
                <ImageUploader
                  imageBase64={formData.imageBase64}
                  onImage={(img) =>
                    setFormData({ ...formData, imageBase64: img })
                  }
                />
              </>
            )}

            {currentStep === 3 && (
              <div className="p-6 border rounded-xl space-y-2">
                <p><b>Category:</b> {formData.category}</p>
                <p><b>Location:</b> {formData.location}</p>
                <p><b>Description:</b> {formData.description}</p>
                <p className="text-sm text-muted-foreground">
                  GPS: {coords.latitude ? "Captured" : "Not available"}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={back} disabled={currentStep === 0}>
                Back
              </Button>

              <Button
                size="lg"
                className="rounded-full"
                disabled={
                  submitting ||
                  (currentStep === 3 &&
                    (!formData.category ||
                      !formData.location ||
                      !formData.description))
                }
                onClick={
                  currentStep === STEPS.length - 1
                    ? submitReport
                    : next
                }
              >
                {submitting ? "Submitting..." : "Continue"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function ImageUploader({
  imageBase64,
  onImage,
}: {
  imageBase64: string | null
  onImage: (b64: string) => void
}) {
  const ref = React.useRef<HTMLInputElement>(null)

  function read(file: File) {
    const r = new FileReader()
    r.onloadend = () => onImage(r.result as string)
    r.readAsDataURL(file)
  }

  return (
    <div
      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer"
      onClick={() => ref.current?.click()}
    >
      <input
        ref={ref}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) =>
          e.target.files && read(e.target.files[0])
        }
      />
      {imageBase64 ? "Image attached" : "Click to upload image"}
    </div>
  )
}
