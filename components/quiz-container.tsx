"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAnswers } from "@/lib/hooks/useAnswers"

export default function QuizContainer() {
  const [userAnswer, setUserAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [username, setUsername] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { answers, submitAnswer, loading, error } = useAnswers()

  // Check if user has already submitted
  const hasSubmitted = answers.some(answer => answer.username === username)
  const answerCount = answers.length

  // Username check
  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (!storedUsername) {
      router.push("/")
      return
    }

    setUsername(storedUsername)
  }, [router])

  // Focus input if not submitted
  useEffect(() => {
    if (!hasSubmitted && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus()
    }
  }, [hasSubmitted])

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userAnswer.trim() || isSubmitting || hasSubmitted) {
      return
    }

    setIsSubmitting(true)

    try {
      await submitAnswer(username, userAnswer)
      setUserAnswer("")
    } catch (error) {
      console.error("Error submitting answer:", error)
      alert(error instanceof Error ? error.message : "Failed to submit answer")
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
          <p className="text-white/80 text-lg">hey {username} was geht</p>
          <p className="text-white/60">
            {answerCount} {answerCount === 1 ? "Antwort" : "Antworten"} bisher
          </p>
        </div>
      </div>

      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
        {hasSubmitted ? (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-white mb-4">Antwort abgegeben :)</h2>
            <p className="text-white/70 mb-6">
              Geil du hast eine Antwort abgegeben (musst jetzt auf admins warten)
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
                disabled={loading || isSubmitting}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
            </div>

            <Button
              type="submit"
              disabled={!userAnswer.trim() || loading || isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Wird gesendet..." : "Antwort absenden"}
            </Button>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}

