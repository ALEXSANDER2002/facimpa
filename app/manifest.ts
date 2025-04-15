import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gerenciador de Saúde - Prevenção de AVC",
    short_name: "Gerenciador de Saúde",
    description: "Gerencie sua pressão arterial e diabetes para prevenir AVC",
    start_url: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0284c7",
    categories: ["health", "medical", "lifestyle"],
    screenshots: [
      {
        src: "/screenshots/home-screen.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/screenshots/measurements-screen.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Registrar Medição",
        url: "/medicoes",
        icons: [{ src: "/icons/medicoes-icon.png", sizes: "96x96" }],
      },
      {
        name: "Medicamentos",
        url: "/medicamentos",
        icons: [{ src: "/icons/medicamentos-icon.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
