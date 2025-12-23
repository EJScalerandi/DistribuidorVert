// src/api/odoo.js
const BASE_URL = import.meta.env.VITE_ODOO_BASE_URL;
const ODOO_USER = import.meta.env.VITE_ODOO_USER;
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY;

// Header de Basic Auth (user:api_key)
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

// Helper para aceptar distintos formatos de respuesta:
//  - [ ... ]
//  - { data: [ ... ] }
//  - { products: [ ... ] }
function parseDataArray(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  if (json && Array.isArray(json.products)) return json.products;
  return [];
}

// ===== ENTREGAS / PICKINGS =====

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
  return parseDataArray(data);
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

// ===== PRODUCTOS (lista VIP / Vert Deco) =====

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
  return parseDataArray(data);
}

// ===== DISTRIBUIDORES (partners con etiqueta Distribuidor) =====

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
  return parseDataArray(data);
}

// ===== COTIZACIONES =====

export async function createQuotation(payload) {
  const res = await fetch(`${BASE_URL}/distributor/api/quotations`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  // Puede venir como {name, order_id} o envuelto en data
  if (data && data.data) return data.data;
  return data;
}
