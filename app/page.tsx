import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, Activity, User, Pill, Heart } from "lucide-react"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <div className="flex flex-col items-center mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-transparent rounded-3xl -z-10"></div>
        <div className="w-20 h-20 rounded-full bg-sky-50 flex items-center justify-center mb-3 shadow-sm">
          <Heart className="h-12 w-12 text-sky-600 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">
          Gerenciador de Saúde
        </h1>
        <p className="text-center text-muted-foreground mt-2 max-w-xs">
          Gerencie sua saúde para prevenir AVC e outras complicações
        </p>
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
          Aplicativo 100% offline
        </div>
      </div>

      <div className="grid gap-4">
        <Link href="/educacao" className="w-full">
          <Card className="hover:bg-muted/50 transition-colors active:bg-muted/70 touch-manipulation">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <BookOpen className="mr-3 h-6 w-6 text-sky-600 flex-shrink-0" />
                Recursos Educativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm sm:text-base">
                Aprenda sobre hipertensão, diabetes e prevenção de AVC
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/perfil" className="w-full">
          <Card className="hover:bg-muted/50 transition-colors active:bg-muted/70 touch-manipulation">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <User className="mr-3 h-6 w-6 text-sky-600 flex-shrink-0" />
                Meu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm sm:text-base">
                Gerencie suas informações pessoais e hábitos de saúde
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/medicoes" className="w-full">
          <Card className="hover:bg-muted/50 transition-colors active:bg-muted/70 touch-manipulation">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Activity className="mr-3 h-6 w-6 text-sky-600 flex-shrink-0" />
                Medições de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm sm:text-base">
                Registre suas medições de pressão arterial e glicemia
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/medicamentos" className="w-full">
          <Card className="hover:bg-muted/50 transition-colors active:bg-muted/70 touch-manipulation">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Pill className="mr-3 h-6 w-6 text-sky-600 flex-shrink-0" />
                Medicamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm sm:text-base">
                Gerencie seus medicamentos e configure lembretes
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Aplicativo de gerenciamento de saúde 100% offline</p>
        <p>Versão 2.0</p>
      </div>
    </main>
  )
}
