require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Service key / anon key

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales de Supabase en el .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
