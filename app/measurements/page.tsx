"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, Plus, Activity, Droplet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Measurement {
  id: string
  type: "bloodPressure" | "bloodGlucose"
  value1: string // systolic or glucose
  value2?: string // diastolic (only for blood pressure)
  period: "morning" | "afternoon" | "evening"
  date: string
  time: string
}

export default function MeasurementsPage() {
  const { toast } = useToast()
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [newMeasurement, setNewMeasurement] = useState<Omit<Measurement, "id">>({
    type: "bloodPressure",
    value1: "",
    value2: "",
    period: "morning",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
  })

  useEffect(() => {
    // Load measurements from localStorage
    const savedMeasurements = localStorage.getItem("measurements")
    if (savedMeasurements) {
      setMeasurements(JSON.parse(savedMeasurements))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewMeasurement((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewMeasurement((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTabChange = (value: string) => {
    setNewMeasurement((prev) => ({
      ...prev,
      type: value as "bloodPressure" | "bloodGlucose",
      value1: "",
      value2: value === "bloodPressure" ? "" : undefined,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newMeasurementWithId: Measurement = {
      ...(newMeasurement as any),
      id: Date.now().toString(),
    }

    const updatedMeasurements = [...measurements, newMeasurementWithId]
    setMeasurements(updatedMeasurements)

    // Save to localStorage
    localStorage.setItem("measurements", JSON.stringify(updatedMeasurements))

    // Reset form
    setNewMeasurement({
      type: newMeasurement.type,
      value1: "",
      value2: newMeasurement.type === "bloodPressure" ? "" : undefined,
      period: newMeasurement.period,
      date: newMeasurement.date,
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
    })

    toast({
      title: "Measurement recorded",
      description: "Your measurement has been saved successfully.",
    })
  }

  // Filter measurements by type and sort by date (most recent first)
  const bloodPressureMeasurements = measurements
    .filter((m) => m.type === "bloodPressure")
    .sort((a, b) => new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime())

  const bloodGlucoseMeasurements = measurements
    .filter((m) => m.type === "bloodGlucose")
    .sort((a, b) => new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime())

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Health Measurements</h1>
        <p className="text-muted-foreground">Record and track your measurements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Measurement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs value={newMeasurement.type} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bloodPressure" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Blood Pressure
                </TabsTrigger>
                <TabsTrigger value="bloodGlucose" className="flex items-center gap-1">
                  <Droplet className="h-4 w-4" />
                  Blood Glucose
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bloodPressure" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value1">Systolic (mmHg)</Label>
                    <Input
                      id="value1"
                      name="value1"
                      type="number"
                      value={newMeasurement.value1}
                      onChange={handleChange}
                      placeholder="Ex: 120"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value2">Diastolic (mmHg)</Label>
                    <Input
                      id="value2"
                      name="value2"
                      type="number"
                      value={newMeasurement.value2}
                      onChange={handleChange}
                      placeholder="Ex: 80"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bloodGlucose" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="value1">Blood Glucose (mg/dL)</Label>
                  <Input
                    id="value1"
                    name="value1"
                    type="number"
                    value={newMeasurement.value1}
                    onChange={handleChange}
                    placeholder="Ex: 100"
                    required
                  />
                </div>
              </TabsContent>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={newMeasurement.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={newMeasurement.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="period">Period</Label>
                <Select value={newMeasurement.period} onValueChange={(value) => handleSelectChange("period", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full mt-6 flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Record Measurement
              </Button>
            </Tabs>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-red-600" />
              Blood Pressure History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bloodPressureMeasurements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No blood pressure measurements recorded</p>
            ) : (
              <div className="space-y-3">
                {bloodPressureMeasurements.slice(0, 5).map((measurement) => (
                  <div key={measurement.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">
                        {measurement.value1}/{measurement.value2} mmHg
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(measurement.date).toLocaleDateString()} - {measurement.time} -{" "}
                        {measurement.period === "morning"
                          ? "Morning"
                          : measurement.period === "afternoon"
                            ? "Afternoon"
                            : "Evening"}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        Number.parseInt(measurement.value1) > 140 || Number.parseInt(measurement.value2 || "0") > 90
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {Number.parseInt(measurement.value1) > 140 || Number.parseInt(measurement.value2 || "0") > 90
                        ? "Elevated"
                        : "Normal"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplet className="mr-2 h-5 w-5 text-blue-600" />
              Blood Glucose History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bloodGlucoseMeasurements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No blood glucose measurements recorded</p>
            ) : (
              <div className="space-y-3">
                {bloodGlucoseMeasurements.slice(0, 5).map((measurement) => (
                  <div key={measurement.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{measurement.value1} mg/dL</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(measurement.date).toLocaleDateString()} - {measurement.time} -{" "}
                        {measurement.period === "morning"
                          ? "Morning"
                          : measurement.period === "afternoon"
                            ? "Afternoon"
                            : "Evening"}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        Number.parseInt(measurement.value1) > 180
                          ? "bg-red-100 text-red-800"
                          : Number.parseInt(measurement.value1) < 70
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {Number.parseInt(measurement.value1) > 180
                        ? "Elevated"
                        : Number.parseInt(measurement.value1) < 70
                          ? "Low"
                          : "Normal"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
