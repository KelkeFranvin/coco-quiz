import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Answer } from '@/types/answer'

const answersFilePath = path.join(process.cwd(), 'data', 'answers.json')

// Stellt sicher, dass das Verzeichnis existiert
async function ensureDirectoryExists() {
  try {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true })
  } catch (error) {
    console.error('Error creating directory:', error)
  }
}

// Liest die Antworten aus der Datei
async function getAnswers() {
  try {
    await ensureDirectoryExists()
    
    try {
      const data = await fs.readFile(answersFilePath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      // Falls die Datei nicht existiert oder nicht gültig ist, erstelle eine neue
      const initialData = { answers: [], resetAnswers: [] }
      await fs.writeFile(answersFilePath, JSON.stringify(initialData, null, 2))
      return initialData
    }
  } catch (error) {
    console.error('Error reading answers:', error)
    return { answers: [], resetAnswers: [] }
  }
}

// Speichert die Antworten in der Datei
async function saveAnswers(data: { answers: Answer[], resetAnswers: Answer[] }) {
  try {
    await ensureDirectoryExists()
    await fs.writeFile(answersFilePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving answers:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, answer } = await request.json()

    if (!username || !answer) {
      return NextResponse.json(
        { message: 'Username and answer are required' },
        { status: 400 }
      )
    }

    // Lade bestehende Antworten
    const data = await getAnswers()
    
    // Prüfe, ob der Benutzer bereits eine Antwort eingereicht hat
    const existingAnswer = data.answers.find((a: Answer) => a.username === username)
    if (existingAnswer) {
      return NextResponse.json(
        { message: 'You have already submitted an answer' },
        { status: 400 }
      )
    }

    // ID für die neue Antwort generieren
    const maxId = data.answers.length > 0 
      ? Math.max(...data.answers.map((a: Answer) => a.id)) 
      : 0
    
    // Neue Antwort erstellen
    const newAnswer: Answer = {
      id: maxId + 1,
      username,
      answer,
      timestamp: new Date().toISOString()
    }

    // Antwort speichern
    data.answers.push(newAnswer)
    await saveAnswers(data)

    return NextResponse.json(
      { message: 'Answer submitted successfully', answer: newAnswer },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { message: 'Error submitting answer' },
      { status: 500 }
    )
  }
} 