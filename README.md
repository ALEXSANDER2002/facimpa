# Gerenciador de Saúde - PWA para Prevenção de AVC

Um Progressive Web App (PWA) para gerenciar informações de saúde, monitorar medições e medicamentos, focado na prevenção de AVC.

## Funcionalidades

- **100% Offline:** Todas as funcionalidades estão disponíveis sem conexão com a internet
- **Recursos Educativos:** Informações sobre hipertensão, diabetes e prevenção de AVC
- **Perfil de Saúde:** Gerenciamento de informações pessoais e hábitos de saúde
- **Medições:** Registro e acompanhamento de pressão arterial e glicemia
- **Medicamentos:** Gerenciamento de medicamentos com lembretes

## Tecnologias Utilizadas

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Service Workers para funcionalidade offline
- IndexedDB para armazenamento local
- Shadcn UI para componentes

## Instalação

```bash
# Instalar dependências
npm install
# ou
pnpm install

# Iniciar servidor de desenvolvimento
npm run dev
# ou
pnpm dev

# Construir para produção
npm run build
# ou
pnpm build
```

## Estrutura do Projeto

- `/app` - Páginas e rotas da aplicação
- `/components` - Componentes reutilizáveis
- `/hooks` - Custom hooks React
- `/lib` - Utilidades e funções auxiliares
- `/public` - Arquivos estáticos (ícones, imagens)
- `/styles` - Estilos globais

## Deploy

Este aplicativo está otimizado para funcionar como um PWA que pode ser instalado em dispositivos móveis e desktops. O service worker gerencia o cache e permite que o aplicativo funcione sem conexão.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

MIT 