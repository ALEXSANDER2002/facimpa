import { NextResponse } from "next/server"

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Modo Offline - Gerenciador de Saúde</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f5f5f5;
          color: #333;
          text-align: center;
          padding: 0 20px;
        }
        .container {
          max-width: 500px;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #0284c7;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }
        p {
          margin-bottom: 20px;
          line-height: 1.5;
          font-size: 0.95rem;
        }
        button {
          background-color: #0284c7;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
          margin: 5px;
        }
        button:hover {
          background-color: #0369a1;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 15px;
          display: flex;
          justify-content: center;
        }
        .nav-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }
        .nav-button {
          background-color: #f0f9ff;
          color: #0284c7;
          border: 1px solid #0284c7;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-button:hover {
          background-color: #e0f2fe;
        }
        .status-indicator {
          display: inline-block;
          width: 10px;
          height: 10px;
          background-color: #f59e0b;
          border-radius: 50%;
          margin-right: 8px;
        }
        .note {
          font-size: 0.8rem;
          margin-top: 20px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📶</div>
        <h1>Você está no Modo Offline</h1>
        <p>
          <span class="status-indicator"></span>
          Esta página ainda não foi armazenada para uso offline.
        </p>
        <p>O Gerenciador de Saúde funciona 100% offline, mas é necessário acessar as páginas pelo menos uma vez enquanto estiver online.</p>
        
        <div>
          <button onclick="window.location.href='/'">Voltar para a Página Inicial</button>
        </div>
        
        <div class="nav-buttons">
          <button class="nav-button" onclick="window.location.href='/perfil'">Meu Perfil</button>
          <button class="nav-button" onclick="window.location.href='/medicoes'">Medições</button>
          <button class="nav-button" onclick="window.location.href='/medicamentos'">Medicamentos</button>
          <button class="nav-button" onclick="window.location.href='/educacao'">Recursos Educativos</button>
        </div>
        
        <p class="note">
          Dica: Para garantir funcionamento completo offline, acesse o botão "Ativar modo 100% offline" na tela inicial quando estiver com internet.
        </p>
      </div>
      
      <script>
        // Verifica a cada 5 segundos se a conexão foi restaurada
        setInterval(() => {
          if (navigator.onLine) {
            // Se estiver online, recarrega a página atual
            window.location.reload();
          }
        }, 5000);
        
        // Adiciona listener para evento online
        window.addEventListener('online', () => {
          window.location.reload();
        });
      </script>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, max-age=31536000, immutable"
    },
  })
}
