import { supabase } from '../supabaseClient'

export const changeQuestionType = async (questiontype: string) => {
    try {
        const { data, error } = await supabase
            .from('questiontype')
            .update({ questiontype })
            .eq('id', 1)
            .select()
            .single()

        if (error) throw error

        return data
    } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to submit questiontype')
    }
}

export const fetchQuestionType = async () => {
    try {
        const { data, error } = await supabase
            .from('questiontype')
            .select('*')
            .eq('id', 1)

        if (error) throw error

        console.log("Fetched question type data:", data)
        return data
    } catch (err) {
        console.error("Error fetching question type:", err)
        return null
    }
}