import QuizContainer from "@/components/quiz-container"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function QuizPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-black to-black opacity-70"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-60 h-60 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Admin-Button */}
      <div className="absolute top-4 right-4 z-20">
        <Link href="/antworten">
          <Button variant="outline" className="bg-black/30 border-white/20 text-white hover:bg-white/10">
            Admin-Bereich
          </Button>
        </Link>
      </div>

      <QuizContainer />
    </main>
  )
}

