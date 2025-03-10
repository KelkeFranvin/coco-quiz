import { NextResponse } from "next/server"
import { addAnswer, getAnswers, getResetAnswers, markUserSubmitted, hasUserSubmitted } from "@/lib/answers-store"

export async function POST(request: Request) {
  try {
    const { answer, username } = await request.json()

    if (!answer || typeof answer !== "string") {
      return NextResponse.json({ error: "Antwort ist erforderlich" }, { status: 400 })
    }

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Benutzername ist erforderlich" }, { status: 400 })
    }

    // Prüfen, ob der Benutzer bereits geantwortet hat
    if (hasUserSubmitted(username)) {
      return NextResponse.json({ error: "Du hast bereits eine Antwort abgegeben" }, { status: 403 })
    }

    // Neue Antwort erstellen und speichern
    const newAnswer = addAnswer(answer, username)

    // Benutzer als "hat geantwortet" markieren
    markUserSubmitted(username)

    return NextResponse.json({ success: true, answer: newAnswer })
  } catch (error) {
    console.error("Fehler beim Speichern der Antwort:", error)
    return NextResponse.json({ error: "Fehler beim Speichern der Antwort" }, { status: 500 })
  }
}

export async function GET() {
  // Alle Antworten zurückgeben
  const answers = getAnswers()
  const resetAnswers = getResetAnswers()
  return NextResponse.json({ answers, resetAnswers })
}

