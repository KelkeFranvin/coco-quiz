import { supabase } from '@/lib/supabaseClient'

export interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
}

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
};

export const insertLeaderboardEntry = async (username: string, score: number): Promise<LeaderboardEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ username, score, }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error inserting leaderboard entry:', err);
    return null;
  }
};

export const updateLeaderboardEntry = async (id: number, newScore: number): Promise<LeaderboardEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .update({ score: newScore })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating leaderboard entry:', err);
    return null;
  }
};