import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function EducativoPage() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Textos Educativos</h1>
        <p className="text-muted-foreground">Informações importantes sobre sua saúde</p>
      </div>

      <Tabs defaultValue="pressao" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pressao">Pressão Alta</TabsTrigger>
          <TabsTrigger value="diabetes">Diabetes</TabsTrigger>
          <TabsTrigger value="avc">AVC</TabsTrigger>
        </TabsList>
        <TabsContent value="pressao">
          <Card>
            <CardHeader>
              <CardTitle>Entendendo a Pressão Alta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A pressão alta (hipertensão) é quando a força do sangue contra as paredes das artérias é
                consistentemente muito alta.
              </p>
              <p>
                <strong>O que é considerado pressão alta?</strong>
                <br />
                Valores acima de 140/90 mmHg são considerados elevados.
              </p>
              <p>
                <strong>Por que controlar a pressão é importante?</strong>
                <br />A pressão alta não controlada pode danificar seus vasos sanguíneos e aumentar o risco de AVC,
                ataque cardíaco, problemas renais e outros problemas de saúde.
              </p>
              <p>
                <strong>Como controlar:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tome seus medicamentos conforme receitado</li>
                <li>Reduza o sal na alimentação</li>
                <li>Pratique atividade física regularmente</li>
                <li>Mantenha um peso saudável</li>
                <li>Limite o consumo de álcool</li>
                <li>Não fume</li>
                <li>Controle o estresse</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="diabetes">
          <Card>
            <CardHeader>
              <CardTitle>Entendendo o Diabetes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>O diabetes é uma condição crônica que afeta como seu corpo processa a glicose (açúcar) no sangue.</p>
              <p>
                <strong>O que é considerado diabetes?</strong>
                <br />
                Glicemia de jejum acima de 126 mg/dL ou hemoglobina glicada (HbA1c) acima de 6,5%.
              </p>
              <p>
                <strong>Por que controlar o diabetes é importante?</strong>
                <br />O diabetes não controlado pode danificar vasos sanguíneos, nervos e órgãos. Aumenta
                significativamente o risco de AVC, problemas cardíacos, renais, nos olhos e nos pés.
              </p>
              <p>
                <strong>Como controlar:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tome seus medicamentos conforme receitado</li>
                <li>Monitore sua glicemia regularmente</li>
                <li>Siga uma alimentação equilibrada</li>
                <li>Reduza o consumo de açúcares e carboidratos refinados</li>
                <li>Pratique atividade física regularmente</li>
                <li>Mantenha um peso saudável</li>
                <li>Faça consultas médicas regulares</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="avc">
          <Card>
            <CardHeader>
              <CardTitle>Prevenindo o AVC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O AVC (Acidente Vascular Cerebral) ou derrame ocorre quando o fluxo sanguíneo para uma parte do cérebro
                é interrompido, causando a morte de células cerebrais.
              </p>
              <p>
                <strong>Por que a pressão alta e o diabetes aumentam o risco de AVC?</strong>
                <br />
                Ambas as condições danificam os vasos sanguíneos ao longo do tempo. A pressão alta pode enfraquecer os
                vasos no cérebro, enquanto o diabetes pode acelerar a formação de placas nas artérias.
              </p>
              <p>
                <strong>Sinais de alerta de um AVC:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fraqueza súbita ou dormência no rosto, braço ou perna, especialmente de um lado do corpo</li>
                <li>Confusão súbita ou dificuldade para falar ou entender</li>
                <li>Dificuldade súbita para enxergar com um ou ambos os olhos</li>
                <li>Dificuldade súbita para andar, tontura ou perda de equilíbrio</li>
                <li>Dor de cabeça súbita e intensa sem causa conhecida</li>
              </ul>
              <p className="font-bold text-red-600">
                Se você ou alguém próximo apresentar esses sintomas, procure ajuda médica IMEDIATAMENTE. O tratamento
                rápido pode salvar vidas e reduzir sequelas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
