"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAnswers } from "@/lib/hooks/useAnswers"
import { changeQuestionType } from "@/lib/hooks/changeQuestionType"
import { fetchBuzzers, buzzer, resetIndividualBuzzer, resetAllBuzzer } from "@/lib/hooks/buzz"
import { supabase } from "@/lib/supabaseClient"
import { fetchLeaderboard, updateLeaderboardEntry, insertLeaderboardEntry, LeaderboardEntry } from '@/lib/hooks/leaderboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { answers, resetAnswersList, loading: loadingAnswers, handleReset, resetIndividualAnswer, handleResetReset } = useAnswers()
  const [buzzers, setBuzzers] = useState<buzzer[]>([])
  const [loadingBuzzers, setLoadingBuzzers] = useState(true)
  const [buzzerCounts, setBuzzerCounts] = useState<{ [key: string]: number }>({})
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [newScore, setNewScore] = useState<number>(0);
  const [newUsername, setNewUsername] = useState<string>("");

  // Fetch leaderboard on mount and set up real-time updates
  useEffect(() => {
    const getLeaderboard = async () => {
      const entries = await fetchLeaderboard();
      setLeaderboard(entries);
    };
    getLeaderboard();

    // Subscribe to real-time updates for leaderboard
    const leaderboardSubscription = supabase
      .channel('leaderboard_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'leaderboard' },
        () => getLeaderboard() // Refresh leaderboard on new entry
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'leaderboard' },
        () => getLeaderboard() // Refresh leaderboard on update
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(leaderboardSubscription);
    };
  }, []);

  const handleUpdateLeaderboard = async (id: number) => {
    const updated = await updateLeaderboardEntry(id, newScore);
    if (updated) {
      // Update local state with new score
      setLeaderboard((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, score: updated.score } : entry
        )
      );
      setEditingEntry(null);
    }
  };

  const handleAddLeaderboardEntry = async () => {
    if (!newUsername || newScore <= 0) return;
    const newEntry = await insertLeaderboardEntry(newUsername, newScore);
    if (newEntry) {
      setLeaderboard((prev) => [...prev, newEntry]);
      setNewUsername("");
      setNewScore(0);
    }
  };

  // Fetch buzzers on component mount
  useEffect(() => {
    const getBuzzers = async () => {
      setLoadingBuzzers(true)
      const fetchedBuzzers = await fetchBuzzers()
      setBuzzers(fetchedBuzzers)

      // Count the number of presses for each user
      const counts: { [key: string]: number } = {}
      fetchedBuzzers.forEach(buzzer => {
        counts[buzzer.username] = (counts[buzzer.username] || 0) + 1
      })
      setBuzzerCounts(counts)

      setLoadingBuzzers(false)
    }

    getBuzzers()
  }, [])

  // Subscribe to real-time updates for buzzers
  useEffect(() => {
    const buzzerSubscription = supabase
      .channel('buzzers_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'buzzers' },
        (payload) => {
          console.log('New buzzer added:', payload)
          const newBuzzer = payload.new as buzzer

          // Update buzzer counts
          setBuzzerCounts((prevCounts) => ({
            ...prevCounts,
            [newBuzzer.username]: (prevCounts[newBuzzer.username] || 0) + 1
          }))

          // Check if the username already exists in the current buzzers
          setBuzzers((prevBuzzers) => {
            if (!prevBuzzers.some(b => b.username === newBuzzer.username)) {
              return [...prevBuzzers, newBuzzer] // Add the new buzzer if it doesn't exist
            }
            return prevBuzzers // Return the previous state if it exists
          })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(buzzerSubscription)
    }
  }, [])

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

  const handleResetIndividualBuzzer = async (buzzerUsername: string) => {
    setLoadingBuzzers(true)
    await resetIndividualBuzzer(buzzerUsername)
    const fetchedBuzzers = await fetchBuzzers()
    setBuzzers(fetchedBuzzers)

    // Reset the count for the specific buzzer
    setBuzzerCounts((prevCounts) => ({
        ...prevCounts,
        [buzzerUsername]: 0 // Reset the count for the specific user
    }))
    
    setLoadingBuzzers(false)
  }

  const handleResetAllBuzzer = async () => {
    setLoadingBuzzers(true)
    await resetAllBuzzer()
    setBuzzers([])
    setBuzzerCounts({})
    setLoadingBuzzers(false)
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
                    disabled={loadingAnswers}
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

              {loadingAnswers ? (
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
                          disabled={loadingAnswers}
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

            {/* BUZZER*/}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Buzzers</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetAllBuzzer}
                    disabled={loadingBuzzers}
                    variant="outline"
                    className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                  >
                    Alle zurücksetzen
                  </Button>
                </div>
              </div>

              {loadingBuzzers ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Lade Buzzer...</p>
                </div>
              ) : buzzers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xl">Noch keine Buzzer</p>
                  <p className="mt-2">Warte auf Buzzer</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {buzzers.map((buzzer) => (
                    <div
                      key={buzzer.id}
                      className="bg-black/30 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-semibold">{buzzer.username}</h3>
                          <div className="relative">
                            <img width={100} src="/buzzer.png" alt="Buzzer" />
                            <span className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl font-bold rounded-full px-1">
                              {buzzerCounts[buzzer.username] || 0}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm mt-2">
                            {(() => {
                              const date = new Date(buzzer.timestamp);
                              const options: Intl.DateTimeFormatOptions = {
                                timeZone: 'Europe/Berlin',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false // Use 24-hour format
                              };
                              const formattedDate = date.toLocaleString('de-DE', options);
                              const milliseconds = date.getMilliseconds().toString().padStart(3, '0'); // Get milliseconds and pad to 3 digits
                              return `${formattedDate}.${milliseconds}`; // Combine date and milliseconds
                            })()}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleResetIndividualBuzzer(buzzer.username)}
                          disabled={loadingBuzzers}
                          variant="outline"
                          size="sm"
                          className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                        >
                          {loadingBuzzers ? "Zurücksetzen..." : "Zurücksetzen"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="mt-8 backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-lg p-8 w-full max-w-4xl">
                <h2 className="text-2xl font-bold text-white mb-4">Leaderboard Verwaltung</h2>
                
                {/* Add Entry Section */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Input
                    type="text"
                    placeholder="Benutzername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-black/30 border-purple-500/30 text-white"
                  />
                  <Input
                    type="number"
                    placeholder="Punkte"
                    value={newScore}
                    onChange={(e) => setNewScore(parseInt(e.target.value, 10) || 0)}
                    className="w-20 bg-black/30 border-purple-500/30 text-white"
                  />
                  <Button onClick={handleAddLeaderboardEntry} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Eintrag hinzufügen
                  </Button>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-gray-300">Noch keine Leaderboard-Einträge</p>
                ) : (
                  <ul className="space-y-4">
                    {leaderboard.map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-white">{entry.username}</span>
                        {editingEntry?.id === entry.id ? (
                          <>
                            <Input
                              type="number"
                              value={newScore}
                              onChange={(e) => setNewScore(parseInt(e.target.value, 10))}
                              className="w-20 bg-black/30 border-purple-500/30 text-white mr-2"
                            />
                            <Button onClick={() => setEditingEntry(null)} variant="outline" className="ml-2">
                              Abbrechen
                            </Button>
                            <Button onClick={() => handleUpdateLeaderboard(entry.id)}>
                              Speichern
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-white">{entry.score}</span>
                            <Button
                              onClick={() => {
                                setEditingEntry(entry);
                                setNewScore(entry.score);
                              }}
                              variant="outline"
                              size="sm"
                              className="ml-4 bg-black/30 border-white/20 text-white hover:bg-white/10"
                            >
                              Bearbeiten
                            </Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Zurückgesetzte Antworten */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Zurückgesetzte Antworten</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetReset}
                    disabled={loadingAnswers}
                    variant="outline"
                    className="bg-black/30 border-white/20 text-white hover:bg-white/10"
                  >
                    Alle aus der Datenbank löschen
                  </Button>
                </div>
              </div>
              
              {loadingAnswers ? (
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

