import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env or hardcode from supabase.js if possible
// Let's just read it from the src/lib/supabase.js file to be sure
const supabaseContent = fs.readFileSync(path.join(process.cwd(), 'src/lib/supabase.js'), 'utf8');
const urlMatch = supabaseContent.match(/supabaseUrl\s*=\s*['"`](.*?)['"`]/);
const keyMatch = supabaseContent.match(/supabaseKey\s*=\s*['"`](.*?)['"`]/);

if (!urlMatch || !keyMatch) {
  console.log("Could not find Supabase credentials");
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function testOrder() {
  const orderId = `ORD-TEST`;
  const newOrder = {
    id_orden: orderId,
    total: 100,
    nombre_vendedora: 'Test Vendedora',
    estado: 'PENDIENTE',
    items: []
  };

  const { data, error } = await supabase.from('orders').insert([newOrder]);
  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("Order created successfully:", data);
  }
}

testOrder();
