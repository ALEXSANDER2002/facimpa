import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function EducacaoPage() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-md">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">Recursos Educativos</h1>
        <p className="text-muted-foreground">Informações importantes sobre sua saúde</p>
      </div>

      <Tabs defaultValue="hipertensao" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hipertensao">Hipertensão</TabsTrigger>
          <TabsTrigger value="diabetes">Diabetes</TabsTrigger>
          <TabsTrigger value="avc">AVC</TabsTrigger>
        </TabsList>
        <TabsContent value="hipertensao">
          <Card>
            <CardHeader>
              <CardTitle>Entendendo a Hipertensão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A hipertensão, ou pressão alta, ocorre quando a força do sangue contra as paredes das artérias é
                consistentemente muito alta.
              </p>
              <p>
                <strong>O que é considerado pressão alta?</strong>
                <br />
                Leituras de pressão arterial acima de 140/90 mmHg são geralmente consideradas elevadas.
              </p>
              <p>
                <strong>Por que controlar a pressão arterial é importante:</strong>
                <br />A pressão alta não controlada pode danificar seus vasos sanguíneos e aumentar o risco de AVC,
                ataque cardíaco, problemas renais e outros problemas de saúde.
              </p>
              <p>
                <strong>Como controlar a hipertensão:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tome seus medicamentos conforme prescrito</li>
                <li>Reduza o sódio (sal) em sua dieta</li>
                <li>Exercite-se regularmente</li>
                <li>Mantenha um peso saudável</li>
                <li>Limite o consumo de álcool</li>
                <li>Não fume</li>
                <li>Controle o estresse</li>
                <li>Monitore sua pressão arterial regularmente</li>
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
              <p>O diabetes é uma condição crônica que afeta como seu corpo processa o açúcar no sangue (glicose).</p>
              <p>
                <strong>O que é considerado diabetes?</strong>
                <br />
                Glicemia de jejum acima de 126 mg/dL ou hemoglobina glicada (A1C) acima de 6,5%.
              </p>
              <p>
                <strong>Por que controlar o diabetes é importante:</strong>
                <br />O diabetes não controlado pode danificar vasos sanguíneos, nervos e órgãos. Aumenta
                significativamente o risco de AVC, problemas cardíacos, doença renal, problemas oculares e complicações
                nos pés.
              </p>
              <p>
                <strong>Como controlar o diabetes:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tome seus medicamentos conforme prescrito</li>
                <li>Monitore sua glicemia regularmente</li>
                <li>Siga uma dieta equilibrada</li>
                <li>Reduza o consumo de açúcares refinados e carboidratos</li>
                <li>Exercite-se regularmente</li>
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
                Um AVC (Acidente Vascular Cerebral) ocorre quando o fluxo sanguíneo para uma parte do cérebro é
                interrompido, causando a morte de células cerebrais por falta de oxigênio.
              </p>
              <p>
                <strong>Por que a hipertensão e o diabetes aumentam o risco de AVC:</strong>
                <br />
                Ambas as condições danificam os vasos sanguíneos ao longo do tempo. A hipertensão pode enfraquecer os
                vasos no cérebro, enquanto o diabetes pode acelerar a formação de placas nas artérias.
              </p>
              <p>
                <strong>Sinais de alerta de um AVC:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fraqueza ou dormência súbita no rosto, braço ou perna, especialmente de um lado do corpo</li>
                <li>Confusão súbita, dificuldade para falar ou entender</li>
                <li>Dificuldade súbita para enxergar com um ou ambos os olhos</li>
                <li>Dificuldade súbita para andar, tontura, perda de equilíbrio ou coordenação</li>
                <li>Dor de cabeça súbita e intensa sem causa conhecida</li>
              </ul>
              <p className="font-bold text-red-600">
                Se você ou alguém próximo apresentar esses sintomas, procure ajuda médica IMEDIATAMENTE. O tratamento
                rápido pode salvar vidas e reduzir sequelas.
              </p>
              <p>
                <strong>Lembre-se do acrônimo SAMU:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>S</strong>orriso: Peça para a pessoa sorrir. Um lado do rosto cai?
                </li>
                <li>
                  <strong>A</strong>braço: Peça para a pessoa levantar os dois braços. Um braço cai?
                </li>
                <li>
                  <strong>M</strong>ensagem: Peça para a pessoa repetir uma frase simples. A fala está arrastada ou
                  estranha?
                </li>
                <li>
                  <strong>U</strong>rgente: Se observar qualquer um desses sinais, ligue para o SAMU (192)
                  imediatamente.
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
