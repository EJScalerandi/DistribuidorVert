const BASE_URL = import.meta.env.VITE_ODOO_BASE_URL;
const ODOO_USER = import.meta.env.VITE_ODOO_USER;
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY;

let ODOO_DISTRIBUTOR_ID = null;

export function setOdooDistributorId(value) {
  const v = value == null ? null : Number(value);
  ODOO_DISTRIBUTOR_ID = Number.isFinite(v) ? v : null;
}

function requireDistributorId() {
  if (ODOO_DISTRIBUTOR_ID == null) {
    throw new Error('No hay odoo_distributor_id seteado. Falta login o sesión.');
  }
}

const AUTH_HEADER =
  ODOO_USER && ODOO_API_KEY
    ? 'Basic ' + btoa(`${ODOO_USER}:${ODOO_API_KEY}`)
    : null;

function getHeaders({ isJson = false, includeAuth = true } = {}) {
  requireDistributorId();

  const headers = {};
  if (includeAuth && AUTH_HEADER) headers.Authorization = AUTH_HEADER;
  if (isJson) headers['Content-Type'] = 'application/json';

  headers['X-Distributor-Id'] = String(ODOO_DISTRIBUTOR_ID);
  return headers;
}

// === PICKINGS =====================================================

export async function fetchPickings() {
  const res = await fetch(`${BASE_URL}/distributor/api/pickings`, {
    method: 'GET',
    headers: getHeaders({ isJson: false, includeAuth: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data || [];
}

export async function setFinalCustomer(pickingId, payload) {
  const res = await fetch(
    `${BASE_URL}/distributor/api/pickings/${pickingId}/final_customer`,
    {
      method: 'POST',
      headers: getHeaders({ isJson: true, includeAuth: true }),
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return await res.json();
}

// === PRODUCTOS ====================================================

export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/distributor/api/products`, {
    method: 'GET',
    headers: getHeaders({ isJson: false, includeAuth: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data || [];
}

// === DISTRIBUIDORES ==============================================

export async function fetchDistributors() {
  const res = await fetch(`${BASE_URL}/distributor/api/distributors`, {
    method: 'GET',
    headers: getHeaders({ isJson: false, includeAuth: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data || [];
}

// === COTIZACIONES ==================================================
// POST simple para evitar preflight CORS:
// - Sin Authorization
// - Content-Type: text/plain
// - Igual enviamos X-Distributor-Id (obligatorio)

export async function createQuotation(payload) {
  requireDistributorId();

  const headers = {
    'Content-Type': 'text/plain',
    'X-Distributor-Id': String(ODOO_DISTRIBUTOR_ID),
  };

  const res = await fetch(`${BASE_URL}/distributor/api/quotations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return await res.json();
}
