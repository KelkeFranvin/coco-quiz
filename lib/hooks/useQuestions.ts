import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Question {
  id: string;
  type: string; // Assuming you have a type field
  question: string;
}

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from Supabase
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('id', { ascending: true }); // Adjust the order as needed

      if (error) throw error;

      setQuestions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching questions');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions (if needed)
  useEffect(() => {
    const questionsSubscription = supabase
      .channel('questions_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions' },
        () => fetchQuestions()
      )
      .subscribe();

    // Initial fetch
    fetchQuestions();

    // Cleanup subscription
    return () => {
      questionsSubscription.unsubscribe();
    };
  }, []);

  return {
    questions,
    loading,
    error,
    refreshQuestions: fetchQuestions,
  };
};
