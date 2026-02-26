import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://lvdfpervrioydnvzrbvp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZGZwZXJ2cmlveWRudnpyYnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3Njk1MzQsImV4cCI6MjA4NzM0NTUzNH0.39yJpRSC7pNxLYtj-w_0K1oWvoM_Z3rBrnooRTc_dLY';

// Initialize a generic client strictly for validating Auth Tokens from the frontend
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
