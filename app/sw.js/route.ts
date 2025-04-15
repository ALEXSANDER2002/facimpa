import { NextResponse } from "next/server"
import sw from "../sw"

export async function GET() {
  return new NextResponse(sw(), {
    headers: {
      "Content-Type": "application/javascript",
    },
  })
}
