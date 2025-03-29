"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAnswers } from "@/lib/hooks/useAnswers"
import { changeQuestionType } from "@/lib/hooks/changeQuestionType"

export default function AnswersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { answers, resetAnswersList, loading, handleReset, resetIndividualAnswer } = useAnswers()

  // Check for existing authentication on component mount
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin")
    const storedHash = localStorage.getItem("adminHash")
    const currentHash = btoa("cocoquizhurra") // Simple hash of current password
    
    if (isAdmin === "true" && storedHash === currentHash) {
      setIsAuthenticated(true)
    } else {
      // Clear invalid session
      localStorage.removeItem("isAdmin")
      localStorage.removeItem("adminHash")
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "cocoquizhurra") {
      setIsAuthenticated(true)
      localStorage.setItem("isAdmin", "true")
      localStorage.setItem("adminHash", btoa("cocoquizhurra"))
    } else {
      setError("Falsches Passwort")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("isAdmin")
    localStorage.removeItem("adminHash")
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

        <div className="flex justify-between mb-8">
          <div className="flex space-x-2">
            {isAuthenticated && (
              <>
                <Button
                  onClick={() => changeQuestionType("nichts")}
                  variant="outline"
                  className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                >
                  Gar nichts
                </Button>
                <Button
                  onClick={() => changeQuestionType("buzzer")}
                  variant="outline"
                  className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                >
                  Buzzer
                </Button>
                <Button
                  onClick={() => changeQuestionType("normal")}
                  variant="outline"
                  className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                >
                  Normal
                </Button>
              </>
            )}
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-black/30 border-white/20 text-white hover:bg-white/10"
          >
            Abmelden
          </Button>
        </div>

        {!isAuthenticated ? (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Wenn du fr Admin bist beweis es</h2>

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
                    onClick={handleReset}
                    disabled={loading}
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

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Lade Antworten...</p>
                </div>
              ) : answers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xl">Noch keine Antworten vorhanden</p>
                  <p className="mt-2">Warte auf Antworten</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="bg-black/30 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-semibold">{answer.username}</h3>
                          <p className="text-gray-300 mt-1">{answer.answer}</p>
                          <p className="text-gray-500 text-sm mt-2">
                            {new Date(answer.timestamp).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
                          </p>
                        </div>
                        <Button
                          onClick={() => resetIndividualAnswer(answer.id)}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                          className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                        >
                          Zurücksetzen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zurückgesetzte Antworten */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Zurückgesetzte Antworten</h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Lade zurückgesetzte Antworten...</p>
                </div>
              ) : resetAnswersList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Keine zurückgesetzten Antworten</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {resetAnswersList.map((answer) => (
                    <div
                      key={answer.id}
                      className="bg-black/30 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-semibold">{answer.username}</h3>
                          <p className="text-gray-300 mt-1">{answer.answer}</p>
                          <p className="text-gray-500 text-sm mt-2">
                            Eingereicht: {new Date(answer.timestamp).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Zurückgesetzt: {new Date(answer.resetTimestamp).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
                          </p>
                        </div>
                      </div>
                    </div>
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

