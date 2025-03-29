import { supabase } from '../supabaseClient'

export interface buzzer {
    id: string
    username: string
    timestamp: string
}

export const submitBuzz = async (username: string) => {
    try {
        const { data, error } = await supabase
          .from('buzzers')
            .insert([{
                username,
                timestamp: new Date().toISOString(),
            }])
            .select()
            .single()

        if (error) throw error

        return data // Return the newly created buzzer data
    } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to submit buzz')
    }
}

export const fetchBuzzers = async () => {
    try {
        const { data, error } = await supabase
            .from('buzzers')
            .select('*')
            .order('timestamp', { ascending: true });

        if (error) throw error;

        const latestBuzzers = data.reduce<buzzer[]>((buzzers: buzzer[], current: buzzer) => {
            if (!buzzers.some(b => b.username === current.username)) {
                buzzers.push(current);
            }
            return buzzers;
        }, []);

        console.log("Fetched latest buzzer click data:", latestBuzzers);
        return latestBuzzers; // Return only the buzzers
    } catch (err) {
        console.error("Error fetching buzzer clicks:", err);
        return []; // Return an empty array on error
    }
}

export const resetIndividualBuzzer = async (buzzerUsername: string) => {
    try {
        const { error: deleteError } = await supabase
        .from('buzzers')
        .delete()
        .eq('username', buzzerUsername)
        if (deleteError) throw deleteError
        await fetchBuzzers() // Refresh both lists
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to reset individual Buzzer');
    }
}

export const resetAllBuzzer = async () => {
    try {
        const { error: deleteError } = await supabase
            .from('buzzers')
            .delete()
            .neq('username', ''); // This condition will match all records since all usernames are non-empty

        if (deleteError) {
            console.error("Delete error:", deleteError); // Log the error
            throw deleteError;
        }

        // Fetch the updated buzzer count after deletion
        const buzzers = await fetchBuzzers();
        return buzzers.length; // Return the new count
    } catch (err) {
        console.error("Error in resetAllBuzzer:", err); // Log the error
        throw err instanceof Error ? err : new Error('Failed to reset all Buzzers');
    }
}