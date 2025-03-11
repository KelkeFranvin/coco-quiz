"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Answer } from "@/types/answer"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"

export default function AnswersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [answers, setAnswers] = useState<Answer[]>([])
  const [resetAnswers, setResetAnswers] = useState<Answer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  // Lade Antworten vom Server
  const fetchAnswers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/answers')
      if (!response.ok) throw new Error('Failed to fetch answers')
      const data = await response.json()
      setAnswers(data.answers || [])
      setResetAnswers(data.resetAnswers || [])
    } catch (error) {
      console.error('Error fetching answers:', error)
      setError('Failed to load answers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Socket.IO Setup
  useEffect(() => {
    const initSocket = async () => {
      try {
        await fetch('/api/socketio')
        const socket = io({
          path: '/api/socketio',
        })

        socket.on('connect', () => {
          console.log('Admin connected to Socket.IO')
          setSocket(socket)
          void fetchAnswers()
        })

        // Wenn eine neue Antwort eingereicht wurde
        socket.on('answer-submitted', (data: { username: string; answer: string }) => {
          console.log('New answer received:', data)
          void fetchAnswers()
          if (Notification.permission === 'granted') {
            void new Notification('Neue Antwort', {
              body: `${data.username} hat eine neue Antwort eingereicht: "${data.answer}"`,
            })
          }
        })

        // Wenn ein Quiz zurückgesetzt wurde
        socket.on('quiz-reset', (data: { username?: string; resetAll?: boolean }) => {
          console.log('Quiz reset event received:', data)
          void fetchAnswers()
          if (Notification.permission === 'granted') {
            void new Notification('Quiz zurückgesetzt', {
              body: data.resetAll 
                ? 'Alle Antworten wurden zurückgesetzt'
                : `Die Antwort von ${data.username} wurde zurückgesetzt`,
            })
          }
        })

        // Benachrichtigungen aktivieren
        if (Notification.permission === 'default') {
          void Notification.requestPermission()
        }

        return () => {
          socket.disconnect()
        }
      } catch (error) {
        console.error('Socket initialization error:', error)
        setIsLoading(false)
        setError('Failed to connect to socket')
      }
    }

    if (isAuthenticated) {
      setIsLoading(true)
      void initSocket()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, fetchAnswers])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "admin") {
      setIsAuthenticated(true)
    } else {
      setError("Falsches Passwort")
    }
  }

  const handleReset = async (username: string) => {
    if (resetLoading) return
    
    setResetLoading(true)
    setError('') // Clear previous errors
    try {
      const response = await fetch('/api/reset-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset user')
      }

      socket?.emit('quiz-reset', { username })
      
      // Delay fetchAnswers to allow server to process the reset
      setTimeout(() => {
        void fetchAnswers()
        setResetLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error resetting user:', error)
      setError('Failed to reset user')
      setResetLoading(false)
      alert(error instanceof Error ? error.message : 'Failed to reset user')
    }
  }

  const handleResetAll = async () => {
    if (resetLoading) return
    if (!confirm('Möchtest du wirklich alle Benutzer zurücksetzen?')) return
    
    setResetLoading(true)
    setError('') // Clear previous errors
    try {
      const response = await fetch('/api/reset-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetAll: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset all users')
      }

      socket?.emit('quiz-reset', { resetAll: true })
      
      // Delay fetchAnswers to allow server to process the reset
      setTimeout(() => {
        void fetchAnswers()
        setResetLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error resetting all users:', error)
      setError('Failed to reset all users')
      setResetLoading(false)
      alert(error instanceof Error ? error.message : 'Failed to reset all users')
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-start p-4 overflow-hidden">
      {/* Hintergrund */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-black to-black opacity-70"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-60 h-60 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 tracking-tight">
            Admin-Bereich
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-4"></div>
        </div>

        {!isAuthenticated ? (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Anmeldung erforderlich</h2>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-white">
                  Passwort
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin-Passwort eingeben..."
                  className="bg-black/30 border-purple-500/30 text-white"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Anmelden
              </Button>

              <div className="text-center">
                <Link href="/quiz" className="text-purple-400 hover:text-purple-300 text-sm">
                  Zurück zum Quiz
                </Link>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Aktuelle Antworten</h1>
              <div className="flex space-x-4">
                <Button variant="outline" asChild>
                  <Link href="/">Zurück zur Startseite</Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleResetAll}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Wird zurückgesetzt..." : "Alle zurücksetzen"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="backdrop-blur-lg bg-red-500/30 rounded-2xl border border-red-500/20 p-4 my-4">
                <p className="text-white">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            ) : answers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xl">Noch keine Antworten vorhanden</p>
                <p className="mt-2">Warte auf Antworten der Teilnehmer</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {answers.map((answer) => (
                  <Card key={answer.id} className="bg-black/40 border-white/10">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg text-white">
                            <span className="text-purple-400">{answer.username}</span> - Antwort #{answer.id}
                          </CardTitle>
                          <CardDescription>{new Date(answer.timestamp).toLocaleString("de-DE")}</CardDescription>
                        </div>
                        <Button
                          onClick={() => handleReset(answer.username)}
                          disabled={resetLoading}
                          size="sm"
                          variant="outline"
                          className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                        >
                          Zurücksetzen
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white text-lg">{answer.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
} 