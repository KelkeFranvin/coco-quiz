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
import { fetchAnimation } from "@/lib/hooks/animation"
//import { Question } from "@/lib/hooks/useQuestions"

export default function QuizContainer() {
  const [userAnswer, setUserAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [username, setUsername] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { answers, submitAnswer, error } = useAnswers()

  const [questionType, setQuestionType] = useState<string | null>(null)
  const [animation, setAnimation] = useState<string | null>(null)
  const [buzzerCount, setBuzzerCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [showQuestion, setShowQuestion] = useState<boolean>(false)

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

  useEffect(() => {
    const getAnimation = async () => {
      const data = await fetchAnimation()
      if (data && data.length > 0) {
        console.log("Setting animation to:", data[0].questiontype)
        setQuestionType(data[0].questiontype)
      } else {
        console.log("No animation data found or data is empty.")
      }
    }

    getAnimation()

    // Set up a channel to listen for changes in the animation table
    const animationChannel = supabase
      .channel('animation_channel')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'animation' },
        payload => {
          if (payload.new.id === 1) {
            console.log("Animation updated:", payload.new.animation);
            setAnimation(payload.new.animation);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      animationChannel.unsubscribe();
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
  const questionTypeIsMultipleChoice = (questionType === "multiplechoice")

  const animation100 = (animation === "100")
  const animation200 = (animation === "200")
  const animation300 = (animation === "300")
  const animation400 = (animation === "400")

  // Check if user has already submitted an answer
  const hasSubmitted = answers.some(answer => answer.username === username)
  const answerCount = answers.length

  // Fetch the current question and show_question status
  const fetchCurrentQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('question_settings')
        .select('current_question, show_question')
        .eq('id', 1) // Assuming the ID of the row to check is 1
        .single();

      if (error) throw error;

      setCurrentQuestion(data.current_question);
      setShowQuestion(data.show_question);
    } catch (err) {
      console.error("Error fetching current question:", err);
    }
  };

  useEffect(() => {
    fetchCurrentQuestion();

    // Set up a real-time subscription to the question_settings table
    const subscription = supabase
      .channel('question_settings_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'question_settings' },
        () => fetchCurrentQuestion() // Fetch the current question again on change
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const handleMultipleChoice = async (answer: string) => {
    if (!answer.trim() || isSubmitting || hasSubmitted) {
      return
    }

    setIsSubmitting(true)

    answer = "Multiple Choice: " + answer

    try {
      await submitAnswer(username, answer)
      setUserAnswer("")
    } catch (error) {
      console.error("Error submitting answer:", error)
      alert(error instanceof Error ? error.message : "Failed to submit answer")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    // Preload images
    const images = [
      "/100.png",
      "/200.png",
      "/300.png",
      "/400.png"
    ];

    images.forEach((src) => {
      const img = new Image();
      img.src = src; // This will preload the image
    });
  }, []); // Empty dependency array to run only on mount

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
          {/* Always display the current question if show_question is TRUE */}
          {showQuestion && currentQuestion ? (
            <p className="text-white text-2xl underline">{currentQuestion}</p>
          ) : null}
          {/* Display the answer count only if submitted and question type is normal or multiple choice */}
          {(questionTypeIsNormal || questionTypeIsMultipleChoice) ? (
            <p className="text-white/60">
              {answerCount} {answerCount === 1 ? "Antwort" : "Antworten"} bisher
            </p>
          ) : null}
          {/* Display the buzzer count only for buzzer question type */}
          {questionTypeIsBuzzer && (
            <p className="text-white/60">{buzzerCount} Buzzer bisher</p>
          )}
        </div>
      </div>

      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(192,132,252,0.15)] p-8">
        {/* Display the image when animation100 is true */}
        {animation100 && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <img src="/100.png" alt="Animation" className="w-1/2 h-auto floating-image" />
          </div>
        )}
        {animation200 && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <img src="/200.png" alt="Animation" className="w-1/2 h-auto floating-image" />
          </div>
        )}
        {animation300 && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <img src="/300.png" alt="Animation" className="w-1/2 h-auto floating-image" />
          </div>
        )}
        {animation400 && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <img src="/400.png" alt="Animation" className="w-1/2 h-auto floating-image" />
          </div>
        )}
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
        ) : questionTypeIsMultipleChoice ? (
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
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold text-white mb-4">Multiple Choice</h2>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <Button 
                  onClick={() => handleMultipleChoice('A')}
                  className="bg-black/30 border-purple-500/30 text-white hover:bg-white/10 h-16 text-lg font-semibold active:bg-black/50 focus:bg-black/50"
                >
                  A
                </Button>
                <Button 
                  onClick={() => handleMultipleChoice('B')}
                  className="bg-black/30 border-purple-500/30 text-white hover:bg-white/10 h-16 text-lg font-semibold active:bg-black/50 focus:bg-black/50"
                >
                  B
                </Button>
                <Button 
                  onClick={() => handleMultipleChoice('C')}
                  className="bg-black/30 border-purple-500/30 text-white hover:bg-white/10 h-16 text-lg font-semibold active:bg-black/50 focus:bg-black/50"
                >
                  C
                </Button>
                <Button 
                  onClick={() => handleMultipleChoice('D')}
                  className="bg-black/30 border-purple-500/30 text-white hover:bg-white/10 h-16 text-lg font-semibold active:bg-black/50 focus:bg-black/50"
                >
                  D
                </Button>
              </div>
            </div>
          )
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