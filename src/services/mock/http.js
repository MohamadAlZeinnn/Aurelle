// Minimal HTTP primitives for the demo server.
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = extra.code;
    this.errors = extra.errors;
    this.details = extra.details;
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found.`, { code: 'NOT_FOUND' });
export const badRequest = (message, errors) => new HttpError(400, message, { code: 'VALIDATION_FAILED', errors });

// Parses a zod schema or throws a 400 with field errors.
export function validate(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const errors = Object.fromEntries(result.error.issues.map((i) => [i.path.join('.') || '_', i.message]));
    throw badRequest('Please check the highlighted fields.', errors);
  }
  return result.data;
}

export function createRouter() {
  const routes = [];
  const add = (method) => (path, handler, options = {}) => {
    const keys = [];
    const pattern = new RegExp(
      '^' +
        path.replace(/\/:([A-Za-z_]+)/g, (_, k) => {
          keys.push(k);
          return '/([^/]+)';
        }) +
        '/?$'
    );
    routes.push({ method, pattern, keys, handler, auth: options.auth ?? null });
  };
  return {
    routes,
    get: add('GET'),
    post: add('POST'),
    put: add('PUT'),
    patch: add('PATCH'),
    delete: add('DELETE'),
    match(method, pathname) {
      for (const r of routes) {
        if (r.method !== method) continue;
        const m = pathname.match(r.pattern);
        if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
      }
      return null;
    },
  };
}

export const paginate = (items, page = 1, pageSize = 20) => {
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  return { items: items.slice((current - 1) * size, current * size), total, page: current, pageSize: size, pages };
};
