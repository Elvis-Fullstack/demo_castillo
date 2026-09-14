import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://daklggrpyuttiyqtuoxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRha2xnZ3JweXV0dGl5cXR1b3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTE3OTAsImV4cCI6MjEwNDk4Nzc5MH0.LFk2hTiSd6bnXgt19IvK_arsyRf2qrZwANZkhaG0qFY';

export const supabase = createClient(supabaseUrl, supabaseKey);
