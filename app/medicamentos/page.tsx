"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SuccessAnimation } from "@/components/ui/success-animation"
import Link from "next/link"
import { ArrowLeft, Plus, Clock, Pill, Check, Trash2 } from "lucide-react"
import { useFeedback } from "@/components/feedback-provider"

interface Medicamento {
  id: string
  nome: string
  dosagem: string
  horarios: string[]
  tomados: Record<string, boolean>
}

export default function MedicamentosPage() {
  const feedback = useFeedback()
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [novoMedicamento, setNovoMedicamento] = useState<Omit<Medicamento, "id" | "tomados">>({
    nome: "",
    dosagem: "",
    horarios: [],
  })
  const [novoHorario, setNovoHorario] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hoje] = useState(new Date().toISOString().split("T")[0])
  const [salvando, setSalvando] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [formTouched, setFormTouched] = useState(false)

  useEffect(() => {
    // Carregar medicamentos do localStorage
    const medicamentosSalvos = localStorage.getItem("medicamentos")
    if (medicamentosSalvos) {
      setMedicamentos(JSON.parse(medicamentosSalvos))
    }

    // Configurar notificações se suportado pelo navegador
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission()
    }

    // Verificar medicamentos a cada minuto
    const interval = setInterval(verificarMedicamentos, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Salvar medicamentos no localStorage sempre que mudar
    if (medicamentos.length > 0) {
      localStorage.setItem("medicamentos", JSON.stringify(medicamentos))
    }
  }, [medicamentos])

  const verificarMedicamentos = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return

    const agora = new Date()
    const horaAtual =
      agora.getHours().toString().padStart(2, "0") + ":" + agora.getMinutes().toString().padStart(2, "0")

    medicamentos.forEach((med) => {
      med.horarios.forEach((horario) => {
        // Verificar se é hora de tomar medicamento (com margem de 1 minuto)
        if (horario === horaAtual) {
          const dataHoje = new Date().toISOString().split("T")[0]
          const chave = `${dataHoje}-${horario}`

          // Verificar se já foi tomado hoje neste horário
          if (!med.tomados || !med.tomados[chave]) {
            try {
              new Notification("Lembrete de Medicamento", {
                body: `Hora de tomar ${med.nome} - ${med.dosagem}`,
                icon: "/icons/icon-192x192.png",
                vibrate: [200, 100, 200],
                tag: `med-${med.id}`,
                renotify: true,
              })
              feedback.vibrate([200, 100, 200])
            } catch (error) {
              console.error("Erro ao mostrar notificação:", error)
            }
          }
        }
      })
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNovoMedicamento((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormTouched(true)
  }

  const handleAddHorario = () => {
    if (!novoHorario) {
      feedback.showWarning("Horário vazio", "Selecione um horário para adicionar.")
      return
    }

    if (!novoMedicamento.horarios.includes(novoHorario)) {
      setNovoMedicamento((prev) => ({
        ...prev,
        horarios: [...prev.horarios, novoHorario].sort(),
      }))
      feedback.vibrate(50)
    } else {
      feedback.showWarning("Horário duplicado", "Este horário já foi adicionado.")
    }

    setNovoHorario("")
  }

  const handleRemoveHorario = (horario: string) => {
    setNovoMedicamento((prev) => ({
      ...prev,
      horarios: prev.horarios.filter((h) => h !== horario),
    }))
    feedback.vibrate(50)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validação do formulário
    if (!novoMedicamento.nome) {
      feedback.showWarning("Nome obrigatório", "Digite o nome do medicamento.")
      return
    }

    if (!novoMedicamento.dosagem) {
      feedback.showWarning("Dosagem obrigatória", "Digite a dosagem do medicamento.")
      return
    }

    if (novoMedicamento.horarios.length === 0) {
      feedback.showWarning("Horários obrigatórios", "Adicione pelo menos um horário para o medicamento.")
      return
    }

    setSalvando(true)
    feedback.vibrate(50)

    try {
      const medicamentoComId: Medicamento = {
        ...novoMedicamento,
        id: Date.now().toString(),
        tomados: {},
      }

      setMedicamentos((prev) => [...prev, medicamentoComId])

      // Resetar formulário
      setNovoMedicamento({
        nome: "",
        dosagem: "",
        horarios: [],
      })

      setDialogOpen(false)
      setShowSuccessAnimation(true)
      feedback.vibrate(200)
      setFormTouched(false)
    } catch (error) {
      console.error("Erro ao adicionar medicamento:", error)
      feedback.showError("Erro ao adicionar", "Não foi possível adicionar o medicamento.")
    } finally {
      setSalvando(false)
    }
  }

  const handleToggleTomado = (medicamentoId: string, horario: string) => {
    const dataHoje = new Date().toISOString().split("T")[0]
    const chave = `${dataHoje}-${horario}`

    setMedicamentos((prev) =>
      prev.map((med) => {
        if (med.id === medicamentoId) {
          const novosTomados = { ...med.tomados }
          const novoValor = !novosTomados[chave]
          novosTomados[chave] = novoValor

          // Feedback tátil
          if (novoValor) {
            feedback.vibrate(100)
          }

          return {
            ...med,
            tomados: novosTomados,
          }
        }
        return med
      }),
    )
  }

  const handleDeleteMedicamento = (id: string) => {
    try {
      setMedicamentos((prev) => prev.filter((med) => med.id !== id))
      feedback.showSuccess("Medicamento removido", "O medicamento foi removido com sucesso.")
      feedback.vibrate([30, 30, 30])
    } catch (error) {
      feedback.showError("Erro ao remover", "Não foi possível remover o medicamento.")
    }
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <SuccessAnimation
        show={showSuccessAnimation}
        onComplete={() => setShowSuccessAnimation(false)}
        message="Medicamento adicionado!"
      />

      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Medicamentos</h1>
        <p className="text-muted-foreground">Gerencie seus medicamentos e lembretes</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-6 flex items-center justify-center gap-2 h-12 text-base">
            <Plus className="h-5 w-5" />
            Adicionar Medicamento
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Medicamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center">
                Nome do Medicamento <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="nome"
                name="nome"
                value={novoMedicamento.nome}
                onChange={handleChange}
                placeholder="Ex: Losartana"
                required
                className={`h-12 transition-all duration-200 ${
                  formTouched && !novoMedicamento.nome ? "border-red-500 ring-red-500/20" : ""
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosagem" className="flex items-center">
                Dosagem <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="dosagem"
                name="dosagem"
                value={novoMedicamento.dosagem}
                onChange={handleChange}
                placeholder="Ex: 50mg - 1 comprimido"
                required
                className={`h-12 transition-all duration-200 ${
                  formTouched && !novoMedicamento.dosagem ? "border-red-500 ring-red-500/20" : ""
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                Horários <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={novoHorario}
                  onChange={(e) => setNovoHorario(e.target.value)}
                  className="flex-1 h-12"
                />
                <Button type="button" onClick={handleAddHorario} className="h-12 active:scale-95 transition-transform">
                  Adicionar
                </Button>
              </div>

              {formTouched && novoMedicamento.horarios.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Adicione pelo menos um horário</p>
              )}

              {novoMedicamento.horarios.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {novoMedicamento.horarios.map((horario) => (
                    <div key={horario} className="flex items-center justify-between bg-muted p-3 rounded-md">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{horario}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHorario(horario)}
                        className="active:scale-95 transition-transform"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className={`w-full h-12 text-base relative overflow-hidden ${salvando ? "opacity-90" : ""}`}
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <div className="absolute inset-0 bg-sky-700 animate-pulse"></div>
                  <span className="relative flex items-center">
                    <Plus className="h-5 w-5 mr-2 animate-pulse" />
                    Salvando...
                  </span>
                </>
              ) : (
                <>Salvar Medicamento</>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {medicamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">Você ainda não adicionou nenhum medicamento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {medicamentos.map((medicamento) => (
            <Card key={medicamento.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <Pill className="mr-2 h-5 w-5 text-sky-600" />
                    {medicamento.nome}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMedicamento(medicamento.id)}
                    className="active:scale-95 transition-transform"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{medicamento.dosagem}</p>

                <div className="space-y-3">
                  {medicamento.horarios.map((horario) => {
                    const chave = `${hoje}-${horario}`
                    const tomado = medicamento.tomados?.[chave] || false

                    return (
                      <div key={horario} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{horario}</span>
                        </div>
                        <Button
                          type="button"
                          variant={tomado ? "default" : "outline"}
                          size="sm"
                          className={`min-h-[40px] transition-all duration-200 active:scale-95 ${tomado ? "bg-sky-600 hover:bg-sky-700" : ""}`}
                          onClick={() => handleToggleTomado(medicamento.id, horario)}
                        >
                          {tomado ? (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Tomado
                            </>
                          ) : (
                            "Marcar como tomado"
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
