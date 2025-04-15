import { NextResponse } from "next/server"

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Gerenciador de Saúde</title>
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
        }
        p {
          margin-bottom: 20px;
          line-height: 1.5;
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
        }
        button:hover {
          background-color: #0369a1;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📶</div>
        <h1>Você está offline</h1>
        <p>Não foi possível conectar à internet. O Gerenciador de Saúde funciona offline, mas esta página específica não foi armazenada em cache.</p>
        <button onclick="window.location.href='/'">Voltar para a página inicial</button>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}
