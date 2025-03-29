import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export interface Answer {
  id: string
  username: string
  answer: string
  timestamp: string
  reset: boolean
}

export interface ResetAnswer extends Answer {
  resetTimestamp: string
}

export const useAnswers = () => {
  const [activeAnswers, setActiveAnswers] = useState<Answer[]>([])
  const [resetAnswersList, setResetAnswersList] = useState<ResetAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch both active and reset answers
  const fetchAnswers = async () => {
    try {
      setLoading(true)
      // Fetch active answers
      const { data: activeAnswersData, error: activeError } = await supabase
        .from('answers')
        .select('*')
        .order('timestamp', { ascending: false })

      if (activeError) throw activeError

      // Fetch reset answers
      const { data: resetAnswersData, error: resetError } = await supabase
        .from('reset_answers')
        .select('*')
        .order('resetTimestamp', { ascending: false })

      if (resetError) throw resetError

      setActiveAnswers(activeAnswersData || [])
      setResetAnswersList(resetAnswersData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Submit a new answer
  const submitAnswer = async (username: string, answer: string) => {
    try {
      const { data, error } = await supabase
        .from('answers')
        .insert([{
          username,
          answer,
          timestamp: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchAnswers() // Refresh the answers list
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to submit answer')
    }
  }

  // Reset answers
  const handleReset = async () => {
    try {
      // Get all answers (no need to filter by reset since we're moving all)
      const { data: answersToReset, error: fetchError } = await supabase
        .from('answers')
        .select('*')

      if (fetchError) {
        console.error('Error fetching answers:', fetchError)
        throw fetchError
      }

      if (answersToReset && answersToReset.length > 0) {
        // Move answers to reset_answers
        const { error: insertError } = await supabase
          .from('reset_answers')
          .insert(
            answersToReset.map(answer => ({
              ...answer,
              resetTimestamp: new Date().toISOString()
            }))
          )

        if (insertError) {
          console.error('Error inserting to reset_answers:', insertError)
          throw insertError
        }

        // Delete from answers
        const { error: deleteError } = await supabase
          .from('answers')
          .delete()
          .in('id', answersToReset.map(answer => answer.id))

        if (deleteError) {
          console.error('Error deleting from answers:', deleteError)
          throw deleteError
        }

        await fetchAnswers() // Refresh both lists
      }
    } catch (err) {
      console.error('Reset error:', err)
      throw err instanceof Error ? err : new Error('Failed to reset answers')
    }
  }

  // Reset individual answer
  const resetIndividualAnswer = async (answerId: string) => {
    try {
      // Get the answer to reset
      const { data: answerToReset, error: fetchError } = await supabase
        .from('answers')
        .select('*')
        .eq('id', answerId)
        .single()

      if (fetchError) throw fetchError

      if (answerToReset) {
        // Move answer to reset_answers
        const { error: insertError } = await supabase
          .from('reset_answers')
          .insert([{
            ...answerToReset,
            resetTimestamp: new Date().toISOString()
          }])

        if (insertError) throw insertError

        // Delete from answers
        const { error: deleteError } = await supabase
          .from('answers')
          .delete()
          .eq('id', answerId)

        if (deleteError) throw deleteError

        await fetchAnswers() // Refresh both lists
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to reset answer')
    }
  }

  const handleResetReset = async () => {
    try {
      console.log("Fetching answers to reset...");
      const { data: answersToReset, error: fetchError } = await supabase
        .from('reset_answers')
        .select('*');

      if (fetchError) {
        console.error('Error fetching answers:', fetchError);
        throw fetchError;
      }

      console.log("Fetched answers:", answersToReset);

      if (answersToReset && answersToReset.length > 0) {
        console.log("Inserting answers into reset_reset_answers...");
        const { error: insertError } = await supabase
          .from('reset_reset_answers')
          .insert(
            answersToReset.map(answer => ({
              ...answer,
              resetResetTimestamp: new Date().toISOString()
            }))
          );

        if (insertError) {
          console.error('Error inserting to reset_reset_answers:', insertError);
          throw insertError;
        }

        console.log("Successfully inserted answers.");

        console.log("Deleting from reset_answers...");
        const { error: deleteError } = await supabase
          .from('reset_answers')
          .delete()
          .in('id', answersToReset.map(answer => answer.id));

        if (deleteError) {
          console.error('Error deleting from reset_answers:', deleteError);
          throw deleteError;
        }

        console.log("Successfully deleted answers.");
        await fetchAnswers(); // Refresh both lists
      }
    } catch (err) {
      console.error('Reset reset error:', err);
      throw err instanceof Error ? err : new Error('Failed to reset reset answers');
    }
  }

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to changes in the answers table
    const answersSubscription = supabase
      .channel('answers_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'answers' },
        () => fetchAnswers()
      )
      .subscribe()

    // Subscribe to changes in the reset_answers table
    const resetAnswersSubscription = supabase
      .channel('reset_answers_channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reset_answers' },
        () => fetchAnswers()
      )
      .subscribe()

    // Initial fetch
    fetchAnswers()

    // Cleanup subscriptions
    return () => {
      answersSubscription.unsubscribe()
      resetAnswersSubscription.unsubscribe()
    }
  }, [])

  return {
    answers: activeAnswers,
    resetAnswersList,
    loading,
    error,
    submitAnswer,
    handleReset,
    handleResetReset,
    resetIndividualAnswer,
    refreshAnswers: fetchAnswers
  }
} 
