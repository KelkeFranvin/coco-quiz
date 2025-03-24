import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yglqdwqveywfzqnsygpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbHFkd3F2ZXl3ZnpxbnN5Z3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTA1OTQsImV4cCI6MjA1NzI4NjU5NH0.cbVJmZKU3fE4EltrAPu08HY6wVMSK0oYsQufcXphvLg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 