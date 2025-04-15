import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ler o arquivo de service worker da pasta public
    const swContent = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8")
    
    return new NextResponse(swContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Service-Worker-Allowed": "/"
      }
    })
  } catch (error) {
    console.error("Erro ao ler o service worker:", error)
    
    // Fornecer um service worker mínimo como fallback
    const fallbackSW = `
      // Fallback service worker
      self.addEventListener('install', (event) => {
        self.skipWaiting();
      });
      
      self.addEventListener('activate', (event) => {
        self.clients.claim();
      });
    `
    
    return new NextResponse(fallbackSW, {
      headers: {
        "Content-Type": "application/javascript",
        "Service-Worker-Allowed": "/"
      }
    })
  }
}
