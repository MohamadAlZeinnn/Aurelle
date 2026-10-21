// Axios adapter that routes requests to the in-browser demo server.
// Because the app always goes through Axios, switching to a real API only means
// removing this adapter (VITE_API_MODE=live).
import { AxiosError } from 'axios';
import { createRouter, HttpError } from './http.js';
import { getDb, persist } from './db.js';
import { registerCatalogRoutes } from './routes/catalog.js';
import { registerOrderRoutes } from './routes/orders.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerAdminCatalogRoutes } from './routes/adminCatalog.js';
import { registerAdminOrderRoutes } from './routes/adminOrders.js';
import { registerAdminMiscRoutes } from './routes/adminMisc.js';

const router = createRouter();
registerCatalogRoutes(router);
registerOrderRoutes(router);
registerAuthRoutes(router);
registerAdminCatalogRoutes(router);
registerAdminOrderRoutes(router);
registerAdminMiscRoutes(router);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

function normalizeHeaders(headers) {
  const out = {};
  const source = typeof headers?.toJSON === 'function' ? headers.toJSON() : headers || {};
  for (const [k, v] of Object.entries(source)) out[k.toLowerCase()] = v;
  return out;
}

/** Dispatches a request directly (used by the adapter and by tests). */
export async function handleRequest({ method = 'GET', url, params = {}, data, headers = {} }) {
  const db = getDb();
  const parsed = new URL(url, 'http://demo.local');
  const query = { ...Object.fromEntries(parsed.searchParams), ...params };
  const h = normalizeHeaders(headers);
  const token = (h.authorization || '').replace(/^Bearer\s+/i, '') || null;
  const session = token ? db.sessions[token] : null;
  const user = session ? db.users.find((u) => u.id === session.userId) : null;

  const match = router.match(method.toUpperCase(), parsed.pathname);
  if (!match) throw new HttpError(404, `No demo endpoint for ${method.toUpperCase()} ${parsed.pathname}.`);
  const { route, params: pathParams } = match;
  if (route.auth && !user) throw new HttpError(401, 'Please sign in to continue.', { code: 'UNAUTHENTICATED' });
  if (route.auth === 'admin' && user.role !== 'admin') throw new HttpError(403, 'You do not have permission to do that.', { code: 'FORBIDDEN' });

  const body = typeof data === 'string' && data ? JSON.parse(data) : data;
  const result = await route.handler({ db, params: pathParams, query, body, headers: h, user, token });
  if (method.toUpperCase() !== 'GET' && !persist()) {
    throw new HttpError(507, 'The demo store ran out of browser storage (large images use a lot of space). Remove some uploaded images or reset the demo data.');
  }
  return clone(result);
}

export async function mockAdapter(config, latency = 300) {
  // Simulate realistic network timing so loading states are visible.
  await sleep(latency * (0.6 + Math.random() * 0.8));
  try {
    const data = await handleRequest({ method: config.method, url: config.url, params: config.params, data: config.data, headers: config.headers });
    return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (!(err instanceof HttpError)) console.error('[demo server]', err);
    const response = {
      data: { message: err instanceof HttpError ? err.message : 'Something went wrong on our side. Please try again.', code: err.code, errors: err.errors, details: err.details },
      status,
      statusText: 'Error',
      headers: {},
      config,
      request: {},
    };
    throw new AxiosError(response.data.message, status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, response);
  }
}
