"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SuccessAnimation } from "@/components/ui/success-animation"
import Link from "next/link"
import { ArrowLeft, Plus, Activity, Droplet, Trash2 } from "lucide-react"
import { useFeedback } from "@/components/feedback-provider"

interface Medicao {
  id: string
  tipo: "pressaoArterial" | "glicemia"
  valor1: string // sistólica ou glicemia
  valor2?: string // diastólica (apenas para pressão arterial)
  periodo: "manha" | "tarde" | "noite"
  data: string
  hora: string
}

export default function MedicoesPage() {
  const feedback = useFeedback()
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [novaMedicao, setNovaMedicao] = useState<Omit<Medicao, "id">>({
    tipo: "pressaoArterial",
    valor1: "",
    valor2: "",
    periodo: "manha",
    data: new Date().toISOString().split("T")[0],
    hora: new Date().toTimeString().split(" ")[0].substring(0, 5),
  })
  const [salvando, setSalvando] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [formTouched, setFormTouched] = useState(false)

  useEffect(() => {
    // Carregar medições do localStorage
    const medicoesGravadas = localStorage.getItem("medicoes")
    if (medicoesGravadas) {
      setMedicoes(JSON.parse(medicoesGravadas))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNovaMedicao((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormTouched(true)
  }

  const handleSelectChange = (name: string, value: string) => {
    setNovaMedicao((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormTouched(true)
  }

  const handleTabChange = (value: string) => {
    setNovaMedicao((prev) => ({
      ...prev,
      tipo: value as "pressaoArterial" | "glicemia",
      valor1: "",
      valor2: value === "pressaoArterial" ? "" : undefined,
    }))
    setFormTouched(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validação do formulário
    if (novaMedicao.tipo === "pressaoArterial" && (!novaMedicao.valor1 || !novaMedicao.valor2)) {
      feedback.showWarning("Campos incompletos", "Preencha os valores de sistólica e diastólica.")
      feedback.vibrate([50, 50, 50])
      return
    }

    if (novaMedicao.tipo === "glicemia" && !novaMedicao.valor1) {
      feedback.showWarning("Campo incompleto", "Preencha o valor da glicemia.")
      feedback.vibrate([50, 50, 50])
      return
    }

    setSalvando(true)
    feedback.vibrate(50) // Feedback tátil sutil ao iniciar o salvamento

    try {
      const medicaoComId: Medicao = {
        ...(novaMedicao as any),
        id: Date.now().toString(),
      }

      const medicoesAtualizadas = [...medicoes, medicaoComId]
      setMedicoes(medicoesAtualizadas)

      // Salvar no localStorage
      localStorage.setItem("medicoes", JSON.stringify(medicoesAtualizadas))

      // Resetar formulário
      setNovaMedicao({
        tipo: novaMedicao.tipo,
        valor1: "",
        valor2: novaMedicao.tipo === "pressaoArterial" ? "" : undefined,
        periodo: novaMedicao.periodo,
        data: novaMedicao.data,
        hora: new Date().toTimeString().split(" ")[0].substring(0, 5),
      })

      // Mostrar animação de sucesso
      setShowSuccessAnimation(true)

      // Feedback tátil de sucesso
      feedback.vibrate(200)
      setFormTouched(false)
    } catch (error) {
      console.error("Erro ao salvar medição:", error)
      feedback.showError("Erro ao salvar", "Ocorreu um erro ao salvar sua medição.")
      feedback.vibrate([100, 50, 100])
    } finally {
      setSalvando(false)
    }
  }

  const handleDeleteMedicao = (id: string) => {
    try {
      const medicoesAtualizadas = medicoes.filter((medicao) => medicao.id !== id)
      setMedicoes(medicoesAtualizadas)
      localStorage.setItem("medicoes", JSON.stringify(medicoesAtualizadas))

      feedback.showSuccess("Medição excluída", "A medição foi removida com sucesso.")
      feedback.vibrate([30, 30, 30])
    } catch (error) {
      feedback.showError("Erro ao excluir", "Não foi possível excluir a medição.")
    }
  }

  // Filtrar medições por tipo e ordenar por data (mais recente primeiro)
  const medicoesPressao = medicoes
    .filter((m) => m.tipo === "pressaoArterial")
    .sort((a, b) => new Date(b.data + "T" + b.hora).getTime() - new Date(a.data + "T" + a.hora).getTime())

  const medicoesGlicemia = medicoes
    .filter((m) => m.tipo === "glicemia")
    .sort((a, b) => new Date(b.data + "T" + b.hora).getTime() - new Date(a.data + "T" + a.hora).getTime())

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <SuccessAnimation
        show={showSuccessAnimation}
        onComplete={() => setShowSuccessAnimation(false)}
        message="Medição registrada!"
      />

      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Medições de Saúde</h1>
        <p className="text-muted-foreground">Registre e acompanhe suas medições</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Medição</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs value={novaMedicao.tipo} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pressaoArterial" className="flex items-center gap-1 h-12">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Pressão Arterial</span>
                </TabsTrigger>
                <TabsTrigger value="glicemia" className="flex items-center gap-1 h-12">
                  <Droplet className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Glicemia</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pressaoArterial" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor1" className="flex items-center">
                      Sistólica (mmHg) <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="valor1"
                      name="valor1"
                      type="number"
                      inputMode="numeric"
                      value={novaMedicao.valor1}
                      onChange={handleChange}
                      placeholder="Ex: 120"
                      required
                      className={`h-12 text-lg transition-all duration-200 ${
                        formTouched && !novaMedicao.valor1 ? "border-red-500 ring-red-500/20" : ""
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor2" className="flex items-center">
                      Diastólica (mmHg) <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="valor2"
                      name="valor2"
                      type="number"
                      inputMode="numeric"
                      value={novaMedicao.valor2}
                      onChange={handleChange}
                      placeholder="Ex: 80"
                      required
                      className={`h-12 text-lg transition-all duration-200 ${
                        formTouched && !novaMedicao.valor2 ? "border-red-500 ring-red-500/20" : ""
                      }`}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="glicemia" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="valor1" className="flex items-center">
                    Glicemia (mg/dL) <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="valor1"
                    name="valor1"
                    type="number"
                    inputMode="numeric"
                    value={novaMedicao.valor1}
                    onChange={handleChange}
                    placeholder="Ex: 100"
                    required
                    className={`h-12 text-lg transition-all duration-200 ${
                      formTouched && !novaMedicao.valor1 ? "border-red-500 ring-red-500/20" : ""
                    }`}
                  />
                </div>
              </TabsContent>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    name="data"
                    type="date"
                    value={novaMedicao.data}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input
                    id="hora"
                    name="hora"
                    type="time"
                    value={novaMedicao.hora}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="periodo">Período</Label>
                <Select value={novaMedicao.periodo} onValueChange={(value) => handleSelectChange("periodo", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className={`w-full mt-6 flex items-center justify-center gap-2 h-12 text-base relative overflow-hidden ${
                  salvando ? "opacity-90" : ""
                }`}
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <div className="absolute inset-0 bg-sky-700 animate-pulse"></div>
                    <span className="relative flex items-center">
                      <Plus className="h-5 w-5 mr-2 animate-pulse" />
                      Registrando...
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Registrar Medição
                  </>
                )}
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
              Histórico de Pressão Arterial
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicoesPressao.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma medição de pressão arterial registrada</p>
            ) : (
              <div className="space-y-3">
                {medicoesPressao.slice(0, 5).map((medicao) => (
                  <div key={medicao.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-base">
                        {medicao.valor1}/{medicao.valor2} mmHg
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(medicao.data).toLocaleDateString()} - {medicao.hora} -{" "}
                        {medicao.periodo === "manha" ? "Manhã" : medicao.periodo === "tarde" ? "Tarde" : "Noite"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          Number.parseInt(medicao.valor1) > 140 || Number.parseInt(medicao.valor2 || "0") > 90
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {Number.parseInt(medicao.valor1) > 140 || Number.parseInt(medicao.valor2 || "0") > 90
                          ? "Elevada"
                          : "Normal"}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 active:scale-95 transition-transform"
                        onClick={() => handleDeleteMedicao(medicao.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
              Histórico de Glicemia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicoesGlicemia.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma medição de glicemia registrada</p>
            ) : (
              <div className="space-y-3">
                {medicoesGlicemia.slice(0, 5).map((medicao) => (
                  <div key={medicao.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-base">{medicao.valor1} mg/dL</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(medicao.data).toLocaleDateString()} - {medicao.hora} -{" "}
                        {medicao.periodo === "manha" ? "Manhã" : medicao.periodo === "tarde" ? "Tarde" : "Noite"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          Number.parseInt(medicao.valor1) > 180
                            ? "bg-red-100 text-red-800"
                            : Number.parseInt(medicao.valor1) < 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {Number.parseInt(medicao.valor1) > 180
                          ? "Elevada"
                          : Number.parseInt(medicao.valor1) < 70
                            ? "Baixa"
                            : "Normal"}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 active:scale-95 transition-transform"
                        onClick={() => handleDeleteMedicao(medicao.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
