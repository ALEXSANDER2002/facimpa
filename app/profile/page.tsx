"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfileData {
  name: string
  age: string
  smokes: boolean
  drinks: boolean
  hasHypertension: boolean
  hypertensionControlled: string
  hasDiabetes: boolean
  diabetesControlled: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    age: "",
    smokes: false,
    drinks: false,
    hasHypertension: false,
    hypertensionControlled: "yes",
    hasDiabetes: false,
    diabetesControlled: "yes",
  })

  useEffect(() => {
    // Load profile data from localStorage
    const savedProfile = localStorage.getItem("profile")
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Save to localStorage
    localStorage.setItem("profile", JSON.stringify(profile))
    toast({
      title: "Profile saved",
      description: "Your information has been saved successfully.",
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
        <h1 className="text-2xl font-bold mt-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={profile.age}
                onChange={handleChange}
                placeholder="Enter your age"
                required
                min="1"
                max="120"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Health Habits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="smokes" className="cursor-pointer">
                Do you smoke?
              </Label>
              <Switch
                id="smokes"
                name="smokes"
                checked={profile.smokes}
                onCheckedChange={(checked) => handleSwitchChange("smokes", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="drinks" className="cursor-pointer">
                Do you consume alcoholic beverages?
              </Label>
              <Switch
                id="drinks"
                name="drinks"
                checked={profile.drinks}
                onCheckedChange={(checked) => handleSwitchChange("drinks", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="hasHypertension" className="cursor-pointer">
                Do you have high blood pressure (hypertension)?
              </Label>
              <Switch
                id="hasHypertension"
                name="hasHypertension"
                checked={profile.hasHypertension}
                onCheckedChange={(checked) => handleSwitchChange("hasHypertension", checked)}
              />
            </div>

            {profile.hasHypertension && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label>Is your blood pressure controlled?</Label>
                <RadioGroup
                  value={profile.hypertensionControlled}
                  onValueChange={(value) => handleRadioChange("hypertensionControlled", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="hypertension-yes" />
                    <Label htmlFor="hypertension-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="hypertension-no" />
                    <Label htmlFor="hypertension-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unknown" id="hypertension-unknown" />
                    <Label htmlFor="hypertension-unknown">I don't know</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="hasDiabetes" className="cursor-pointer">
                Do you have diabetes?
              </Label>
              <Switch
                id="hasDiabetes"
                name="hasDiabetes"
                checked={profile.hasDiabetes}
                onCheckedChange={(checked) => handleSwitchChange("hasDiabetes", checked)}
              />
            </div>

            {profile.hasDiabetes && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label>Is your blood glucose controlled?</Label>
                <RadioGroup
                  value={profile.diabetesControlled}
                  onValueChange={(value) => handleRadioChange("diabetesControlled", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="diabetes-yes" />
                    <Label htmlFor="diabetes-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="diabetes-no" />
                    <Label htmlFor="diabetes-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unknown" id="diabetes-unknown" />
                    <Label htmlFor="diabetes-unknown">I don't know</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full mt-6 flex items-center justify-center gap-2">
          <Save className="h-4 w-4" />
          Save Profile
        </Button>
      </form>
    </main>
  )
}
