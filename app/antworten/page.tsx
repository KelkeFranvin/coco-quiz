"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  const fetchAnswers = async () => {
    try {
      const response = await fetch('/api/answers')
      if (!response.ok) throw new Error('Failed to fetch answers')
      const data = await response.json()
      setAnswers(data.answers || [])
      setResetAnswers(data.resetAnswers || [])
    } catch (error) {
      console.error('Error fetching answers:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
        })

        socket.on('answer-submitted', () => {
          console.log('New answer received, refreshing...')
          fetchAnswers()
        })

        socket.on('quiz-reset', () => {
          console.log('Quiz reset event received, refreshing...')
          fetchAnswers()
        })

        return () => {
          socket.disconnect()
        }
      } catch (error) {
        console.error('Socket initialization error:', error)
      }
    }

    initSocket()
    fetchAnswers()
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "admin") {
      setIsAuthenticated(true)
    } else {
      setError("Falsches Passwort")
    }
  }

  const handleReset = async (username: string) => {
    setResetLoading(true)
    try {
      const response = await fetch('/api/reset-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to reset user')
      }

      socket?.emit('reset-quiz', { username })
      await fetchAnswers()
    } catch (error) {
      console.error('Error resetting user:', error)
      alert(error instanceof Error ? error.message : 'Failed to reset user')
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetAll = async () => {
    if (!confirm('Möchtest du wirklich alle Benutzer zurücksetzen?')) return
    
    setResetLoading(true)
    try {
      const response = await fetch('/api/reset-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetAll: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to reset all users')
      }

      socket?.emit('reset-quiz', { resetAll: true })
      await fetchAnswers()
    } catch (error) {
      console.error('Error resetting all users:', error)
      alert(error instanceof Error ? error.message : 'Failed to reset all users')
    } finally {
      setResetLoading(false)
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
            {/* Aktuelle Antworten */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Aktuelle Antworten</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetAll}
                    disabled={resetLoading}
                    variant="outline"
                    className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                  >
                    Alle zurücksetzen
                  </Button>
                  <Link href="/quiz">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      Zurück zum Quiz
                    </Button>
                  </Link>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Lade Antworten...</p>
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

            {/* Zurückgesetzte Antworten */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Vorherige Antworten</h2>
              
              {resetAnswers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xl">Keine zurückgesetzten Antworten</p>
                  <p className="mt-2">Hier erscheinen Antworten, die zurückgesetzt wurden</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {resetAnswers.map((answer) => (
                    <Card key={`${answer.id}-${answer.resetTimestamp}`} className="bg-black/40 border-white/10">
                      <CardHeader className="pb-2">
                        <div>
                          <CardTitle className="text-lg text-white">
                            <span className="text-purple-400">{answer.username}</span> - Antwort #{answer.id}
                          </CardTitle>
                          <CardDescription>
                            Eingereicht: {new Date(answer.timestamp).toLocaleString("de-DE")}
                            <br />
                            Zurückgesetzt: {answer.resetTimestamp ? new Date(answer.resetTimestamp).toLocaleString("de-DE") : "Unbekannt"}
                          </CardDescription>
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
          </div>
        )}
      </div>
    </main>
  )
} 