import "server-only";

/**
 * Minimal Supabase (PostgREST) writer using the service-role key. Runs on the
 * server only — the key is never exposed to the browser. Tables are defined in
 * supabase/schema.sql.
 */
function credentials() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

export function isStoreConfigured(): boolean {
  return credentials() !== null;
}

export async function insertRow<T extends Record<string, unknown>>(
  table: "orders" | "newsletter_subscribers" | "contact_messages",
  row: T,
  options: { ignoreDuplicates?: boolean } = {},
): Promise<void> {
  const creds = credentials();
  if (!creds) throw new Error("Supabase is not configured");

  const prefer = ["return=minimal"];
  if (options.ignoreDuplicates) prefer.push("resolution=ignore-duplicates");

  const res = await fetch(`${creds.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: creds.key,
      Authorization: `Bearer ${creds.key}`,
      "Content-Type": "application/json",
      Prefer: prefer.join(","),
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase insert into ${table} failed: ${res.status} ${await res.text()}`);
  }
}
