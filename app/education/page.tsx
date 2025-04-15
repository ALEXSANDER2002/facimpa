import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function EducationPage() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Educational Resources</h1>
        <p className="text-muted-foreground">Important information about your health</p>
      </div>

      <Tabs defaultValue="hypertension" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hypertension">Hypertension</TabsTrigger>
          <TabsTrigger value="diabetes">Diabetes</TabsTrigger>
          <TabsTrigger value="stroke">Stroke</TabsTrigger>
        </TabsList>
        <TabsContent value="hypertension">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Hypertension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Hypertension, or high blood pressure, is when the force of blood against your artery walls is
                consistently too high.
              </p>
              <p>
                <strong>What is considered high blood pressure?</strong>
                <br />
                Blood pressure readings above 140/90 mmHg are generally considered elevated.
              </p>
              <p>
                <strong>Why controlling blood pressure is important:</strong>
                <br />
                Uncontrolled high blood pressure can damage your blood vessels and increase your risk of stroke, heart
                attack, kidney problems, and other health issues.
              </p>
              <p>
                <strong>How to control hypertension:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Take your medications as prescribed</li>
                <li>Reduce sodium (salt) in your diet</li>
                <li>Exercise regularly</li>
                <li>Maintain a healthy weight</li>
                <li>Limit alcohol consumption</li>
                <li>Don't smoke</li>
                <li>Manage stress</li>
                <li>Monitor your blood pressure regularly</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="diabetes">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Diabetes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Diabetes is a chronic condition that affects how your body processes blood sugar (glucose).</p>
              <p>
                <strong>What is considered diabetes?</strong>
                <br />
                Fasting blood glucose above 126 mg/dL or A1C above 6.5%.
              </p>
              <p>
                <strong>Why controlling diabetes is important:</strong>
                <br />
                Uncontrolled diabetes can damage blood vessels, nerves, and organs. It significantly increases the risk
                of stroke, heart problems, kidney disease, eye problems, and foot complications.
              </p>
              <p>
                <strong>How to control diabetes:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Take your medications as prescribed</li>
                <li>Monitor your blood glucose regularly</li>
                <li>Follow a balanced diet</li>
                <li>Reduce consumption of refined sugars and carbohydrates</li>
                <li>Exercise regularly</li>
                <li>Maintain a healthy weight</li>
                <li>Attend regular medical check-ups</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stroke">
          <Card>
            <CardHeader>
              <CardTitle>Preventing Stroke</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A stroke occurs when blood flow to a part of the brain is interrupted, causing brain cells to die due to
                lack of oxygen.
              </p>
              <p>
                <strong>Why hypertension and diabetes increase stroke risk:</strong>
                <br />
                Both conditions damage blood vessels over time. Hypertension can weaken vessels in the brain, while
                diabetes can accelerate the formation of plaques in arteries.
              </p>
              <p>
                <strong>Warning signs of a stroke:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sudden weakness or numbness in the face, arm, or leg, especially on one side of the body</li>
                <li>Sudden confusion, trouble speaking or understanding speech</li>
                <li>Sudden trouble seeing in one or both eyes</li>
                <li>Sudden trouble walking, dizziness, loss of balance or coordination</li>
                <li>Sudden severe headache with no known cause</li>
              </ul>
              <p className="font-bold text-red-600">
                If you or someone nearby shows these symptoms, seek medical help IMMEDIATELY. Prompt treatment can save
                lives and reduce disability.
              </p>
              <p>
                <strong>Remember the acronym FAST:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>F</strong>ace: Ask the person to smile. Does one side of the face droop?
                </li>
                <li>
                  <strong>A</strong>rms: Ask the person to raise both arms. Does one arm drift downward?
                </li>
                <li>
                  <strong>S</strong>peech: Ask the person to repeat a simple phrase. Is their speech slurred or strange?
                </li>
                <li>
                  <strong>T</strong>ime: If you observe any of these signs, call emergency services immediately.
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
