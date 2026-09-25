import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://daklggrpyuttiyqtuoxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRha2xnZ3JweXV0dGl5cXR1b3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTE3OTAsImV4cCI6MjEwNDk4Nzc5MH0.LFk2hTiSd6bnXgt19IvK_arsyRf2qrZwANZkhaG0qFY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  /*
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'admin@elcastillo.com',
    password: 'admin123',
    options: {
      data: {
        full_name: 'Administrador',
        role: 'manager'
      }
    }
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    return;
  }

  console.log('User created:', authData.user?.email);
  */

  // 2. Add them to the profiles table
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  console.log('Profiles data:', profiles);
}

createAdmin();
