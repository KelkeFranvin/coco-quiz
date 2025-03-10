import { NextResponse } from "next/server"
import { resetUserSubmission, resetAllUserSubmissions, hasUserSubmitted } from "@/lib/answers-store"

export async function POST(request: Request) {
  try {
    const { username, resetAll } = await request.json()

    if (resetAll) {
      // Alle Benutzer zurücksetzen
      resetAllUserSubmissions()
      return NextResponse.json({ success: true, message: "Alle Benutzer wurden zurückgesetzt" })
    }

    if (!username) {
      return NextResponse.json({ error: "Benutzername ist erforderlich" }, { status: 400 })
    }

    // Prüfe, ob der Benutzer überhaupt eine Antwort hat
    if (!hasUserSubmitted(username)) {
      return NextResponse.json({ 
        success: false, 
        message: `Benutzer ${username} hat keine aktive Antwort` 
      }, { status: 400 })
    }

    // Benutzer zurücksetzen
    resetUserSubmission(username)

    return NextResponse.json({
      success: true,
      message: `Benutzer ${username} wurde zurückgesetzt`,
    })
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Benutzers:", error)
    return NextResponse.json({ error: "Fehler beim Zurücksetzen des Benutzers" }, { status: 500 })
  }
}

