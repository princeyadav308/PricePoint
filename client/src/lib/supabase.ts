import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase Environment Variables');
}

/**
 * ARCHITECTURAL CONSTRAINT:
 * This Supabase client is configured strictly for AUTHENTICATION purposes 
 * (Login, Signup, Session Management).
 * 
 * DO NOT use this client to query or mutate database tables directly from the React frontend.
 * All database operations must go through the Node.js Fastify backend via Prisma.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
