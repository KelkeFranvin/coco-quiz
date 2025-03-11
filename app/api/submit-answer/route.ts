import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addAnswer, hasUserSubmitted, markUserSubmitted } from "@/lib/answers-store"

export async function POST(request: NextRequest) {
  try {
    const { username, answer } = await request.json()

    if (!username || !answer) {
      console.log('Missing username or answer:', { username, answer })
      return NextResponse.json(
        { message: 'Username and answer are required' },
        { status: 400 }
      )
    }

    // Check if user has already submitted an answer
    if (hasUserSubmitted(username)) {
      console.log('User already submitted:', username)
      return NextResponse.json(
        { message: 'You have already submitted an answer' },
        { status: 400 }
      )
    }

    // Add the new answer
    console.log('Adding new answer for user:', username)
    const newAnswer = addAnswer(answer, username)
    
    // Mark the user as submitted
    markUserSubmitted(username)
    
    console.log('Answer saved successfully')

    return NextResponse.json(
      { message: 'Answer submitted successfully', answer: newAnswer },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { message: 'Error submitting answer' },
      { status: 500 }
    )
  }
} 