import axios from 'axios';
import { API_BASE_URL, DEMO_LATENCY_MS, IS_DEMO } from '../../config/env.js';
import { demoSession } from './session.js';

/**
 * Single HTTP client for the app.
 *  - live mode: talks to the real API. Authentication is expected to use secure, httpOnly,
 *    SameSite cookies issued by the server (withCredentials) — no tokens in JS storage.
 *  - demo mode: requests are served by the in-browser mock server via a custom adapter.
 */
export const api = axios.create({
  baseURL: IS_DEMO ? '' : API_BASE_URL,
  withCredentials: !IS_DEMO,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

if (IS_DEMO) {
  // Lazy-load the demo server so it is excluded from live builds' critical path.
  const serverPromise = import('../mock/server.js');
  api.defaults.adapter = async (config) => {
    const { mockAdapter } = await serverPromise;
    return mockAdapter(config, DEMO_LATENCY_MS);
  };
  api.interceptors.request.use((config) => {
    const token = demoSession.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

const listeners = new Set();
/** Subscribe to 401 responses (e.g. to clear the signed-in user). */
export const onUnauthorized = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) listeners.forEach((fn) => fn(error));
    return Promise.reject(normalizeError(error));
  }
);

/** Converts any Axios error into a predictable shape for the UI. */
export function normalizeError(error) {
  if (error?.isApiError) return error;
  const res = error?.response;
  const out = new Error(
    res?.data?.message ||
      (error?.code === 'ECONNABORTED'
        ? 'The request took too long. Please check your connection and try again.'
        : !res
          ? 'We could not reach the server. Please check your connection and try again.'
          : 'Something went wrong. Please try again.')
  );
  out.isApiError = true;
  out.status = res?.status ?? 0;
  out.code = res?.data?.code;
  out.fieldErrors = res?.data?.errors || null;
  out.details = res?.data?.details || null;
  return out;
}
