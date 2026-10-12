/**
 * GharPay API client
 * - Sends Bearer token from memory (accessToken stored in AuthContext)
 * - On 401, tries POST /api/auth/refresh (httpOnly cookie carries refresh token)
 * - Re-tries the original request once after a successful token refresh
 */

let _accessToken = null;
let _refreshPromise = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

async function tryRefresh() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include', // send httpOnly cookie
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      const { data } = await res.json();
      setAccessToken(data.accessToken);
      return data;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

/**
 * Core fetch wrapper. Automatically attaches Bearer token and retries once on 401.
 */
export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const res = await fetch(path, { ...options, headers, credentials: 'include' });

  // Token expired — try silent refresh then replay
  if (res.status === 401) {
    try {
      await tryRefresh();
      const retryHeaders = { ...headers, Authorization: `Bearer ${_accessToken}` };
      return fetch(path, { ...options, headers: retryHeaders, credentials: 'include' });
    } catch {
      setAccessToken(null);
      throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
    }
  }

  return res;
}

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Parse JSON response; throw ApiError on non-2xx.
 */
async function parseResponse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.error?.code ?? 'UNKNOWN',
      json.error?.message ?? `Request failed with status ${res.status}`,
    );
  }
  return json.data;
}

/* ─── Auth ─────────────────────────────────────────────────────────────────── */

export const auth = {
  register: (body) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  login: (body) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  refresh: () =>
    apiFetch('/api/auth/refresh', { method: 'POST' }).then(parseResponse),

  logout: () =>
    apiFetch('/api/auth/logout', { method: 'POST' }).then(parseResponse),
};

/* ─── Properties ───────────────────────────────────────────────────────────── */

export const properties = {
  list: () =>
    apiFetch('/api/properties').then(parseResponse),

  get: (id) =>
    apiFetch(`/api/properties/${id}`).then(parseResponse),

  create: (body) =>
    apiFetch('/api/properties', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  update: (id, body) =>
    apiFetch(`/api/properties/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(parseResponse),
};

/* ─── Units ────────────────────────────────────────────────────────────────── */

export const units = {
  list: (propertyId) =>
    apiFetch(`/api/properties/${propertyId}/units`).then(parseResponse),

  create: (propertyId, body) =>
    apiFetch(`/api/properties/${propertyId}/units`, { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  update: (propertyId, unitId, body) =>
    apiFetch(`/api/properties/${propertyId}/units/${unitId}`, { method: 'PATCH', body: JSON.stringify(body) }).then(parseResponse),
};

/* ─── Tenancies ────────────────────────────────────────────────────────────── */

export const tenancies = {
  list: () =>
    apiFetch('/api/tenancies').then(parseResponse),

  get: (id) =>
    apiFetch(`/api/tenancies/${id}`).then(parseResponse),

  create: (body) =>
    apiFetch('/api/tenancies', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  update: (id, body) =>
    apiFetch(`/api/tenancies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(parseResponse),

  end: (id) =>
    apiFetch(`/api/tenancies/${id}/end`, { method: 'POST' }).then(parseResponse),
};

/* ─── Bills ────────────────────────────────────────────────────────────────── */

export const bills = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/bills${qs ? `?${qs}` : ''}`).then(parseResponse);
  },

  get: (id) =>
    apiFetch(`/api/bills/${id}`).then(parseResponse),

  create: (body) =>
    apiFetch('/api/bills', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  update: (id, body) =>
    apiFetch(`/api/bills/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(parseResponse),

  send: (id) =>
    apiFetch(`/api/bills/${id}/send`, { method: 'POST' }).then(parseResponse),
};

/* ─── Payments ─────────────────────────────────────────────────────────────── */

export const payments = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/payments${qs ? `?${qs}` : ''}`).then(parseResponse);
  },

  get: (id) =>
    apiFetch(`/api/payments/${id}`).then(parseResponse),

  submit: (body) =>
    apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  verify: (id) =>
    apiFetch(`/api/payments/${id}/verify`, { method: 'POST' }).then(parseResponse),

  reject: (id, body) =>
    apiFetch(`/api/payments/${id}/reject`, { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),
};

/* ─── Payment Methods ──────────────────────────────────────────────────────── */

export const paymentMethods = {
  list: () =>
    apiFetch('/api/payment-methods').then(parseResponse),

  create: (body) =>
    apiFetch('/api/payment-methods', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  delete: (id) =>
    apiFetch(`/api/payment-methods/${id}`, { method: 'DELETE' }).then(parseResponse),
};

/* ─── Invitations ──────────────────────────────────────────────────────────── */

export const invitations = {
  send: (body) =>
    apiFetch('/api/invitations', { method: 'POST', body: JSON.stringify(body) }).then(parseResponse),

  accept: (token) =>
    apiFetch(`/api/invitations/${token}/accept`, { method: 'POST' }).then(parseResponse),
};
