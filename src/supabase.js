const supabaseUrl = 'https://xnftdketmzuffmqqasux.supabase.co';
const supabaseKey = 'sb_publishable_4sAPDp-ZcVL5oT0MuKX__Q_VjuB9uST';

// Use the global window/globalThis supabase client loaded via the UMD script
export const supabase = globalThis.supabase 
  ? globalThis.supabase.createClient(supabaseUrl, supabaseKey)
  : null;
