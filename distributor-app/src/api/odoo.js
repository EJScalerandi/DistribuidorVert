// src/api/odoo.js
const BASE_URL = import.meta.env.VITE_ODOO_BASE_URL;
const ODOO_USER = import.meta.env.VITE_ODOO_USER;
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY;

// Armamos header Basic Auth (servirá cuando vuelvas a auth="user")
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
