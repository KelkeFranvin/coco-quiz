"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function UsernameForm() {
  const [username, setUsername] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) return

    setIsSubmitting(true)

    // Speichere den Benutzernamen im localStorage
    localStorage.setItem("username", username.trim())

    // Weiterleitung zur Quiz-Seite
    router.push("/quiz")
  }

  return (
    <div className="relative z-10 w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 tracking-tight">
          Coco Quiz
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-4"></div>
        <p className="text-white/80 text-lg mb-6">Jo wie heißt du? (falls du in einem Team bist gib den Teamnamen an)</p>
      </div>

      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <Input
              type="text"
              placeholder="Dein Name / Teamname..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black/30 border-purple-500/30 text-white placeholder:text-gray-400 h-14 px-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              autoFocus
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !username.trim()}
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

            {/* Glanzeffekt */}
            <span className="absolute inset-0 w-1/3 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out"></span>

            {/* Glüheffekt */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300"></span>

            {/* Button-Inhalt */}
            <span className="relative flex items-center justify-center gap-2">
              <span className="group-hover:scale-110 transition-transform duration-300">Starten</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </span>
          </Button>
        </form>
      </div>
    </div>
  )
}

