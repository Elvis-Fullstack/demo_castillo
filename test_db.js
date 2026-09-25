import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://daklggrpyuttiyqtuoxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRha2xnZ3JweXV0dGl5cXR1b3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTE3OTAsImV4cCI6MjEwNDk4Nzc5MH0.LFk2hTiSd6bnXgt19IvK_arsyRf2qrZwANZkhaG0qFY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing insert to products...');
  const { data, error } = await supabase.from('products').insert([
    {
      sku: 'TEST-' + Date.now(),
      name: 'Test Product',
      description: 'Testing',
      cost: 10,
      price: 20,
      stock_warehouse: 10,
      stock_sales_floor: 5,
      min_stock_alert: 5
    }
  ]);
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

test();
