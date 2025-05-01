import { supabase } from '../supabaseClient'
import { sleep } from '../utils'

export const animation = async (animation: string) => {
    try {
        const { data, error } = await supabase
            .from('animation')
            .update({ animation })
            .eq('id', 1)
            .select()
            .single()

        if (error) throw error

        await sleep(2000)

        const { data: resetData, error: resetError } = await supabase
            .from('animation')
            .update({ animation: "Sigma sigma boy" })
            .eq('id', 1)
            .select()
            .single()

        if (resetError) throw resetError

        return data
    } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to submit animation')
    }
}

export const fetchAnimation = async () => {
    try {
        const { data, error } = await supabase
            .from('animation')
            .select('*')
            .eq('id', 1)

        if (error) throw error

        console.log("Fetched animation data:", data)
        return data
    } catch (err) {
        console.error("Error fetching animation:", err)
        return null
    }
}