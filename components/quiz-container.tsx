"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import type { Answer } from "@/types/answer"

export default function QuizContainer() {
  const [userAnswer, setUserAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [username, setUsername] = useState("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [answerCount, setAnswerCount] = useState(0)

  const checkSubmissionStatus = useCallback(async () => {
    if (!username) return; // Don't check if no username
    
    try {
      setIsSubmitting(true); // Prevent submissions while checking
      const response = await fetch('/api/answers');
      if (!response.ok) throw new Error('Failed to fetch answers');
      
      const data = await response.json();
      const userHasSubmitted = data.answers.some(
        (answer: Answer) => answer.username === username
      );
      
      setHasSubmitted(userHasSubmitted);
      setAnswerCount(data.answers.length);
      
      if (!userHasSubmitted && inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error("Fehler beim Prüfen des Antwort-Status:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [username])

  // Username and submission status check
  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (!storedUsername) {
      router.push("/")
      return
    }

    setUsername(storedUsername)
    checkSubmissionStatus()
  }, [router, checkSubmissionStatus])

  // Socket.IO setup
  useEffect(() => {
    const initSocket = async () => {
      try {
        await fetch('/api/socketio')
        const socket = io({
          path: '/api/socketio',
        })

        socket.on('connect', () => {
          console.log('Connected to Socket.IO')
          setSocket(socket)
        })

        socket.on('answer-submitted', (data: { username: string; answer: string }) => {
          console.log('Answer submitted event received:', data)
          if (data.username === username) {
            setHasSubmitted(true)
            setUserAnswer('')
          }
          void checkSubmissionStatus()
        })

        socket.on('quiz-reset', (data: { username?: string; resetAll?: boolean }) => {
          console.log('Quiz reset event received:', data)
          if (data.resetAll || data.username === username) {
            setHasSubmitted(false)
            setUserAnswer('')
          }
          void checkSubmissionStatus()
        })

        return () => {
          socket.disconnect()
        }
      } catch (error) {
        console.error('Socket initialization error:', error)
      }
    }

    void initSocket()
  }, [username, checkSubmissionStatus])

  // Antwort einreichen
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userAnswer.trim() || isSubmitting || hasSubmitted) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          answer: userAnswer,
        }),
      })

      if (!response.ok) {
        // Don't try to parse the response, just use status text
        throw new Error(`Failed to submit answer: ${response.statusText || 'Unknown error'}`)
      }

      // Only emit socket event and update state if submission was successful
      socket?.emit('submit-answer', { username, answer: userAnswer })
      setHasSubmitted(true)
      setUserAnswer('')
      void checkSubmissionStatus() // Update answer count
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative z-10 w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 tracking-tight">
          Coco Quiz
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-4"></div>

        {/* Benutzername und Antwortanzahl anzeigen */}
        <div className="space-y-2">
          <p className="text-white/80 text-lg">Hallo, {username}!</p>
          <p className="text-white/60">
            {answerCount} {answerCount === 1 ? 'Antwort' : 'Antworten'} bisher
          </p>
        </div>
      </div>

      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
        {hasSubmitted ? (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-white mb-4">Vielen Dank für deine Antwort!</h2>
            <p className="text-white/70 mb-6">
              Du hast bereits eine Antwort abgegeben. Bitte warte, bis der Admin dich zurücksetzt.
            </p>
            <div className="w-24 h-24 mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-green-400 w-full h-full"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Deine Antwort hier eingeben..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="bg-black/30 border-purple-500/30 text-white placeholder:text-gray-400 h-14 px-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || hasSubmitted}
              className={`w-full h-14 text-lg font-bold rounded-xl relative overflow-hidden group transition-all duration-300 ${
                isSubmitting ? "opacity-90" : ""
              }`}
            >
              {/* Animierter Hintergrund */}
              <span
                className={`absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 ${
                  isSubmitting
                    ? "animate-pulse"
                    : "animate-gradient-x group-hover:from-purple-700 group-hover:via-fuchsia-600 group-hover:to-pink-700"
                }`}
              ></span>

              {/* Glanzeffekt - nur anzeigen, wenn nicht im Submitting-Zustand */}
              {!isSubmitting && (
                <span className="absolute inset-0 w-1/3 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out"></span>
              )}

              {/* Glüheffekt - nur anzeigen, wenn nicht im Submitting-Zustand */}
              {!isSubmitting && (
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300"></span>
              )}

              {/* Button-Inhalt */}
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Wird gesendet...</span>
                  </div>
                ) : (
                  <>
                    <span className="group-hover:scale-110 transition-transform duration-300">Absenden</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </span>
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

