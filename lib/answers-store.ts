import { supabase } from './supabaseClient';
import { Answer } from "@/types/answer"

// Function to add a new answer
export async function addAnswer(answer: string, username: string): Promise<Answer | null> {
  const { data, error } = await supabase
    .from('answers')
    .insert([{ answer, username }])
    .single();

  if (error) {
    console.error("Error adding answer:", error);
    return null;
  }

  return data as Answer;
}

// Function to get all active answers
export async function getAnswers(): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*');

  if (error) {
    console.error("Error fetching answers:", error);
    return [];
  }

  return data as Answer[];
}

// Function to get all reset answers
export async function getResetAnswers(): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('reset', true); // Assuming you have a 'reset' column to identify reset answers

  if (error) {
    console.error("Error fetching reset answers:", error);
    return [];
  }

  return data as Answer[];
}

// Speichert, welche Benutzer bereits geantwortet haben
let userSubmissions: Record<string, boolean> = {}

// Function to mark a user as "has submitted"
export function markUserSubmitted(username: string): void {
  userSubmissions = { ...userSubmissions, [username]: true }
}

// Function to check if a user has already submitted
export function hasUserSubmitted(username: string): boolean {
  return !!userSubmissions[username]
}

// Function to reset user submission
export async function resetUserSubmission(username: string): Promise<void> {
  const { error } = await supabase
    .from('answers')
    .delete()
    .match({ username });

  if (error) {
    console.error("Error resetting user submission:", error);
  }
}

// Function to reset all user submissions
export async function resetAllUserSubmissions(): Promise<void> {
  const { error } = await supabase
    .from('answers')
    .delete();

  if (error) {
    console.error("Error resetting all submissions:", error);
  }
}

