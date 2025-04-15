"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { ArrowLeft, Plus, Clock, Pill, Check, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Medication {
  id: string
  name: string
  dosage: string
  schedule: string[]
  taken: Record<string, boolean>
}

export default function MedicationsPage() {
  const { toast } = useToast()
  const [medications, setMedications] = useState<Medication[]>([])
  const [newMedication, setNewMedication] = useState<Omit<Medication, "id" | "taken">>({
    name: "",
    dosage: "",
    schedule: [],
  })
  const [newTime, setNewTime] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [today] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    // Load medications from localStorage
    const savedMedications = localStorage.getItem("medications")
    if (savedMedications) {
      setMedications(JSON.parse(savedMedications))
    }

    // Set up notifications if supported by the browser
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission()
    }

    // Check medications every minute
    const interval = setInterval(checkMedications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Save medications to localStorage whenever they change
    if (medications.length > 0) {
      localStorage.setItem("medications", JSON.stringify(medications))
    }
  }, [medications])

  const checkMedications = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return

    const now = new Date()
    const currentTime = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0")

    medications.forEach((med) => {
      med.schedule.forEach((time) => {
        // Check if it's time to take medication (with a 1-minute margin)
        if (time === currentTime) {
          const todayDate = new Date().toISOString().split("T")[0]
          const key = `${todayDate}-${time}`

          // Check if already taken today at this time
          if (!med.taken || !med.taken[key]) {
            new Notification("Medication Reminder", {
              body: `Time to take ${med.name} - ${med.dosage}`,
              icon: "/icons/icon-192x192.png",
            })
          }
        }
      })
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewMedication((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddTime = () => {
    if (!newTime) return

    if (!newMedication.schedule.includes(newTime)) {
      setNewMedication((prev) => ({
        ...prev,
        schedule: [...prev.schedule, newTime].sort(),
      }))
    }

    setNewTime("")
  }

  const handleRemoveTime = (time: string) => {
    setNewMedication((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((t) => t !== time),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (newMedication.schedule.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time for the medication.",
        variant: "destructive",
      })
      return
    }

    const newMedicationWithId: Medication = {
      ...newMedication,
      id: Date.now().toString(),
      taken: {},
    }

    setMedications((prev) => [...prev, newMedicationWithId])

    // Reset form
    setNewMedication({
      name: "",
      dosage: "",
      schedule: [],
    })

    setDialogOpen(false)

    toast({
      title: "Medication added",
      description: "Your medication has been added successfully.",
    })
  }

  const handleToggleTaken = (medicationId: string, time: string) => {
    const todayDate = new Date().toISOString().split("T")[0]
    const key = `${todayDate}-${time}`

    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === medicationId) {
          const newTaken = { ...med.taken }
          newTaken[key] = !newTaken[key]

          return {
            ...med,
            taken: newTaken,
          }
        }
        return med
      }),
    )
  }

  const handleDeleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((med) => med.id !== id))

    toast({
      title: "Medication removed",
      description: "The medication has been removed successfully.",
    })
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Medications</h1>
        <p className="text-muted-foreground">Manage your medications and reminders</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-6 flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Add Medication
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Medication</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medication Name</Label>
              <Input
                id="name"
                name="name"
                value={newMedication.name}
                onChange={handleChange}
                placeholder="Ex: Lisinopril"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                name="dosage"
                value={newMedication.dosage}
                onChange={handleChange}
                placeholder="Ex: 10mg - 1 tablet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Schedule</Label>
              <div className="flex gap-2">
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="flex-1" />
                <Button type="button" onClick={handleAddTime} size="sm">
                  Add
                </Button>
              </div>

              {newMedication.schedule.length > 0 && (
                <div className="mt-2 space-y-2">
                  {newMedication.schedule.map((time) => (
                    <div key={time} className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{time}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTime(time)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">
              Save Medication
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">You haven't added any medications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {medications.map((medication) => (
            <Card key={medication.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <Pill className="mr-2 h-5 w-5 text-sky-600" />
                    {medication.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteMedication(medication.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{medication.dosage}</p>

                <div className="space-y-3">
                  {medication.schedule.map((time) => {
                    const key = `${today}-${time}`
                    const taken = medication.taken?.[key] || false

                    return (
                      <div key={time} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{time}</span>
                        </div>
                        <Button
                          type="button"
                          variant={taken ? "default" : "outline"}
                          size="sm"
                          className={taken ? "bg-sky-600 hover:bg-sky-700" : ""}
                          onClick={() => handleToggleTaken(medication.id, time)}
                        >
                          {taken ? (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Taken
                            </>
                          ) : (
                            "Mark as taken"
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
