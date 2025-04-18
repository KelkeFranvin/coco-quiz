"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAnswers } from "@/lib/hooks/useAnswers"
import { fetchQuestionType } from "@/lib/hooks/changeQuestionType"
import { submitBuzz } from "@/lib/hooks/buzz"
import { supabase } from '@/lib/supabaseClient'
import { fetchLeaderboard, LeaderboardEntry } from '@/lib/hooks/leaderboard'

export default function QuizContainer() {
  const [userAnswer, setUserAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [username, setUsername] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { answers, submitAnswer, error } = useAnswers()

  const [questionType, setQuestionType] = useState<string | null>(null)
  const [buzzerCount, setBuzzerCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const getQuestionType = async () => {
      const data = await fetchQuestionType()
      if (data && data.length > 0) {
        console.log("Setting question type to:", data[0].questiontype)
        setQuestionType(data[0].questiontype)
      } else {
        console.log("No question type data found or data is empty.")
      }
    }

    getQuestionType()

    // Set up a channel to listen for changes in the questiontype table
    const questionTypeChannel = supabase
      .channel('questiontype_channel')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'questiontype' },
        payload => {
          if (payload.new.id === 1) {
            console.log("Question type updated:", payload.new.questiontype);
            setQuestionType(payload.new.questiontype);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      questionTypeChannel.unsubscribe();
    }
  }, [])

  // Function to fetch the current buzzer count from Supabase
  const fetchBuzzerCount = async () => {
    try {
      const { count, error } = await supabase
        .from('buzzers')
        .select('*', { count: 'exact' }); // Fetch the count of rows

      if (error) throw error;

      setBuzzerCount(count ?? 0); // Use nullish coalescing to default to 0 if count is null
    } catch (err) {
      console.error("Error fetching buzzer count:", err);
    }
  };

  // Fetch initial buzzer count on mount
  useEffect(() => {
    fetchBuzzerCount(); // Fetch initial buzzer count

    // Set up a channel to listen for changes in the buzzers table
    const buzzerChannel = supabase
      .channel('buzzers_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'buzzers' },
        () => {
          fetchBuzzerCount(); // Fetch count again on new buzzer
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'buzzers' },
        () => {
          fetchBuzzerCount(); // Fetch count again on deletion
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      buzzerChannel.unsubscribe(); // Use unsubscribe to clean up the subscription
    };
  }, []); // Empty dependency array to run only on mount

  const questionTypeIsNormal = (questionType === "normal")
  const questionTypeIsBuzzer = (questionType === "buzzer")
  const questionTypeIsNothing = (questionType === "nichts")

  // Check if user has already submitted an answer
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

  // Fetch leaderboard entries on mount and set up real-time updates
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
          {questionTypeIsBuzzer ? (
            <p className="text-white/60">{buzzerCount} Buzzer bisher</p>
          ) : questionTypeIsNormal ? (
            <p className="text-white/60">
              {answerCount} {answerCount === 1 ? "Antwort" : "Antworten"} bisher
            </p>
          ) : (
            <></>
          )}
        </div>
      </div>

      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
        {questionTypeIsNormal ? (
          hasSubmitted ? (
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
                  disabled={isSubmitting || hasSubmitted}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
              </div>

              <Button
                type="submit"
                disabled={!userAnswer.trim() || isSubmitting || hasSubmitted}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting ? "Wird gesendet..." : "Antwort absenden"}
              </Button>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </form>
          )
        ) : questionTypeIsBuzzer ? (
          <div className="text-center py-6">
            <button 
              className="relative rounded-full overflow-hidden transition-all duration-300 transform hover:scale-105 active:scale-95 group"
              onClick={() => {
                console.log("Buzzurrrr");
                submitBuzz(username);
              }}
            >
              <img src="/buzzer.png" alt="Buzzer" className="w-full h-auto relative z-10 transition-all duration-300 group-hover:brightness-110 group-active:brightness-90" />
            </button>
          </div>
        ) : questionTypeIsNothing ? (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-white mb-4">Warte auf die Admins...</h2>
            <p className="text-white/70 mb-6">
              Coco Quiz 🔥
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-white mb-4">Öhhh</h2>
            <p className="text-white/70 mb-6">
              Das nicht normal 💀 (sag mal Kelvin Bescheid)
            </p>
          </div>
        )}
      </div>

      {/* Display Leaderboard */}
      <div className="mt-8 p-4 bg-black/30 rounded-xl border border-white/20 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-gray-300">Noch keine Runde gespielt hahaha</p>
        ) : (
          <ul>
            {leaderboard.map((entry) => (
              <li key={entry.id} className="flex justify-between text-white py-1 border-b border-white/10">
                <span>{entry.username}</span>
                <span>{entry.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

