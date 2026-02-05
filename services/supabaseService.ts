import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. App will fall back to local state until configured.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLE_NAME = 'game_sessions';
const SESSION_ID = 'default-session'; // You can make this dynamic later

export const syncGameState = async (state: any) => {
    if (!supabaseUrl || !supabaseAnonKey) return;

    const { error } = await supabase
        .from(TABLE_NAME)
        .upsert({
            id: SESSION_ID,
            state,
            updated_at: new Date().toISOString()
        });

    if (error) console.error('Error syncing to Supabase:', error);
};

export const subscribeToGameUpdates = (onUpdate: (state: any) => void) => {
    if (!supabaseUrl || !supabaseAnonKey) return () => { };

    const channel = supabase
        .channel('public:game_sessions')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: TABLE_NAME,
                filter: `id=eq.${SESSION_ID}`
            },
            (payload) => {
                if (payload.new && (payload.new as any).state) {
                    onUpdate((payload.new as any).state);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const fetchInitialGameState = async () => {
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('state')
        .eq('id', SESSION_ID)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // No session exists yet, which is fine
        }
        console.error('Supabase fetch error:', error);
        return null;
    }
    return data?.state;
};
