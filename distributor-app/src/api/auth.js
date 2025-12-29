import { supabase } from '../lib/supabaseClient';

export async function loginDistributorSimple(username, password) {
  const u = (username || '').trim();
  const p = password || '';

  if (!u || !p) {
    throw new Error('Usuario y contraseña son obligatorios.');
  }

  const { data, error } = await supabase
    .schema('public')
    .rpc('verify_distributor_login_simple', {
      p_username: u,
      p_password: p,
    });

  if (error) throw new Error(error.message || 'Error validando credenciales.');

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.ok) return { ok: false };

  return {
    ok: true,
    login_id: row.login_id,
    odoo_distributor_id: row.odoo_distributor_id ?? null,
  };
}
