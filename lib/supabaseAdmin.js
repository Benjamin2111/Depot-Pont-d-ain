import { createClient } from '@supabase/supabase-js';

// N'IMPORTER CE FICHIER QUE DANS DU CODE SERVEUR (app/api/.../route.js)
// La clé service_role donne tous les droits : elle ne doit jamais atteindre le navigateur.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante dans les variables d\'environnement');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
