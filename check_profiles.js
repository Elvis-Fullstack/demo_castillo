import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://daklggrpyuttiyqtuoxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRha2xnZ3JweXV0dGl5cXR1b3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTE3OTAsImV4cCI6MjEwNDk4Nzc5MH0.LFk2hTiSd6bnXgt19IvK_arsyRf2qrZwANZkhaG0qFY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  const { data, error } = await supabase.functions.invoke('create-employee', {
    body: {
      email: 'administrador@elcastillo.com',
      password: 'admin123',
      full_name: 'Administrador Supremo',
      role: 'admin'
    }
  });

  if (error) {
    console.error('Failed to invoke edge function:', error);
    try {
      const text = await error.context.text();
      console.log('Error details:', text);
    } catch (e) {}
  } else {
    console.log('Edge function success:', data);
  }
}

createAdminUser();
