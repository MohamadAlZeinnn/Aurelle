import { HttpError, notFound, validate } from '../http.js';
import { newId } from '../db.js';
import { addressSchema, changePasswordSchema, forgotPasswordSchema, loginSchema, passwordSchema, profileSchema, registerSchema } from '../../../lib/validation.js';
import { normalizeLebanesePhone } from '../../../lib/phone.js';

// Demo-only hashing. Production: ASP.NET Identity (PBKDF2) or Argon2, never client-side.
async function hashPassword(email, password) {
  const data = new TextEncoder().encode(`luma-demo:${email.toLowerCase()}:${password}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const randomToken = () => {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  fullName: u.fullName,
  email: u.email,
  phone: u.phone,
  marketingOptIn: Boolean(u.marketingOptIn),
  createdAt: u.createdAt,
  addresses: u.addresses,
});

function startSession(db, user) {
  const token = randomToken();
  db.sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
  return { token, user: publicUser(user) };
}

export function registerAuthRoutes(router) {
  router.post('/auth/register', async ({ db, body }) => {
    const data = validate(registerSchema, body);
    const email = data.email.toLowerCase();
    if (db.users.some((u) => u.email === email))
      throw new HttpError(409, 'An account with this email already exists. Try signing in instead.', { code: 'EMAIL_TAKEN', errors: { email: 'This email is already registered.' } });
    const user = {
      id: newId('u'),
      role: 'customer',
      fullName: data.fullName,
      email,
      phone: normalizeLebanesePhone(data.phone),
      passwordHash: await hashPassword(email, data.password),
      marketingOptIn: Boolean(data.marketingOptIn),
      createdAt: new Date().toISOString(),
      addresses: [],
    };
    db.users.push(user);
    return startSession(db, user);
  });

  router.post('/auth/login', async ({ db, body }) => {
    const data = validate(loginSchema, body);
    const email = data.email.toLowerCase();
    const user = db.users.find((u) => u.email === email);
    const hash = await hashPassword(email, data.password);
    // Same message for unknown email and wrong password to avoid account enumeration.
    if (!user || user.passwordHash !== hash) throw new HttpError(401, 'That email and password combination did not match our records.', { code: 'INVALID_CREDENTIALS' });
    return startSession(db, user);
  });

  router.post('/auth/logout', ({ db, token }) => {
    if (token) delete db.sessions[token];
    return { ok: true };
  });

  router.get('/auth/me', ({ user }) => publicUser(user), { auth: 'user' });

  router.post('/auth/forgot-password', ({ db, body }) => {
    const { email } = validate(forgotPasswordSchema, body);
    const user = db.users.find((u) => u.email === email.toLowerCase());
    let demoResetToken = null;
    if (user) {
      demoResetToken = randomToken();
      db.passwordResets.push({ token: demoResetToken, userId: user.id, expiresAt: new Date(Date.now() + 3600_000).toISOString(), used: false });
    }
    // Production: always return the same response and email the link. The demo exposes the
    // token so the reset flow can be tried without an email service.
    return { ok: true, demoResetToken };
  });

  router.post('/auth/reset-password', async ({ db, body }) => {
    const reset = db.passwordResets.find((r) => r.token === body?.token && !r.used);
    if (!reset || new Date(reset.expiresAt) < new Date()) throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');
    const parsed = passwordSchema.safeParse(body?.password);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message, { errors: { password: parsed.error.issues[0].message } });
    const user = db.users.find((u) => u.id === reset.userId);
    user.passwordHash = await hashPassword(user.email, body.password);
    reset.used = true;
    // Sign out other sessions after a password change.
    Object.keys(db.sessions).forEach((t) => db.sessions[t].userId === user.id && delete db.sessions[t]);
    return { ok: true };
  });

  router.put(
    '/account/profile',
    ({ db, body, user }) => {
      const data = validate(profileSchema, body);
      const email = data.email.toLowerCase();
      if (db.users.some((u) => u.email === email && u.id !== user.id)) throw new HttpError(409, 'This email is used by another account.', { errors: { email: 'This email is used by another account.' } });
      const u = db.users.find((x) => x.id === user.id);
      Object.assign(u, { fullName: data.fullName, email, phone: normalizeLebanesePhone(data.phone), marketingOptIn: Boolean(data.marketingOptIn) });
      return publicUser(u);
    },
    { auth: 'user' }
  );

  router.post(
    '/account/password',
    async ({ db, body, user, token }) => {
      const data = validate(changePasswordSchema, body);
      const u = db.users.find((x) => x.id === user.id);
      if (u.passwordHash !== (await hashPassword(u.email, data.currentPassword)))
        throw new HttpError(400, 'Your current password is incorrect.', { errors: { currentPassword: 'Your current password is incorrect.' } });
      u.passwordHash = await hashPassword(u.email, data.newPassword);
      Object.keys(db.sessions).forEach((t) => t !== token && db.sessions[t].userId === u.id && delete db.sessions[t]);
      return { ok: true };
    },
    { auth: 'user' }
  );

  const ensureSingleDefault = (u, id) => u.addresses.forEach((a) => (a.isDefault = a.id === id));

  router.post(
    '/account/addresses',
    ({ db, body, user }) => {
      const data = validate(addressSchema, body);
      const u = db.users.find((x) => x.id === user.id);
      const address = { id: newId('ad'), ...data, label: data.label || 'Address', isDefault: Boolean(data.isDefault) || u.addresses.length === 0 };
      u.addresses.push(address);
      if (address.isDefault) ensureSingleDefault(u, address.id);
      return publicUser(u);
    },
    { auth: 'user' }
  );

  router.put(
    '/account/addresses/:id',
    ({ db, body, user, params }) => {
      const data = validate(addressSchema, body);
      const u = db.users.find((x) => x.id === user.id);
      const address = u.addresses.find((a) => a.id === params.id);
      if (!address) throw notFound('Address');
      Object.assign(address, data, { label: data.label || address.label });
      if (data.isDefault) ensureSingleDefault(u, address.id);
      return publicUser(u);
    },
    { auth: 'user' }
  );

  router.delete(
    '/account/addresses/:id',
    ({ db, user, params }) => {
      const u = db.users.find((x) => x.id === user.id);
      const wasDefault = u.addresses.find((a) => a.id === params.id)?.isDefault;
      u.addresses = u.addresses.filter((a) => a.id !== params.id);
      if (wasDefault && u.addresses[0]) u.addresses[0].isDefault = true;
      return publicUser(u);
    },
    { auth: 'user' }
  );
}
