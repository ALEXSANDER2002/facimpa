"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { SuccessAnimation } from "@/components/ui/success-animation"
import Link from "next/link"
import { ArrowLeft, Save, Download, Upload, WifiOff, CheckCircle2 } from "lucide-react"
import { useFeedback } from "@/components/feedback-provider"

interface DadosPerfil {
  nome: string
  idade: string
  fuma: boolean
  bebe: boolean
  temHipertensao: boolean
  hipertensaoControlada: string
  temDiabetes: boolean
  diabetesControlado: string
  ultimaAtualizacao?: string
}

export default function PerfilPage() {
  const feedback = useFeedback()
  const [perfil, setPerfil] = useState<DadosPerfil>({
    nome: "",
    idade: "",
    fuma: false,
    bebe: false,
    temHipertensao: false,
    hipertensaoControlada: "sim",
    temDiabetes: false,
    diabetesControlado: "sim",
  })
  const [isOnline, setIsOnline] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [formTouched, setFormTouched] = useState(false)
  const [formValid, setFormValid] = useState(false)

  // Verifica o status da conexão
  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Valida o formulário
  useEffect(() => {
    const isValid = !!perfil.nome && !!perfil.idade
    setFormValid(isValid)
  }, [perfil])

  // Carrega dados do perfil do IndexedDB ou localStorage
  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        // Tenta carregar do IndexedDB primeiro
        if ("indexedDB" in window) {
          const db = await openDatabase()
          const perfilSalvo = await getPerfilFromDB(db)

          if (perfilSalvo) {
            setPerfil(perfilSalvo)
            return
          }
        }

        // Fallback para localStorage
        const perfilSalvo = localStorage.getItem("perfil")
        if (perfilSalvo) {
          const dadosPerfil = JSON.parse(perfilSalvo)
          setPerfil(dadosPerfil)

          // Migra para IndexedDB se disponível
          if ("indexedDB" in window) {
            const db = await openDatabase()
            await savePerfilToDB(db, dadosPerfil)
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
        // Tenta recuperar do localStorage como fallback final
        const perfilSalvo = localStorage.getItem("perfil")
        if (perfilSalvo) {
          setPerfil(JSON.parse(perfilSalvo))
        }
      }
    }

    carregarPerfil()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setPerfil((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    setFormTouched(true)
  }

  const handleRadioChange = (name: string, value: string) => {
    setPerfil((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormTouched(true)
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setPerfil((prev) => ({
      ...prev,
      [name]: checked,
    }))
    setFormTouched(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formValid) {
      feedback.showWarning("Formulário incompleto", "Por favor, preencha todos os campos obrigatórios.")
      feedback.vibrate([50, 50, 50])
      return
    }

    setSalvando(true)
    feedback.vibrate(50) // Feedback tátil sutil ao iniciar o salvamento

    try {
      // Adiciona timestamp da última atualização
      const perfilAtualizado = {
        ...perfil,
        ultimaAtualizacao: new Date().toISOString(),
      }

      // Salva no IndexedDB se disponível
      if ("indexedDB" in window) {
        const db = await openDatabase()
        await savePerfilToDB(db, perfilAtualizado)
      }

      // Sempre salva no localStorage como backup
      localStorage.setItem("perfil", JSON.stringify(perfilAtualizado))

      // Atualiza o estado
      setPerfil(perfilAtualizado)

      // Mostra animação de sucesso
      setShowSuccessAnimation(true)

      // Feedback tátil de sucesso
      feedback.vibrate(200)

      // Registra para sincronização quando online
      if (!isOnline && "serviceWorker" in navigator && "SyncManager" in window) {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("sync-perfil")
      }

      setFormTouched(false)
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      feedback.showError("Erro ao salvar", "Ocorreu um erro, mas seus dados foram salvos localmente.")
      feedback.vibrate([100, 50, 100])
    } finally {
      setSalvando(false)
    }
  }

  const exportarPerfil = () => {
    try {
      const dataStr = JSON.stringify(perfil, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `meu-perfil-saude-${new Date().toISOString().split("T")[0]}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      feedback.showSuccess("Dados exportados", "Seus dados foram exportados com sucesso.")
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      feedback.showError("Erro na exportação", "Não foi possível exportar seus dados.")
    }
  }

  const importarPerfil = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const conteudo = event.target?.result as string
        const dadosImportados = JSON.parse(conteudo) as DadosPerfil

        // Valida os dados importados
        if (!dadosImportados.nome) {
          throw new Error("Arquivo inválido")
        }

        // Atualiza o estado
        setPerfil(dadosImportados)

        // Salva no IndexedDB
        if ("indexedDB" in window) {
          const db = await openDatabase()
          await savePerfilToDB(db, dadosImportados)
        }

        // Salva no localStorage
        localStorage.setItem("perfil", JSON.stringify(dadosImportados))

        // Mostra animação de sucesso
        setShowSuccessAnimation(true)

        feedback.showSuccess("Dados importados", "Seus dados foram importados com sucesso.")
      } catch (error) {
        console.error("Erro ao importar dados:", error)
        feedback.showError("Erro na importação", "O arquivo selecionado não é válido.")
      }
    }
    reader.readAsText(file)

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ""
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <SuccessAnimation
        show={showSuccessAnimation}
        onComplete={() => setShowSuccessAnimation(false)}
        message="Salvo com sucesso!"
      />

      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>

        {!isOnline && (
          <div className="mt-2 flex items-center text-amber-600 text-sm bg-amber-50 p-2 rounded-md">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>Você está offline. Seus dados serão salvos localmente.</span>
          </div>
        )}

        {perfil.ultimaAtualizacao && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            Última atualização: {new Date(perfil.ultimaAtualizacao).toLocaleString()}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center">
                Nome <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="nome"
                name="nome"
                value={perfil.nome}
                onChange={handleChange}
                placeholder="Digite seu nome completo"
                required
                className={`h-12 transition-all duration-200 ${
                  formTouched && !perfil.nome ? "border-red-500 ring-red-500/20" : ""
                }`}
              />
              {formTouched && !perfil.nome && <p className="text-red-500 text-xs mt-1">Nome é obrigatório</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="idade" className="flex items-center">
                Idade <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="idade"
                name="idade"
                type="number"
                inputMode="numeric"
                value={perfil.idade}
                onChange={handleChange}
                placeholder="Digite sua idade"
                required
                min="1"
                max="120"
                className={`h-12 transition-all duration-200 ${
                  formTouched && !perfil.idade ? "border-red-500 ring-red-500/20" : ""
                }`}
              />
              {formTouched && !perfil.idade && <p className="text-red-500 text-xs mt-1">Idade é obrigatória</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Hábitos de Saúde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="fuma" className="cursor-pointer">
                Você fuma?
              </Label>
              <Switch
                id="fuma"
                name="fuma"
                checked={perfil.fuma}
                onCheckedChange={(checked) => handleSwitchChange("fuma", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="bebe" className="cursor-pointer">
                Você consome bebidas alcoólicas?
              </Label>
              <Switch
                id="bebe"
                name="bebe"
                checked={perfil.bebe}
                onCheckedChange={(checked) => handleSwitchChange("bebe", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="temHipertensao" className="cursor-pointer">
                Você tem pressão alta (hipertensão)?
              </Label>
              <Switch
                id="temHipertensao"
                name="temHipertensao"
                checked={perfil.temHipertensao}
                onCheckedChange={(checked) => handleSwitchChange("temHipertensao", checked)}
              />
            </div>

            {perfil.temHipertensao && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label>Sua pressão arterial está controlada?</Label>
                <RadioGroup
                  value={perfil.hipertensaoControlada}
                  onValueChange={(value) => handleRadioChange("hipertensaoControlada", value)}
                >
                  <div className="flex items-center space-x-2 h-10">
                    <RadioGroupItem value="sim" id="hipertensao-sim" />
                    <Label htmlFor="hipertensao-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2 h-10">
                    <RadioGroupItem value="nao" id="hipertensao-nao" />
                    <Label htmlFor="hipertensao-nao">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2 h-10">
                    <RadioGroupItem value="nao-sei" id="hipertensao-nao-sei" />
                    <Label htmlFor="hipertensao-nao-sei">Não sei</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="temDiabetes" className="cursor-pointer">
                Você tem diabetes?
              </Label>
              <Switch
                id="temDiabetes"
                name="temDiabetes"
                checked={perfil.temDiabetes}
                onCheckedChange={(checked) => handleSwitchChange("temDiabetes", checked)}
              />
            </div>

            {perfil.temDiabetes && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label>Sua glicemia está controlada?</Label>
                <RadioGroup
                  value={perfil.diabetesControlado}
                  onValueChange={(value) => handleRadioChange("diabetesControlado", value)}
                >
                  <div className="flex items-center space-x-2 h-10">
                    <RadioGroupItem value="sim" id="diabetes-sim" />
                    <Label htmlFor="diabetes-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2 h-10">
                    <RadioGroupItem value="nao" id="diabetes-nao" />
                    <Label htmlFor="diabetes-nao">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2 h-10">
                    <RadioGroupItem value="nao-sei" id="diabetes-nao-sei" />
                    <Label htmlFor="diabetes-nao-sei">Não sei</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>

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
                <Save className="h-5 w-5 mr-2 animate-pulse" />
                Salvando...
              </span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salvar Perfil
            </>
          )}
        </Button>

        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 h-12 active:scale-95 transition-transform"
            onClick={exportarPerfil}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 h-12 active:scale-95 transition-transform"
            onClick={() => document.getElementById("importar-arquivo")?.click()}
          >
            <Upload className="h-4 w-4" />
            Importar
            <input id="importar-arquivo" type="file" accept=".json" className="hidden" onChange={importarPerfil} />
          </Button>
        </div>
      </form>
    </main>
  )
}

// Funções auxiliares para IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("HealthManagerDB", 1)

    request.onerror = () => reject(new Error("Falha ao abrir o banco de dados"))

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains("perfil")) {
        db.createObjectStore("perfil", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }
  })
}

function getPerfilFromDB(db: IDBDatabase): Promise<DadosPerfil | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("perfil", "readonly")
    const store = transaction.objectStore("perfil")
    const request = store.get("user-profile")

    request.onerror = () => reject(new Error("Falha ao buscar perfil"))

    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.data : null)
    }
  })
}

function savePerfilToDB(db: IDBDatabase, perfil: DadosPerfil): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("perfil", "readwrite")
    const store = transaction.objectStore("perfil")
    const request = store.put({ id: "user-profile", data: perfil })

    request.onerror = () => reject(new Error("Falha ao salvar perfil"))
    request.onsuccess = () => resolve()
  })
}
