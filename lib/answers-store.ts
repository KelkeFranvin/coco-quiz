import { Answer } from "@/types/answer"

let nextId = 1
let answers: Answer[] = []
let resetAnswers: Answer[] = [] // Speichert zurückgesetzte Antworten

// Funktion zum Hinzufügen einer neuen Antwort
export function addAnswer(answer: string, username: string): Answer {
  const newAnswer: Answer = {
    id: nextId++,
    answer,
    username,
    timestamp: new Date().toISOString(),
  }
  answers = [...answers, newAnswer]
  return newAnswer
}

// Funktion zum Abrufen aller aktiven Antworten
export function getAnswers(): Answer[] {
  return [...answers]
}

// Funktion zum Abrufen aller zurückgesetzten Antworten
export function getResetAnswers(): Answer[] {
  return [...resetAnswers]
}

// Speichert, welche Benutzer bereits geantwortet haben
let userSubmissions: Record<string, boolean> = {}

// Funktion zum Markieren eines Benutzers als "hat geantwortet"
export function markUserSubmitted(username: string): void {
  userSubmissions = { ...userSubmissions, [username]: true }
}

// Funktion zum Prüfen, ob ein Benutzer bereits geantwortet hat
export function hasUserSubmitted(username: string): boolean {
  return !!userSubmissions[username]
}

// Funktion zum Zurücksetzen des Antwort-Status für einen Benutzer
export function resetUserSubmission(username: string): void {
  // Entferne den Benutzer aus userSubmissions
  const newUserSubmissions = { ...userSubmissions }
  delete newUserSubmissions[username]
  userSubmissions = newUserSubmissions
  
  // Finde die Antwort des Benutzers
  const userAnswers = answers.filter(answer => answer.username === username)
  
  // Verschiebe die Antworten in resetAnswers
  resetAnswers = [...resetAnswers, ...userAnswers.map(answer => ({
    ...answer,
    resetTimestamp: new Date().toISOString()
  }))]
  
  // Entferne die Antworten aus der aktiven Liste
  answers = answers.filter(answer => answer.username !== username)
}

// Funktion zum Zurücksetzen aller Benutzer-Antwort-Status
export function resetAllUserSubmissions(): void {
  // Verschiebe alle aktuellen Antworten in resetAnswers
  resetAnswers = [
    ...resetAnswers,
    ...answers.map(answer => ({
      ...answer,
      resetTimestamp: new Date().toISOString()
    }))
  ]
  
  // Lösche alle Einträge
  userSubmissions = {}
  answers = []
}

