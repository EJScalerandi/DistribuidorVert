// src/api/odoo.js
const BASE_URL = import.meta.env.VITE_ODOO_BASE_URL;
const ODOO_USER = import.meta.env.VITE_ODOO_USER;
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY;

// Armamos header Basic Auth (lo usamos en los GET/POST simples)
const AUTH_HEADER =
  ODOO_USER && ODOO_API_KEY
    ? 'Basic ' + btoa(`${ODOO_USER}:${ODOO_API_KEY}`)
    : null;

function getHeaders(isJson = false) {
  const headers = {};
  if (AUTH_HEADER) {
    headers['Authorization'] = AUTH_HEADER;
  }
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

// === PICKINGS =====================================================

export async function fetchPickings() {
  const res = await fetch(`${BASE_URL}/distributor/api/pickings`, {
    method: 'GET',
    headers: getHeaders(false),
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
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return await res.json();
}

// === PRODUCTOS (Lista Vip) =======================================

export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/distributor/api/products`, {
    method: 'GET',
    headers: getHeaders(false),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data || [];
}

// === DISTRIBUIDORES (partners con etiqueta Distribuidor) =========

export async function fetchDistributors() {
  const res = await fetch(`${BASE_URL}/distributor/api/distributors`, {
    method: 'GET',
    headers: getHeaders(false),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data || [];
}

// === COTIZACIONES (POST) =========================================
// Acá hacemos el POST "simple" para evitar problemas de preflight CORS.
// - Sin Authorization
// - Content-Type: text/plain
// El body sigue siendo JSON y el controlador de Odoo lo parsea igual.

export async function createQuotation(payload) {
  const res = await fetch(`${BASE_URL}/distributor/api/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return await res.json();
}
